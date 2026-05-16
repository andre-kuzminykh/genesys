/**
 * Market simulation — generates a 13-month forecast (May 2026 → May 2027)
 * for each published startup, with per-startup user review, market review,
 * recommendation and an overall winner.
 *
 * The LLM port (LlmPort) is structured so a real model + web search adapter
 * can be plugged in for V1 without touching callers. This MVP ships a
 * deterministic mock so the UI works with no API keys.
 */

import type { PersonaId, Startup } from './types';

// ---------- types ----------

export interface MonthlyPoint {
  /** "YYYY-MM" */
  month: string;
  users: number;
  revenueUSD: number;
}

export interface PersonaVerdict {
  /** PersonaId — matches one of the personas the panel was given. */
  id: PersonaId;
  /** Display label the LLM picked for this persona (e.g. "Mia, impatient PM"). */
  label: string;
  /** 0..100 — this persona's individual verdict. */
  score: number;
  /** Short first-person quote (≤ 180 chars) the persona "says". */
  quote: string;
}

export interface UserReview {
  personaIds: PersonaId[];
  /** 0..100, average across the persona panel */
  score: number;
  notes: string;
  /** integer; how many upvotes this review should add to the startup */
  upvoteBump: number;
  /** Per-persona breakdown with quotes — drives the avatar panel UI. */
  perPersona?: PersonaVerdict[];
}

export interface MarketReview {
  /** 0..100 */
  score: number;
  notes: string;
  /** Short labelled trends used to bend the forecast curve */
  trends: { label: string; impact: number }[];
}

export interface MonthlyEvent {
  /** "YYYY-MM" — must match an entry in MonthlyPoint */
  month: string;
  /** 10-20 word narrative — plausibly grounded in world/segment events */
  event: string;
}

export interface StartupForecast {
  startupId: string;
  startupName: string;
  monthly: MonthlyPoint[];
  /** Final-month user count (May 2027). */
  endUsers: number;
  /** 12-month revenue total. */
  totalRevenueUSD: number;
  userReview: UserReview;
  marketReview: MarketReview;
  recommendation: string;
  /** Per-month news ticker, one entry per month in the forecast. */
  events: MonthlyEvent[];
}

export interface SimulationResult {
  runAt: number;
  months: string[];
  startups: StartupForecast[];
  winner: { startupId: string; startupName: string; reasoning: string };
  userSummary: string;
  marketSummary: string;
  overallSummary: string;
}

// ---------- LLM port (real or mock) ----------

export interface LlmPort {
  reviewForUser(input: { startup: Startup; personas: PersonaId[] }): Promise<UserReview>;
  reviewForMarket(input: { startup: Startup }): Promise<MarketReview>;
  forecastSeries(input: { startup: Startup; months: string[]; userScore: number; marketScore: number }): Promise<MonthlyPoint[]>;
  recommend(input: { startup: Startup; userReview: UserReview; marketReview: MarketReview; events: MonthlyEvent[] }): Promise<string>;
  /**
   * Produce a per-month news ticker for the startup that matches the forecast curve.
   * Each event must include WHAT happened (product action / world event) AND a brief
   * because-clause so the recommendation step can reference concrete causes.
   */
  narrativeSeries(input: { startup: Startup; monthly: MonthlyPoint[]; userReview: UserReview; marketReview: MarketReview }): Promise<MonthlyEvent[]>;
}

// ---------- helpers ----------

/** May 2026 → May 2027 inclusive (13 months). */
export function simulationMonths(start = new Date(2026, 4, 1), count = 13): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

const HASHTAG_TREND: Record<string, number> = {
  // accelerators (>1)
  'ai-agents': 1.30,
  'llm-evals': 1.22,
  'image-gen': 1.20,
  'rag': 1.18,
  'ai-voice': 1.15,
  'devtools': 1.12,
  'spec-first': 1.12,
  'observability': 1.10,
  'ai-search': 1.10,
  'ai-tutor': 1.10,
  'campaigns': 1.08,
  'enterprise-buyer': 1.08,
  'b2b': 1.05,
  'shopify': 1.05,
  'monitoring': 1.05,
  'sales': 1.05,
  'audio': 1.05,
  'voice': 1.05,
  'tdd': 1.04,
  'b2c': 1.00,
  'd2c': 1.00,
  'marketing': 1.02,
  'writing': 1.02,
  // headwinds (<1)
  'k12': 0.97,
  'hardware': 0.85,
  'long-form': 0.95,
  'academic': 0.92,
  'literature-review': 0.95,
  'github': 1.05,
  'b2g': 0.92,
};

