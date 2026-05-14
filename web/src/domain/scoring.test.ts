import { describe, it, expect } from 'vitest';
import {
  DEFAULT_WEIGHTS,
  computeInvestorDemand,
  leaderboard,
  readinessScore,
  validateWeights,
} from './scoring';
import type { Investment, Score } from './types';

describe('TEST-GEN-060 — validateWeights', () => {
  it('accepts default weights', () => {
    expect(validateWeights(DEFAULT_WEIGHTS).ok).toBe(true);
  });

  it('rejects out-of-range weights', () => {
    const r = validateWeights({ ...DEFAULT_WEIGHTS, specCompleteness: -0.1 });
    expect(r.ok).toBe(false);
  });

  it('rejects weights not summing to 1 (±0.01)', () => {
    const r = validateWeights({ ...DEFAULT_WEIGHTS, specCompleteness: 0.5 });
    expect(r.ok).toBe(false);
  });
});

describe('TEST-GEN-022 — readinessScore (SCN-GEN-050 canonical formula)', () => {
  it('matches the canonical formula', () => {
    const r = readinessScore({
      specCompleteness: 80,
      testPassRate: 90,
      techExecution: 70,
      personaSatisfaction: 60,
      investorDemand: 40,
      marketPotential: 50,
      pitchScore: 50,
    });
    expect(r).toBe(65.5);
  });

  it('clips inputs to [0,100]', () => {
    const r = readinessScore({
      specCompleteness: 200,
      testPassRate: -10,
      techExecution: 100,
      personaSatisfaction: 100,
      investorDemand: 100,
      marketPotential: 100,
      pitchScore: 100,
    });
    expect(r).toBeLessThanOrEqual(100);
    expect(r).toBeGreaterThan(80);
  });
});

describe('TEST-GEN-033 — investor demand normalization', () => {
  const inv = (s: string, a: number): Investment => ({
    id: s + '-' + a,
    batchId: 'B1',
    investorHandle: 'x',
    startupId: s,
    amount: a,
    createdAt: 0,
  });

  it('returns 0 when no investments in batch', () => {
    expect(computeInvestorDemand('B1', 'S1', [])).toBe(0);
  });

  it('100 for top startup, proportional for others', () => {
    const invs = [inv('S1', 300), inv('S2', 100), inv('S3', 0)];
    expect(computeInvestorDemand('B1', 'S1', invs)).toBe(100);
    expect(computeInvestorDemand('B1', 'S2', invs)).toBeCloseTo(33.3, 0);
    expect(computeInvestorDemand('B1', 'S3', invs)).toBe(0);
  });
});

describe('TEST-GEN-050 — leaderboard sort', () => {
  it('sorts by readiness desc, breaks ties by raw investor credits', () => {
    const scores: Score[] = [
      { startupId: 'A', readiness: 80, specCompleteness: 0, traceCoverage: 0, testPassRate: 0, personaSatisfaction: 0, investorDemand: 0, marketPotential: 0, pitchScore: 0, techExecution: 0 },
      { startupId: 'B', readiness: 80, specCompleteness: 0, traceCoverage: 0, testPassRate: 0, personaSatisfaction: 0, investorDemand: 0, marketPotential: 0, pitchScore: 0, techExecution: 0 },
      { startupId: 'C', readiness: 90, specCompleteness: 0, traceCoverage: 0, testPassRate: 0, personaSatisfaction: 0, investorDemand: 0, marketPotential: 0, pitchScore: 0, techExecution: 0 },
    ];
    const invs: Investment[] = [
      { id: '1', batchId: 'b', investorHandle: 'x', startupId: 'A', amount: 50, createdAt: 0 },
      { id: '2', batchId: 'b', investorHandle: 'x', startupId: 'B', amount: 100, createdAt: 0 },
    ];
    const sorted = leaderboard(scores, invs);
    expect(sorted.map((s) => s.startupId)).toEqual(['C', 'B', 'A']);
  });
});
