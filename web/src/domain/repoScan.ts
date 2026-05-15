/**
 * Mock GitHub repo scan. In V1 this is replaced by a real GitHub API call:
 *   GET /repos/{owner}/{repo}/contents/genesys/spec etc.
 * The shape of the result is the same.
 */

export interface MockRepo {
  fullName: string;       // 'owner/repo'
  language: string;
  stars: number;
  pushedDaysAgo: number;
  hasSpec: boolean;
  hasTests: boolean;
  defaultBranch?: string;
}

export type RepoScanResult =
  | { kind: 'found';   specPath: string; testsPath: string; nodeCountHint: number }
  | { kind: 'partial'; specPath: string | null; testsPath: string | null }
  | { kind: 'missing' };

/** FR-GEN-140 — classify by hasSpec/hasTests. Deterministic. */
export function scanRepo(repo: MockRepo): RepoScanResult {
  if (repo.hasSpec && repo.hasTests) {
    return {
      kind: 'found',
      specPath: '/genesys/spec',
      testsPath: '/genesys/tests',
      nodeCountHint: estimateNodeCount(repo),
    };
  }
  if (repo.hasSpec || repo.hasTests) {
    return {
      kind: 'partial',
      specPath: repo.hasSpec ? '/genesys/spec' : null,
      testsPath: repo.hasTests ? '/genesys/tests' : null,
    };
  }
  return { kind: 'missing' };
}

/**
 * Tiny deterministic estimate so the UI can hint "≈48 spec nodes detected".
 * Based on repo identity so reruns return the same number.
 */
function estimateNodeCount(repo: MockRepo): number {
  let h = 0;
  for (let i = 0; i < repo.fullName.length; i++) h = (Math.imul(31, h) + repo.fullName.charCodeAt(i)) | 0;
  const base = 20 + (Math.abs(h) % 60); // 20..79
  return base;
}
