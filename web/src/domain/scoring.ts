import type { ScoringWeights, Score, Startup, Investment } from './types';
import { specCompleteness, tracePercent, testPassRate } from './traceability';
import type { ProductSpec } from './types';
import type { PersonaResult } from './types';

export const DEFAULT_WEIGHTS: ScoringWeights = {
  specCompleteness: 0.20,
  testPassRate: 0.15,
  techExecution: 0.15,
  personaSatisfaction: 0.20,
  investorDemand: 0.15,
  marketPotential: 0.10,
  pitchScore: 0.05,
};

export function validateWeights(w: ScoringWeights): { ok: true } | { ok: false; reason: string } {
  const keys = Object.values(w);
  if (keys.some((v) => Number.isNaN(v) || v < 0 || v > 1)) {
    return { ok: false, reason: 'WEIGHT_OUT_OF_RANGE' };
  }
  const sum = keys.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1) > 0.01) return { ok: false, reason: `WEIGHTS_SUM_${sum.toFixed(3)}_NOT_1` };
  return { ok: true };
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

export interface ReadinessInputs {
  specCompleteness: number;
  testPassRate: number;
  techExecution: number;
  personaSatisfaction: number;
  investorDemand: number;
  marketPotential: number;
  pitchScore: number;
}

/** FR-GEN-022 — readiness score, clipped to [0,100]. */
export function readinessScore(i: ReadinessInputs, w: ScoringWeights = DEFAULT_WEIGHTS): number {
  const r =
    w.specCompleteness * clamp(i.specCompleteness) +
    w.testPassRate * clamp(i.testPassRate) +
    w.techExecution * clamp(i.techExecution) +
    w.personaSatisfaction * clamp(i.personaSatisfaction) +
    w.investorDemand * clamp(i.investorDemand) +
    w.marketPotential * clamp(i.marketPotential) +
    w.pitchScore * clamp(i.pitchScore);
  return Math.round(clamp(r) * 10) / 10;
}

export function computePersonaSatisfaction(spec: ProductSpec, results: PersonaResult[]): number {
  if (results.length === 0) return 0;
  const m = results.reduce((a, r) => a + r.score, 0) / results.length;
  // Keep within bounds and round to one decimal.
  return Math.round(clamp(m) * 10) / 10;
}

export function computeInvestorDemand(batchId: string, startupId: string, investments: Investment[]): number {
  const inBatch = investments.filter((i) => i.batchId === batchId);
  const totalsByStartup = new Map<string, number>();
  for (const inv of inBatch) {
    totalsByStartup.set(inv.startupId, (totalsByStartup.get(inv.startupId) ?? 0) + inv.amount);
  }
  const ours = totalsByStartup.get(startupId) ?? 0;
  const max = Math.max(0, ...Array.from(totalsByStartup.values()));
  if (max === 0) return 0;
  return Math.round(((ours / max) * 100) * 10) / 10;
}

export function computeScore(args: {
  startup: Startup;
  spec: ProductSpec;
  investments: Investment[];
  personaResults: PersonaResult[];
  weights?: ScoringWeights;
}): Score {
  const { startup, spec, investments, personaResults, weights = DEFAULT_WEIGHTS } = args;
  const sc = specCompleteness(spec);
  const tp = testPassRate(spec);
  const trace = tracePercent(spec);
  const ps = computePersonaSatisfaction(spec, personaResults);
  const id = computeInvestorDemand(startup.batchId, startup.id, investments);
  const inputs: ReadinessInputs = {
    specCompleteness: sc,
    testPassRate: tp,
    techExecution: startup.techExecution,
    personaSatisfaction: ps,
    investorDemand: id,
    marketPotential: startup.marketPotential,
    pitchScore: startup.pitchScore,
  };
  const r = readinessScore(inputs, weights);
  return {
    startupId: startup.id,
    specCompleteness: sc,
    traceCoverage: trace,
    testPassRate: tp,
    personaSatisfaction: ps,
    investorDemand: id,
    marketPotential: startup.marketPotential,
    pitchScore: startup.pitchScore,
    techExecution: startup.techExecution,
    readiness: r,
  };
}

/** FR-GEN-050 — leaderboard sort. */
export function leaderboard(scores: Score[], investments: Investment[]): Score[] {
  // Tie-breaker: total investor credits (not normalized).
  const rawDemand = new Map<string, number>();
  for (const inv of investments) {
    rawDemand.set(inv.startupId, (rawDemand.get(inv.startupId) ?? 0) + inv.amount);
  }
  return [...scores].sort((a, b) => {
    if (b.readiness !== a.readiness) return b.readiness - a.readiness;
    return (rawDemand.get(b.startupId) ?? 0) - (rawDemand.get(a.startupId) ?? 0);
  });
}
