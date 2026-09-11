import type { AppState, Startup } from './types';
import { normalizeTags } from './tags';

export interface CreateStartupArgs {
  batchId: string;
  ownerHandle: string;
  name: string;
  pitch: string;
  category: string;
  description?: string;
  hashtags?: string[];
  landingUrl?: string;
  repo?: string;
  now?: number;
}

export type CreateStartupResult =
  | { ok: true; state: AppState; startup: Startup }
  | { ok: false; reason: 'MISSING_NAME' | 'MISSING_PITCH' | 'MISSING_CATEGORY' | 'DUPLICATE_NAME' | 'BATCH_NOT_FOUND' };

let _seq = 1;

/** FR-GEN-004 / FR-GEN-005 — create startup with validation and name uniqueness in batch. */
export function createStartup(state: AppState, args: CreateStartupArgs): CreateStartupResult {
  const name = args.name.trim();
  const pitch = args.pitch.trim();
  const category = args.category.trim();
  if (!name) return { ok: false, reason: 'MISSING_NAME' };
  if (!pitch) return { ok: false, reason: 'MISSING_PITCH' };
  if (!category) return { ok: false, reason: 'MISSING_CATEGORY' };
  const batch = state.batches.find((b) => b.id === args.batchId);
  if (!batch) return { ok: false, reason: 'BATCH_NOT_FOUND' };

  const duplicate = state.startups.find(
    (s) => s.batchId === args.batchId && s.name.trim().toLowerCase() === name.toLowerCase(),
  );
  if (duplicate) return { ok: false, reason: 'DUPLICATE_NAME' };

  const now = args.now ?? Date.now();
  const id = `S-${now}-${_seq++}`;
  const startup: Startup = {
    id,
    batchId: args.batchId,
    ownerHandle: args.ownerHandle.toLowerCase(),
    name,
    pitch,
    category,
    description: args.description?.trim(),
    hashtags: normalizeTags(args.hashtags ?? [category]),
    landingUrl: args.landingUrl?.trim(),
    repo: args.repo?.trim(),
    published: false,
    createdAt: now,
    techExecution: 40,
    marketPotential: 40,
    pitchScore: 40,
    currentMode: 'MODE-1',
  };
  return {
    ok: true,
    state: { ...state, startups: [...state.startups, startup] },
    startup,
  };
}

/** FR-GEN-014 — attach a `owner/repo` to a startup. */
export function attachRepo(state: AppState, startupId: string, repo: string):
  | { ok: true; state: AppState }
  | { ok: false; reason: 'INVALID_REPO' | 'STARTUP_NOT_FOUND' } {
  const t = repo.trim();
  const m = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/.exec(t);
  if (!m) return { ok: false, reason: 'INVALID_REPO' };
  const found = state.startups.find((s) => s.id === startupId);
  if (!found) return { ok: false, reason: 'STARTUP_NOT_FOUND' };
  const normalized = `${m[1]}/${m[2]}`;
  return {
    ok: true,
    state: { ...state, startups: state.startups.map((s) => (s.id === startupId ? { ...s, repo: normalized } : s)) },
  };
}

export function publishStartup(state: AppState, startupId: string, published: boolean): AppState {
  return {
    ...state,
    startups: state.startups.map((s) => (s.id === startupId ? { ...s, published } : s)),
  };
}
