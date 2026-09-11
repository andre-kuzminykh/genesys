import { describe, it, expect } from 'vitest';
import type { AppState } from './types';
import { attachRepo, createStartup } from './startup';
import { DEFAULT_WEIGHTS } from './scoring';

function baseState(): AppState {
  return {
    session: null,
    users: [],
    batches: [{
      id: 'B1', name: 'GEN-001', allowlist: ['alice'],
      creditsPerInvestor: 1000, selfInvestPolicy: 'FORBIDDEN',
      weights: DEFAULT_WEIGHTS, createdAt: 0,
    }],
    startups: [],
    specs: [],
    investments: [],
    simulations: [],
    activeBatchId: 'B1',
  };
}

describe('TEST-GEN-004 — startup validation', () => {
  it('requires pitch', () => {
    const r = createStartup(baseState(), { batchId: 'B1', ownerHandle: 'alice', name: 'X', pitch: '', category: 'devtools' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('MISSING_PITCH');
  });

  it('requires name', () => {
    const r = createStartup(baseState(), { batchId: 'B1', ownerHandle: 'alice', name: '', pitch: 'p', category: 'c' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('MISSING_NAME');
  });
});

describe('TEST-GEN-005 — unique name per batch', () => {
  it('rejects duplicate name in same batch', () => {
    const ok = createStartup(baseState(), { batchId: 'B1', ownerHandle: 'alice', name: 'Aurora', pitch: 'p', category: 'c', now: 1 });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      const dup = createStartup(ok.state, { batchId: 'B1', ownerHandle: 'alice', name: 'aurora', pitch: 'p', category: 'c', now: 2 });
      expect(dup.ok).toBe(false);
      if (!dup.ok) expect(dup.reason).toBe('DUPLICATE_NAME');
    }
  });
});

describe('TEST-GEN-014 — attachRepo', () => {
  it('normalizes and stores owner/repo', () => {
    const s = createStartup(baseState(), { batchId: 'B1', ownerHandle: 'alice', name: 'X', pitch: 'p', category: 'c', now: 1 });
    if (!s.ok) throw new Error('seed failed');
    const r = attachRepo(s.state, s.startup.id, '  Owner/Repo-1.git  '.trim());
    expect(r.ok).toBe(true);
  });
  it('rejects malformed repo string', () => {
    const s = createStartup(baseState(), { batchId: 'B1', ownerHandle: 'alice', name: 'Y', pitch: 'p', category: 'c', now: 1 });
    if (!s.ok) throw new Error('seed failed');
    const bad = attachRepo(s.state, s.startup.id, 'not-a-repo');
    expect(bad.ok).toBe(false);
  });
});
