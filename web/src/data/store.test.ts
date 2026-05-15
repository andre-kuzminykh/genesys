import { describe, it, expect, beforeEach } from 'vitest';
import { loadState } from './store';
import { seedState } from './seed';

const KEY_CURRENT = 'genesys:v0.5';
const KEY_V01 = 'genesys:v0.1';
const KEY_LEGACY = 'genesis:v0.1';

beforeEach(() => {
  localStorage.clear();
});

describe('store.loadState — schema migration', () => {
  it('drops a legacy key shape (genesis:v0.1) and seeds fresh', () => {
    // Write the SAME shape but at the legacy key.
    localStorage.setItem(KEY_LEGACY, JSON.stringify(seedState()));
    const loaded = loadState();
    // Legacy key must be removed after load.
    expect(localStorage.getItem(KEY_LEGACY)).toBeNull();
    // Fresh seed is what we get back.
    expect(loaded.startups.length).toBeGreaterThan(0);
    // And the current key now exists.
    expect(localStorage.getItem(KEY_CURRENT)).not.toBeNull();
  });

  it('repairs startups that lack the hashtags field (schema v0.1 → v0.2)', () => {
    // Simulate an old snapshot at the CURRENT key — startups without `hashtags`.
    const seed = seedState();
    const oldShape = {
      ...seed,
      startups: seed.startups.map((s: any) => {
        const { hashtags: _drop, ...rest } = s;
        return rest;
      }),
    };
    localStorage.setItem(KEY_CURRENT, JSON.stringify(oldShape));

    const loaded = loadState();

    expect(loaded.startups.length).toBe(oldShape.startups.length);
    for (const s of loaded.startups) {
      expect(Array.isArray(s.hashtags)).toBe(true);
      expect(s.hashtags.length).toBeGreaterThan(0);
    }
  });

  it('falls back to seed when stored JSON is malformed', () => {
    localStorage.setItem(KEY_CURRENT, '{"this is": "not the right shape"}');
    const loaded = loadState();
    expect(loaded.startups.length).toBeGreaterThan(0);
    expect(loaded.users.length).toBeGreaterThan(0);
  });

  it('also clears the older versioned key from previous deploys', () => {
    localStorage.setItem(KEY_V01, 'whatever');
    loadState();
    expect(localStorage.getItem(KEY_V01)).toBeNull();
  });
});
