/**
 * Real GitHub API wrapper.
 *
 * Browser-only: we don't have a server, so OAuth (which needs a client_secret
 * to exchange the code) is out of scope. Instead we accept a Personal Access
 * Token. The token is held in the in-memory session and persisted to
 * localStorage; it never leaves the user's machine except as the Authorization
 * header on github.com calls.
 *
 * GitHub API endpoints under https://api.github.com support CORS for
 * fetch+Authorization, so all calls below work directly from the browser.
 */

const API = 'https://api.github.com';

export interface GhUser {
  login: string;
  name: string | null;
  avatar_url: string;
}

export interface GhRepo {
  full_name: string;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  default_branch: string;
  private: boolean;
}

export class GhError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'GhError';
  }
}

function headers(token: string): HeadersInit {
  return {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function ghJSON<T>(path: string, token: string): Promise<T> {
  const res = await fetch(API + path, { headers: headers(token) });
  if (!res.ok) {
    let msg = `GitHub ${path} → ${res.status}`;
    try { const j = await res.json(); if (j?.message) msg = j.message; } catch { /* ignore */ }
    throw new GhError(res.status, msg);
  }
  return res.json() as Promise<T>;
}

/** A bare token sanity check: GET /user. Used at login. */
export async function verifyToken(token: string): Promise<GhUser> {
  return ghJSON<GhUser>('/user', token);
}

/** Recently-pushed repos the authenticated user owns, collaborates on, or is an org member of.
 *  Pages through up to 5 pages of 100 (= 500 repos max) so collaborator + org repos
 *  aren't crowded out by a long list of owned repos. */
export async function listRepos(token: string, totalCap = 100): Promise<GhRepo[]> {
  const out: GhRepo[] = [];
  const perPage = 100;
  for (let page = 1; out.length < totalCap && page <= 5; page++) {
    const batch = await ghJSON<GhRepo[]>(
      `/user/repos?sort=pushed&per_page=${perPage}&page=${page}&affiliation=owner,collaborator,organization_member&visibility=all`,
      token,
    );
    if (batch.length === 0) break;
    out.push(...batch);
    if (batch.length < perPage) break;
  }
  return out.slice(0, totalCap);
}

/** True if the path exists (file or directory) on the default branch. */
export async function pathExists(token: string, fullName: string, path: string): Promise<boolean> {
  const res = await fetch(`${API}/repos/${fullName}/contents/${path}`, { headers: headers(token) });
  return res.ok;
}

export interface RealScan {
  fullName: string;
  language: string | null;
  stars: number;
  pushedDaysAgo: number;
  hasSpec: boolean;
  hasTests: boolean;
  defaultBranch: string;
  isPrivate: boolean;
}

const SPEC_PATHS = ['genesys/spec', 'docs/spec', 'SPEC.md'] as const;
const TEST_PATHS = ['genesys/tests', 'tests', '__tests__'] as const;

/** Scan a single repo's default branch for canonical spec/tests locations. */
export async function scanRepoLive(token: string, repo: GhRepo): Promise<RealScan> {
  const days = Math.max(0, Math.floor((Date.now() - Date.parse(repo.pushed_at)) / 86400000));
  // Best-effort: check the canonical /genesys/* first, then alternate paths in parallel.
  const checks = (paths: readonly string[]) => Promise.all(paths.map((p) => pathExists(token, repo.full_name, p)));
  const [specHits, testHits] = await Promise.all([checks(SPEC_PATHS), checks(TEST_PATHS)]);
  return {
    fullName: repo.full_name,
    language: repo.language,
    stars: repo.stargazers_count,
    pushedDaysAgo: days,
    hasSpec: specHits.some(Boolean),
    hasTests: testHits.some(Boolean),
    defaultBranch: repo.default_branch,
    isPrivate: repo.private,
  };
}

/** Convenience: list everything affiliated, then scan the top-N most recently pushed.
 *  Listing is cheap (1-5 calls); scanning is per-repo (≈ 6 paths each), so we cap. */
export async function listAndScan(token: string, listCap = 100, scanCap = 50): Promise<RealScan[]> {
  const repos = await listRepos(token, listCap);
  const top = repos.slice(0, scanCap);
  const scanned = await Promise.all(top.map((r) => scanRepoLive(token, r)));
  // For repos beyond scanCap, return them with hasSpec/hasTests=false (no scan ran).
  const rest: RealScan[] = repos.slice(scanCap).map((r) => ({
    fullName: r.full_name,
    language: r.language,
    stars: r.stargazers_count,
    pushedDaysAgo: Math.max(0, Math.floor((Date.now() - Date.parse(r.pushed_at)) / 86400000)),
    hasSpec: false,
    hasTests: false,
    defaultBranch: r.default_branch,
    isPrivate: r.private,
  }));
  return [...scanned, ...rest];
}

/** Heuristic: does the input look like a GitHub PAT? */
export function looksLikePAT(s: string): boolean {
  return /^(ghp_|github_pat_|gho_|ghs_|ghu_|ghr_)/.test(s.trim());
}
