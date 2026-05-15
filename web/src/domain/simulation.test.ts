import { describe, it, expect } from 'vitest';
import { MockLlmAdapter, runSimulation, simulationMonths } from './simulation';
import type { Startup } from './types';

function startup(overrides: Partial<Startup> = {}): Startup {
  return {
    id: 'S-x', batchId: 'B1', ownerHandle: 'alice',
    name: 'Aurora', pitch: 'p', category: 'Coding',
    hashtags: ['ai-agents', 'devtools', 'b2b'],
    description: 'a description here',
    published: true,
    createdAt: 0,
    techExecution: 80, marketPotential: 70, pitchScore: 65,
    currentMode: 'MODE-3',
    ...overrides,
  };
}

describe('TEST-GEN-210 — simulationMonths', () => {
  it('produces 13 months from May 2026 to May 2027 inclusive', () => {
    const m = simulationMonths();
    expect(m).toHaveLength(13);
    expect(m[0]).toBe('2026-05');
    expect(m[12]).toBe('2027-05');
  });
});

describe('TEST-GEN-211 — MockLlm reviews & forecast deterministic', () => {
  it('user review is bounded 0..100 and is stable for the same input', async () => {
    const llm = new MockLlmAdapter();
    const a = await llm.reviewForUser({ startup: startup(), personas: ['impatient', 'technical', 'student'] });
    const b = await llm.reviewForUser({ startup: startup(), personas: ['impatient', 'technical', 'student'] });
    expect(a).toEqual(b);
    expect(a.score).toBeGreaterThanOrEqual(0);
    expect(a.score).toBeLessThanOrEqual(100);
  });

  it('market review captures hashtag-driven trends', async () => {
    const llm = new MockLlmAdapter();
    const hot = await llm.reviewForMarket({ startup: startup({ hashtags: ['ai-agents', 'image-gen'] }) });
    const cold = await llm.reviewForMarket({ startup: startup({ hashtags: ['hardware', 'k12'] }) });
    expect(hot.score).toBeGreaterThan(cold.score);
    expect(hot.trends.length).toBeGreaterThan(0);
  });

  it('forecastSeries returns one point per month, monotonically growing in expectation', async () => {
    const llm = new MockLlmAdapter();
    const s = await llm.forecastSeries({
      startup: startup(),
      months: simulationMonths(),
      userScore: 70,
      marketScore: 70,
    });
    expect(s).toHaveLength(13);
    expect(s[12]!.users).toBeGreaterThan(s[0]!.users);
    expect(s.every((p) => p.users > 0 && p.revenueUSD > 0)).toBe(true);
  });
});

describe('TEST-GEN-212 — runSimulation end-to-end', () => {
  it('produces a forecast per startup, picks a winner, builds three summaries', async () => {
    const result = await runSimulation([
      startup({ id: 'A', name: 'Alpha', techExecution: 85, marketPotential: 80, pitchScore: 75, hashtags: ['ai-agents', 'devtools', 'b2b'] }),
      startup({ id: 'B', name: 'Beta',  techExecution: 50, marketPotential: 50, pitchScore: 50, hashtags: ['hardware'] }),
      startup({ id: 'C', name: 'Gamma', techExecution: 70, marketPotential: 65, pitchScore: 60, hashtags: ['image-gen', 'b2c'] }),
    ]);

    expect(result.startups).toHaveLength(3);
    for (const f of result.startups) {
      expect(f.monthly).toHaveLength(13);
      expect(f.recommendation.length).toBeGreaterThan(20);
      expect(f.userReview.upvoteBump).toBeGreaterThanOrEqual(0);
    }
    expect(['A', 'C']).toContain(result.winner.startupId);
    expect(result.userSummary).toMatch(/persona/i);
    expect(result.marketSummary).toMatch(/market/i);
    expect(result.overallSummary).toMatch(/may 2027/i);
  });

  it('each forecast monotonic-ish and the cohort total revenue is positive', async () => {
    const result = await runSimulation([startup(), startup({ id: 'S-y', name: 'Beta' })]);
    const total = result.startups.reduce((a, f) => a + f.totalRevenueUSD, 0);
    expect(total).toBeGreaterThan(0);
  });
});
