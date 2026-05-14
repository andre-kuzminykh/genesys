import { describe, it, expect } from 'vitest';
import type { AppState, Batch, Startup } from './types';
import { invest, remainingCredits } from './investments';
import { DEFAULT_WEIGHTS } from './scoring';

function baseState(): AppState {
  const batch: Batch = {
    id: 'B1',
    name: 'GEN-001',
    allowlist: ['alice', 'bob'],
    creditsPerInvestor: 1000,
    selfInvestPolicy: 'FORBIDDEN',
    weights: DEFAULT_WEIGHTS,
    createdAt: 0,
  };
  const s1: Startup = {
    id: 'S1',
    batchId: 'B1',
    ownerHandle: 'alice',
    name: 'Aurora',
    pitch: 'Neon-fast spec-first startup OS',
    category: 'devtools',
    published: true,
    createdAt: 0,
    techExecution: 60,
    marketPotential: 50,
    pitchScore: 40,
    currentMode: 'MODE-1',
  };
  const s2: Startup = { ...s1, id: 'S2', name: 'Nebula', ownerHandle: 'bob' };
  return {
    session: null,
    users: [],
    batches: [batch],
    startups: [s1, s2],
    specs: [],
    investments: [],
    simulations: [],
    activeBatchId: 'B1',
  };
}

describe('TEST-GEN-030 — initial credits', () => {
  it('starts with batch.creditsPerInvestor', () => {
    expect(remainingCredits(baseState(), 'B1', 'alice')).toBe(1000);
  });
});

describe('TEST-GEN-031 — overspend rejected', () => {
  it('refuses INSUFFICIENT_CREDITS', () => {
    const r = invest(baseState(), { investorHandle: 'alice', startupId: 'S2', amount: 1500, now: 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('INSUFFICIENT_CREDITS');
  });

  it('happy path decrements remaining credits', () => {
    const r = invest(baseState(), { investorHandle: 'alice', startupId: 'S2', amount: 200, now: 1 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.remainingCredits).toBe(800);
      expect(r.investment.amount).toBe(200);
    }
  });
});

describe('TEST-GEN-032 — self-invest policy FORBIDDEN', () => {
  it('rejects with SELF_INVEST_FORBIDDEN', () => {
    const r = invest(baseState(), { investorHandle: 'alice', startupId: 'S1', amount: 50, now: 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('SELF_INVEST_FORBIDDEN');
  });

  it('allows self-invest when policy=ALLOWED', () => {
    const s = baseState();
    s.batches[0]!.selfInvestPolicy = 'ALLOWED';
    const r = invest(s, { investorHandle: 'alice', startupId: 'S1', amount: 50, now: 1 });
    expect(r.ok).toBe(true);
  });

  it('LIMITED policy caps self-invest at 10%', () => {
    const s = baseState();
    s.batches[0]!.selfInvestPolicy = 'LIMITED';
    const ok = invest(s, { investorHandle: 'alice', startupId: 'S1', amount: 80, now: 1 });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      const tooMuch = invest(ok.state, { investorHandle: 'alice', startupId: 'S1', amount: 50, now: 2 });
      expect(tooMuch.ok).toBe(false);
    }
  });
});

describe('TEST-GEN-031 (publish gating)', () => {
  it('rejects investment in unpublished startup', () => {
    const s = baseState();
    s.startups[1]!.published = false;
    const r = invest(s, { investorHandle: 'alice', startupId: 'S2', amount: 50, now: 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('STARTUP_NOT_PUBLISHED');
  });
});
