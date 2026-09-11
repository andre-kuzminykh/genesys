import { describe, it, expect } from 'vitest';
import { computeBestInvestor } from '../winners';

describe('TEST-FR-LB-008-A — computeBestInvestor — empty input', () => {
  it('returns null when there are no investments', () => {
    expect(computeBestInvestor([], {})).toBeNull();
  });
});

describe('TEST-FR-LB-008-B — revenue-weighted portfolio formula', () => {
  // Worked example matches the README's "Best Investor formula" walkthrough.
  // revenueByStartup is the per-startup projected year revenue from the
  // simulation; the score weights each investment by revenue/1e6.
  const revenue = {
    'S-artrise':      250_000,
    'S-calenmind':    180_000,
    'S-invalerts':    190_000,
    'S-ztbrowser':    150_000,
    'S-p2pedit':      120_000,
  };

  it('A: 30k×0.25 + 20k×0.18 = 11,100  → wins over B: 50k×0.19 = 9,500 and C: 10k×0.15 + 10k×0.12 = 2,700', () => {
    const investments = [
      { investorHandle: 'a-handle',  startupId: 'S-artrise',    amount: 30_000 },
      { investorHandle: 'a-handle',  startupId: 'S-calenmind',  amount: 20_000 },
      { investorHandle: 'b-handle',  startupId: 'S-invalerts',  amount: 50_000 },
      { investorHandle: 'c-handle',  startupId: 'S-ztbrowser',  amount: 10_000 },
      { investorHandle: 'c-handle',  startupId: 'S-p2pedit',    amount: 10_000 },
    ];
    const top = computeBestInvestor(investments, revenue);
    expect(top).not.toBeNull();
    expect(top!.handle).toBe('a-handle');
    expect(top!.invested).toBe(50_000);
    expect(top!.picks).toBe(2);
    expect(top!.score).toBeCloseTo(30_000 * 0.25 + 20_000 * 0.18, 2);
  });

  it('lowercases handles and ties-break by total invested when scores match', () => {
    const investments = [
      { investorHandle: 'Tied-X', startupId: 'S-artrise',    amount: 10_000 },
      { investorHandle: 'tied-y', startupId: 'S-artrise',    amount: 20_000 },
    ];
    const top = computeBestInvestor(investments, revenue);
    // Same revenue × different amounts → 'tied-y' wins on invested.
    expect(top!.handle).toBe('tied-y');
    expect(top!.invested).toBe(20_000);
  });

  it('falls back to the default revenue when a startup has no forecast', () => {
    const investments = [
      { investorHandle: 'only-handle', startupId: 'S-unknown', amount: 50_000 },
    ];
    const top = computeBestInvestor(investments, {});
    expect(top!.handle).toBe('only-handle');
    // Default revenue is 100_000 → score = 50_000 × 0.1 = 5_000.
    expect(top!.score).toBeCloseTo(5_000, 2);
  });
});
