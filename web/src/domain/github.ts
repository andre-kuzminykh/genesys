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

/** Recently-pushed repos the authenticated user owns or collaborates on. */
export async function listRepos(token: string, perPage = 50): Promise<GhRepo[]> {
  return ghJSON<GhRepo[]>(`/user/repos?sort=pushed&per_page=${perPage}&affiliation=owner,collaborator,organization_member`, token);
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

const SPEC_PATHS = ['genesys/spec', 'docs/spec', 'spec', 'SPEC.md', 'SPEC_v0.1.md'] as const;
const TEST_PATHS = ['genesys/tests', 'tests', '__tests__', 'test', 'spec'] as const;

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

/** Convenience: list + scan in one call, with a hard cap so we don't burn rate limit. */
export async function listAndScan(token: string, cap = 20): Promise<RealScan[]> {
  const repos = await listRepos(token, cap);
  return Promise.all(repos.map((r) => scanRepoLive(token, r)));
}

/** Heuristic: does the input look like a GitHub PAT? */
export function looksLikePAT(s: string): boolean {
  return /^(ghp_|github_pat_|gho_|ghs_|ghu_|ghr_)/.test(s.trim());
}