const PERSONA_BIAS: Partial<Record<PersonaId, number>> = {
  impatient: -6,
  technical: +2,
  budget_sensitive: -4,
  enterprise_buyer: -8,
  student: +6,
  founder: +3,
  skeptical_investor: -10,
  power_user: +5,
  confused_first_time: -8,
};

function trendMultiplier(startup: Startup): { mult: number; trends: { label: string; impact: number }[] } {
  let mult = 1.0;
  const trends: { label: string; impact: number }[] = [];
  for (const tag of startup.hashtags) {
    const v = HASHTAG_TREND[tag];
    if (v && v !== 1) {
      mult *= v;
      trends.push({ label: '#' + tag, impact: v - 1 });
    }
  }
  return { mult, trends };
}

function deterministicNoise(seed: string, i: number): number {
  let h = i + 1;
  for (let k = 0; k < seed.length; k++) h = (Math.imul(31, h) + seed.charCodeAt(k)) | 0;
  // map int → [-0.04, +0.04]
  return ((Math.abs(h) % 800) - 400) / 10000;
}

// ---------- mock implementation ----------

export class MockLlmAdapter implements LlmPort {
  async reviewForUser({ startup, personas }: { startup: Startup; personas: PersonaId[] }): Promise<UserReview> {
    const base =
      0.45 * startup.techExecution +
      0.30 * startup.pitchScore +
      0.25 * startup.marketPotential;
    const biasMean =
      personas.reduce((a, p) => a + (PERSONA_BIAS[p] ?? 0), 0) / Math.max(1, personas.length);
    const score = Math.max(0, Math.min(100, Math.round(base + biasMean)));

    const tone = score >= 75 ? 'love' : score >= 55 ? 'mixed' : 'cool';
    const notes =
      tone === 'love'
        ? `Personas (${personas.join(', ')}) describe ${startup.name} as "clearly useful". Onboarding friction is low; first-value happens fast.`
        : tone === 'mixed'
          ? `Personas (${personas.join(', ')}) like the idea behind ${startup.name} but stumble on pricing transparency and the first-time setup path.`
          : `Personas (${personas.join(', ')}) struggle to articulate why they would pick ${startup.name} over the status quo. Value prop reads abstract.`;

    const upvoteBump = Math.max(0, Math.round((score - 50) / 5));
    return { personaIds: personas, score, notes, upvoteBump };
  }

  async reviewForMarket({ startup }: { startup: Startup }): Promise<MarketReview> {
    const { mult, trends } = trendMultiplier(startup);
    // Map mult into 0..100 score: mult of 1 → 50, 1.3 → ~80, 0.85 → ~30
    const raw = 50 + (mult - 1) * 100;
    const score = Math.max(0, Math.min(100, Math.round(raw)));
    const tonal =
      score >= 70
        ? `${startup.category} sits inside an accelerating segment.`
        : score >= 50
          ? `${startup.category} is steady but won't win on tailwinds alone — execution decides.`
          : `${startup.category} faces sector headwinds. The team will need a sharp wedge to grow against the trend.`;
    const notes = `${tonal} Top trend signals from the hashtag mix: ${trends
      .slice(0, 3)
      .map((t) => `${t.label} (${t.impact >= 0 ? '+' : ''}${Math.round(t.impact * 100)}%)`)
      .join(', ') || '—'}.`;
    return { score, notes, trends };
  }

