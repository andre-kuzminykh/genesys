/**
 * Real OpenAI adapter for the LlmPort.
 *
 * The API key is supplied at construction time. It is NEVER bundled into the
 * source — the UI prompts the user to paste it and stores it in localStorage.
 *
 * Note: OpenAI allow-lists CORS for chat completions, so this works directly
 * from the browser. For production you should still use a backend proxy so
 * the key isn't exposed to the user's browser inspector.
 */

import type { LlmPort, MonthlyPoint, UserReview, MarketReview } from '@/domain/simulation';
import type { PersonaId, Startup } from '@/domain/types';

const ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o-mini';

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
}

export class OpenAIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'OpenAIError';
  }
}

export class OpenAILlmAdapter implements LlmPort {
  constructor(private cfg: OpenAIConfig) {}

  private async chat<T>(prompt: string): Promise<T> {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: this.cfg.model ?? DEFAULT_MODEL,
        response_format: { type: 'json_object' },
        temperature: 0.4,
        messages: [
          { role: 'system', content: 'You are an analyst that returns ONLY a single JSON object matching the user\'s schema. No prose.' },
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!res.ok) {
      let m = `OpenAI ${res.status}`;
      try { const j = await res.json(); if (j?.error?.message) m = j.error.message; } catch { /* ignore */ }
      throw new OpenAIError(res.status, m);
    }
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) throw new OpenAIError(500, 'OpenAI returned empty content');
    try {
      return JSON.parse(content) as T;
    } catch {
      throw new OpenAIError(500, 'OpenAI returned invalid JSON');
    }
  }

  async reviewForUser({ startup, personas }: { startup: Startup; personas: PersonaId[] }): Promise<UserReview> {
    const prompt = `Act as a panel of these distinct user personas: ${personas.join(', ')}.

Each persona has its own bias:
- impatient: rage-quits friction, loves first-value < 60s
- technical: cares about API quality, observability, openness
- student: low budget, wants free tier or cheap, learning bias
- power_user: keyboard-first, customisation, depth
- skeptical_investor: wants real metrics + retention proof

Read the startup:
Name: ${startup.name}
Pitch: ${startup.pitch}
Description: ${startup.description ?? '(none)'}
Hashtags: ${startup.hashtags.join(', ')}
Tech execution: ${startup.techExecution}/100
Pitch score: ${startup.pitchScore}/100
Market potential: ${startup.marketPotential}/100

Return JSON only:
{
  "score": <int 0..100, average satisfaction across the panel>,
  "notes": "<1-2 sentence summary in the panel's voice>",
  "upvoteBump": <int 0..15, how much this would bump upvotes on a launch board>
}`;
    const out = await this.chat<{ score: number; notes: string; upvoteBump: number }>(prompt);
    return {
      personaIds: personas,
      score: clamp(out.score, 0, 100),
      notes: String(out.notes ?? '').slice(0, 600),
      upvoteBump: clamp(Math.round(out.upvoteBump), 0, 30),
    };
  }

  async reviewForMarket({ startup }: { startup: Startup }): Promise<MarketReview> {
    const prompt = `You are a market analyst writing a 2-quarter forward view for May 2026 - May 2027.

Startup:
Name: ${startup.name}
Pitch: ${startup.pitch}
Description: ${startup.description ?? '(none)'}
Hashtags: ${startup.hashtags.join(', ')}

Identify the trends in this segment likely to bend the market in the next 12 months. Each trend has an impact in [-0.3, +0.3] where positive means tailwind.

Return JSON only:
{
  "score": <int 0..100, market favorability>,
  "notes": "<1-2 sentences>",
  "trends": [
    { "label": "#hashtag-or-trend", "impact": <float -0.3..0.3> },
    ... 3 to 6 entries
  ]
}`;
    const out = await this.chat<{ score: number; notes: string; trends: { label: string; impact: number }[] }>(prompt);
    return {
      score: clamp(out.score, 0, 100),
      notes: String(out.notes ?? '').slice(0, 600),
      trends: (out.trends ?? []).map((t) => ({ label: String(t.label).slice(0, 30), impact: clamp(t.impact, -0.3, 0.3) })),
    };
  }

  async forecastSeries({
    startup, months, userScore, marketScore,
  }: { startup: Startup; months: string[]; userScore: number; marketScore: number }): Promise<MonthlyPoint[]> {
    const prompt = `Project monthly users and USD revenue for the startup, month by month, for these months: ${months.join(', ')}.

Initial signal:
- Tech execution: ${startup.techExecution}/100
- Pitch score: ${startup.pitchScore}/100
- Market potential: ${startup.marketPotential}/100
- User review score (qualitative): ${userScore}/100
- Market review score (qualitative): ${marketScore}/100
- Segment hashtags: ${startup.hashtags.join(', ')}

Use compound growth with seasonal variation. ARPU should reflect persona satisfaction.
Initial month (${months[0]}) users should be in the 50..500 range — a credible MVP launch baseline.
By the final month (${months[months.length - 1]}) growth should reflect market + product momentum.

Return JSON only:
{
  "monthly": [
    { "month": "2026-05", "users": <int>, "revenueUSD": <int> },
    ... ${months.length} entries, in the same order as the input months list
  ]
}`;
    const out = await this.chat<{ monthly: MonthlyPoint[] }>(prompt);
    const arr = Array.isArray(out.monthly) ? out.monthly : [];
    // pad/trim to exact months and clamp negatives
    return months.map((m, i) => {
      const p = arr[i] ?? { month: m, users: 0, revenueUSD: 0 };
      return {
        month: m,
        users: Math.max(0, Math.round(Number(p.users) || 0)),
        revenueUSD: Math.max(0, Math.round(Number(p.revenueUSD) || 0)),
      };
    });
  }

  async recommend({
    startup, userReview, marketReview,
  }: { startup: Startup; userReview: UserReview; marketReview: MarketReview }): Promise<string> {
    const prompt = `Write a 1-2 sentence concrete prioritized recommendation for the founder.
Startup: ${startup.name}
Pitch: ${startup.pitch}
User review score: ${userReview.score}/100  (${userReview.notes})
Market review score: ${marketReview.score}/100  (${marketReview.notes})
Trends: ${marketReview.trends.slice(0, 3).map((t) => t.label).join(', ')}

Return JSON only:
{ "recommendation": "<1-2 sentences>" }`;
    const out = await this.chat<{ recommendation: string }>(prompt);
    return String(out.recommendation ?? '').slice(0, 400);
  }
}

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}
