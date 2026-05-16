import type { AppState } from '@/domain/types';
import { seedState } from './seed';

const KEY = 'genesys:v0.9';
const LEGACY_KEYS = ['genesys:v0.8', 'genesys:v0.7', 'genesys:v0.6', 'genesys:v0.5', 'genesys:v0.4', 'genesys:v0.3', 'genesys:v0.2', 'genesys:v0.1', 'genesis:v0.1'];

/** Defensive migration — make sure every entity matches the current schema. */
function migrate(state: AppState): AppState {
  return {
    ...state,
    startups: state.startups.map((s) => ({
      ...s,
      // FEAT-GEN-019 — hashtags became required; old snapshots may not have it.
      hashtags: Array.isArray(s.hashtags) && s.hashtags.length > 0
        ? s.hashtags
        : [s.category?.toLowerCase?.() || 'imported'],
      landingUrl: s.landingUrl,
    })),
  };
}

function shapeLooksValid(s: any): s is AppState {
  return !!s
    && Array.isArray(s.users)
    && Array.isArray(s.batches)
    && Array.isArray(s.startups)
    && Array.isArray(s.specs)
    && Array.isArray(s.investments);
}

export function loadState(): AppState {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return seedState();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (shapeLooksValid(parsed)) return migrate(parsed);
    }
    // Drop any legacy key so the next persist doesn't fight stale state.
    for (const k of LEGACY_KEYS) localStorage.removeItem(k);
    const fresh = seedState();
    localStorage.setItem(KEY, JSON.stringify(fresh));
    return fresh;
  } catch {
    return seedState();
  }
}

export function persistState(state: AppState): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

export function resetState(): AppState {
  const s = seedState();
  persistState(s);
  return s;
}