  async forecastSeries({ startup, months, userScore, marketScore }: { startup: Startup; months: string[]; userScore: number; marketScore: number }): Promise<MonthlyPoint[]> {
    const { mult } = trendMultiplier(startup);
    const initialUsers = Math.round(40 + startup.techExecution * 4); // 40..440
    const monthlyGrowth = 0.05 + (marketScore - 50) / 800; // ~ 5% ± 6%
    const arpu = 6 + userScore / 4; // ~ $6..$31
    let users = initialUsers;
    return months.map((month, i) => {
      const seasonal = 1 + Math.sin(((i + 4) / 12) * Math.PI * 2) * 0.04;
      const noise = 1 + deterministicNoise(startup.id, i);
      users = Math.round(users * (1 + monthlyGrowth) * Math.pow(mult, 0.08) * seasonal * noise);
      const revenue = Math.round(users * arpu);
      return { month, users, revenueUSD: revenue };
    });
  }

  async recommend({ startup, userReview, marketReview }: { startup: Startup; userReview: UserReview; marketReview: MarketReview; events: MonthlyEvent[] }): Promise<string> {
    if (userReview.score >= 70 && marketReview.score >= 70) {
      return `Double-down. ${startup.name} has product-pull AND market-pull. Spend on distribution and lock the segment within 2 quarters.`;
    }
    if (userReview.score >= 70) {
      return `Users love it but the segment isn't pulling. Pivot the wedge to an adjacent, faster-moving niche, or vertical-ize for one tailwind hashtag.`;
    }
    if (marketReview.score >= 70) {
      return `The market is hot but the product hasn't earned its spot yet. Cut scope, ship the smallest "wow" loop in 30 days, then iterate on activation.`;
    }
    return `Headwinds + cool reception. Either re-narrate the pitch around a sharper persona, or graduate to a stronger founder/market fit.`;
  }

  async narrativeSeries({ startup, monthly }: { startup: Startup; monthly: MonthlyPoint[]; userReview: UserReview; marketReview: MarketReview }): Promise<MonthlyEvent[]> {
    // Deterministic fallback — milestone + delta-driven, used when no LLM key.
    return monthly.map((p, i) => {
      const prev = i > 0 ? monthly[i - 1]! : { users: 0, revenueUSD: 0 };
      const du = p.users - prev.users;
      if (i === 0)                           return { month: p.month, event: `${startup.name} launches MVP because the founder finally cuts scope to one wedge.` };
      if (prev.users < 100 && p.users >= 100) return { month: p.month, event: `${startup.name} crosses 100 users — because an early Reddit/HN post lands organically.` };
      if (prev.users < 500 && p.users >= 500) return { month: p.month, event: `${startup.name} crosses 500 users — because referral loop kicks in.` };
      if (prev.users < 1000 && p.users >= 1000) return { month: p.month, event: `${startup.name} crosses 1k users — because a niche influencer features the product.` };
      if (du < 0)                            return { month: p.month, event: `${startup.name} dips this month because a key persona segment churned to a substitute.` };
      if (prev.users > 0 && du / prev.users > 0.3) return { month: p.month, event: `${startup.name} sees strong growth because activation copy got rewritten around the ICP.` };
      return { month: p.month, event: `${startup.name} ships incremental improvements; small steady growth, no breakout signal.` };
    });
  }
}

// ---------- runner ----------

export type SimulationPhase = 'user' | 'market' | 'forecast' | 'narrative' | 'recommend';

export type SimulationEvent =
  | { kind: 'phase-start'; startupId: string; startupName: string; phase: SimulationPhase }
  | { kind: 'phase-done';  startupId: string; startupName: string; phase: SimulationPhase; summary: string }
  | { kind: 'startup-done'; startupId: string; startupName: string; endUsers: number; totalRevenueUSD: number };

