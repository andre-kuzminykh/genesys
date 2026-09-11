import type { MockRepo } from '@/domain/repoScan';

/**
 * Mocked GitHub repos per allowlisted handle.
 * In V1 this is replaced by a real call to
 *   GET https://api.github.com/users/{handle}/repos
 *   GET https://api.github.com/repos/{owner}/{repo}/contents/{path}
 */
export const MOCK_REPOS: Record<string, MockRepo[]> = {
  alice: [
    { fullName: 'alice/aurora',     language: 'TypeScript', stars: 124, pushedDaysAgo: 1, hasSpec: true,  hasTests: true,  defaultBranch: 'main' },
    { fullName: 'alice/sandbox',    language: 'TypeScript', stars: 4,   pushedDaysAgo: 3, hasSpec: false, hasTests: false, defaultBranch: 'main' },
    { fullName: 'alice/dotfiles',   language: 'Shell',      stars: 1,   pushedDaysAgo: 14,hasSpec: false, hasTests: false, defaultBranch: 'main' },
    { fullName: 'alice/talks',      language: 'Markdown',   stars: 2,   pushedDaysAgo: 7, hasSpec: false, hasTests: true,  defaultBranch: 'main' },
  ],
  bob: [
    { fullName: 'bob/nebula',       language: 'TypeScript', stars: 56,  pushedDaysAgo: 2, hasSpec: true,  hasTests: true,  defaultBranch: 'main' },
    { fullName: 'bob/agent-lab',    language: 'Python',     stars: 9,   pushedDaysAgo: 5, hasSpec: true,  hasTests: false, defaultBranch: 'main' },
    { fullName: 'bob/sample-data',  language: 'Jupyter',    stars: 0,   pushedDaysAgo: 30,hasSpec: false, hasTests: false, defaultBranch: 'main' },
  ],
  carol: [
    { fullName: 'carol/pulse',      language: 'Python',     stars: 220, pushedDaysAgo: 0, hasSpec: true,  hasTests: true,  defaultBranch: 'main' },
    { fullName: 'carol/llm-evals',  language: 'Python',     stars: 31,  pushedDaysAgo: 4, hasSpec: true,  hasTests: true,  defaultBranch: 'main' },
    { fullName: 'carol/scratch',    language: 'Python',     stars: 0,   pushedDaysAgo: 60,hasSpec: false, hasTests: false, defaultBranch: 'main' },
  ],
  dmitry: [
    { fullName: 'dmitry/orbit',         language: 'TypeScript', stars: 14, pushedDaysAgo: 2, hasSpec: false, hasTests: false, defaultBranch: 'main' },
    { fullName: 'dmitry/firmware-tools',language: 'Rust',       stars: 22, pushedDaysAgo: 8, hasSpec: false, hasTests: true,  defaultBranch: 'main' },
  ],
  eva:   [{ fullName: 'eva/lumen',      language: 'TypeScript', stars: 41, pushedDaysAgo: 2, hasSpec: true,  hasTests: true,  defaultBranch: 'main' }],
  frank: [{ fullName: 'frank/echo',     language: 'Python',     stars: 18, pushedDaysAgo: 5, hasSpec: false, hasTests: true,  defaultBranch: 'main' }],
  grace: [{ fullName: 'grace/vector',   language: 'Python',     stars: 73, pushedDaysAgo: 1, hasSpec: true,  hasTests: false, defaultBranch: 'main' }],
  henry: [{ fullName: 'henry/brisk',    language: 'TypeScript', stars: 12, pushedDaysAgo: 0, hasSpec: false, hasTests: false, defaultBranch: 'main' }],
  ivy:   [{ fullName: 'ivy/quill',      language: 'TypeScript', stars: 28, pushedDaysAgo: 3, hasSpec: true,  hasTests: true,  defaultBranch: 'main' }],
  jack:  [{ fullName: 'jack/ember',     language: 'TypeScript', stars: 45, pushedDaysAgo: 1, hasSpec: false, hasTests: false, defaultBranch: 'main' }],
  admin: [
    { fullName: 'admin/genesys-ops', language: 'TypeScript', stars: 200, pushedDaysAgo: 0, hasSpec: true, hasTests: true, defaultBranch: 'main' },
  ],
};

/** Mapping from "we already know this repo == this startup" — used for "open existing" flow. */
export const REPO_TO_STARTUP: Record<string, string> = {
  'alice/aurora': 'S-aurora',
  'bob/nebula':   'S-nebula',
  'carol/pulse':  'S-pulse',
  'dmitry/orbit': 'S-orbit',
  'eva/lumen':    'S-lumen',
  'frank/echo':   'S-echo',
  'grace/vector': 'S-vector',
  'henry/brisk':  'S-brisk',
  'ivy/quill':    'S-quill',
  'jack/ember':   'S-ember',
};

export function reposFor(handle: string): MockRepo[] {
  return MOCK_REPOS[handle.toLowerCase()] ?? [];
}
