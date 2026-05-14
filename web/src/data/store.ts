import type { AppState } from '@/domain/types';
import { seedState } from './seed';

const KEY = 'genesis:v0.1';

export function loadState(): AppState {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return seedState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seedState();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as AppState;
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