export async function runSimulation(
  startups: Startup[],
  llm: LlmPort = new MockLlmAdapter(),
  onEvent?: (e: SimulationEvent) => void,
): Promise<SimulationResult> {
  const months = simulationMonths();
  const personas: PersonaId[] = ['impatient', 'technical', 'student', 'power_user', 'skeptical_investor'];

  const emit = (e: SimulationEvent) => { try { onEvent?.(e); } catch { /* swallow */ } };

  const forecasts: StartupForecast[] = await Promise.all(
    startups.map(async (startup) => {
      const sid = startup.id, sname = startup.name;

      emit({ kind: 'phase-start', startupId: sid, startupName: sname, phase: 'user' });
      const userReview = await llm.reviewForUser({ startup, personas });
      emit({ kind: 'phase-done', startupId: sid, startupName: sname, phase: 'user',
        summary: `user panel ${userReview.score}/100, +${userReview.upvoteBump} upvotes projected` });

      emit({ kind: 'phase-start', startupId: sid, startupName: sname, phase: 'market' });
      const marketReview = await llm.reviewForMarket({ startup });
      const sourceCount = (marketReview.notes.match(/https?:\/\//g) || []).length;
      emit({ kind: 'phase-done', startupId: sid, startupName: sname, phase: 'market',
        summary: `market ${marketReview.score}/100${sourceCount ? ` · ${sourceCount} sources cited` : ''} · trends: ${marketReview.trends.slice(0, 3).map((t) => t.label).join(', ') || '—'}` });

      emit({ kind: 'phase-start', startupId: sid, startupName: sname, phase: 'forecast' });
      const monthly = await llm.forecastSeries({ startup, months, userScore: userReview.score, marketScore: marketReview.score });
      const endUsers = monthly[monthly.length - 1]!.users;
      const totalRevenueUSD = monthly.reduce((a, m) => a + m.revenueUSD, 0);
      emit({ kind: 'phase-done', startupId: sid, startupName: sname, phase: 'forecast',
        summary: `13-month forecast: ${endUsers.toLocaleString()} users by May'27, $${totalRevenueUSD.toLocaleString()} year revenue` });

      emit({ kind: 'phase-start', startupId: sid, startupName: sname, phase: 'narrative' });
      const events = await llm.narrativeSeries({ startup, monthly, userReview, marketReview });
      emit({ kind: 'phase-done', startupId: sid, startupName: sname, phase: 'narrative',
        summary: `${events.length} monthly events with causes attached` });

      emit({ kind: 'phase-start', startupId: sid, startupName: sname, phase: 'recommend' });
      const recommendation = await llm.recommend({ startup, userReview, marketReview, events });
      emit({ kind: 'phase-done', startupId: sid, startupName: sname, phase: 'recommend',
        summary: 'founder recommendation ready (uses monthly causes)' });

      emit({ kind: 'startup-done', startupId: sid, startupName: sname, endUsers, totalRevenueUSD });

      return { startupId: sid, startupName: sname, monthly, endUsers, totalRevenueUSD, userReview, marketReview, recommendation, events };
    }),
  );

  const ranked = [...forecasts].sort((a, b) => compositeScore(b) - compositeScore(a));
  const w = ranked[0]!;
  const winner = {
    startupId: w.startupId,
    startupName: w.startupName,
    reasoning: `${w.startupName} wins on combined signal: user love ${w.userReview.score}/100, market ${w.marketReview.score}/100, projected end-users ${w.endUsers.toLocaleString()}, year revenue $${w.totalRevenueUSD.toLocaleString()}.`,
  };

  const userSummary = `Across the cohort the average user-review score is ${avg(forecasts.map((f) => f.userReview.score))}/100. ${ranked[0]!.startupName} and ${ranked[1]?.startupName ?? '—'} get the warmest reception; ${ranked[ranked.length - 1]!.startupName} struggles to convince the persona panel.`;
  const marketSummary = `Market signal averages ${avg(forecasts.map((f) => f.marketReview.score))}/100. Strongest tailwinds: AI agents, image-gen and devtools. Weakest: hardware, K-12, academic publishing.`;
  const overallSummary = `Year-on-year: cohort projects ${forecasts.reduce((a, f) => a + f.endUsers, 0).toLocaleString()} users by May 2027 with a combined ARR of $${forecasts.reduce((a, f) => a + f.totalRevenueUSD, 0).toLocaleString()}. ${winner.startupName} carries the cohort.`;

  return {
    runAt: Date.now(),
    months,
    startups: forecasts,
    winner,
    userSummary,
    marketSummary,
    overallSummary,
  };
}

export function compositeScore(f: StartupForecast): number {
  return (
    f.userReview.score * 0.35 +
    f.marketReview.score * 0.35 +
    Math.log10(f.totalRevenueUSD + 1) * 4
  );
}

function avg(xs: number[]): number {
  return Math.round(xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length));
}
