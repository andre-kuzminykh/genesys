/**
 * Real OpenAI adapter for the LlmPort.
 *
 * The API key is supplied at construction time. It is NEVER bundled into the
 * source — Vite reads it from import.meta.env.VITE_OPENAI_API_KEY at build
 * time (see web/Dockerfile + docker-compose.yml).
 *
 * Note: OpenAI allow-lists CORS for chat completions, so this works directly
 * from the browser. For production you should still use a backend proxy so
 * the key isn't exposed to the user's browser inspector.
 */

import type { LlmPort, MonthlyPoint, UserReview, MarketReview } from '@/domain/simulation';
import type { PersonaId, Startup } from '@/domain/types';

const ENDPOINT = 'https://api.openai.com/v1/chat/completions';
// Same-origin proxy backed by server/index.js — OpenAI doesn't expose CORS
// on the Responses API, so calling /v1/responses directly from the browser
// fails with "Failed to fetch". The proxy signs the request server-side.
const RESPONSES_PROXY_ENDPOINT = '/api/llm/responses';
const DEFAULT_MODEL = 'gpt-4o';

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

const PERSONA_BIBLE = `Persona reference (use these traits when scoring):
- impatient: rage-quits friction; loves first-value < 60s; will abandon onboarding > 3 steps
- technical: cares about API quality, observability, openness, self-host; allergic to magic
- student: low budget; wants generous free tier; learning-by-doing bias; price-driven churn
- power_user: keyboard-first; deep customisation; treats apps as workflows, not features
- skeptical_investor: wants real retention metrics, evidence of pull, not vibes; high bar`;

export class OpenAILlmAdapter implements LlmPort {
  constructor(private cfg: OpenAIConfig) {}

  private async chat<T>(prompt: string, opts: { max_tokens?: number; temperature?: number } = {}): Promise<T> {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: this.cfg.model ?? DEFAULT_MODEL,
        response_format: { type: 'json_object' },
        temperature: opts.temperature ?? 0.5,
        max_tokens: opts.max_tokens ?? 1200,
        messages: [
          {
            role: 'system',
            content:
              'You are a senior product/market analyst evaluating early-stage AI-native startups. ' +
              'You write concrete, opinionated, evidence-driven analyses — never marketing fluff. ' +
              'You ALWAYS return a single JSON object matching the user\'s schema. No prose outside JSON.',
          },
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

  /**
   * Variant of `chat` that uses the Responses API with the `web_search_preview`
   * tool, so the model can pull current public web content into its analysis.
   * Slower (5-15 s/call) but produces grounded output for market questions.
   */
  private async chatWithSearch<T>(prompt: string, opts: { max_tokens?: number; temperature?: number } = {}): Promise<T> {
    await acquireSearchSlot();
    try {
      const res = await fetch(RESPONSES_PROXY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.cfg.model ?? DEFAULT_MODEL,
          tools: [{ type: 'web_search_preview' }],
          temperature: opts.temperature ?? 0.5,
          max_output_tokens: opts.max_tokens ?? 1600,
          instructions:
            'You are a senior product/market analyst evaluating early-stage AI-native startups. ' +
            'You have access to web search and MUST use it before answering market questions. ' +
            'Return a single JSON object matching the schema in the user message. No prose outside JSON.',
          input: prompt,
        }),
      });
      if (!res.ok) {
        let m = `OpenAI responses ${res.status}`;
        try { const j = await res.json(); if (j?.error?.message) m = j.error.message; } catch { /* ignore */ }
        throw new OpenAIError(res.status, m);
      }
      const json = await res.json();
      const text = extractResponsesText(json);
      if (!text) throw new OpenAIError(500, 'OpenAI Responses API returned no text');
      try {
        return JSON.parse(text) as T;
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          try { return JSON.parse(match[0]) as T; } catch { /* fall through */ }
        }
        throw new OpenAIError(500, 'OpenAI Responses API returned invalid JSON');
      }
    } finally {
      releaseSearchSlot();
    }
  }

  async reviewForUser({ startup, personas }: { startup: Startup; personas: PersonaId[] }): Promise<UserReview> {
    const prompt = `# Task
You are running a panel of these 5 distinct user personas through a guided product review of an early-stage startup. Each persona has its own bias and objection style.

${PERSONA_BIBLE}

Active panel: ${personas.join(', ')}

# Startup under review
- Name: ${startup.name}
- One-line pitch: ${startup.pitch}
- Category: ${startup.category}
- Hashtags: ${startup.hashtags.map((h) => '#' + h).join(' ')}
- Long description (this is what the founder writes about the product):
"""
${startup.description ?? '(none)'}
"""
- Founder-reported scores (subjective, treat skeptically): tech execution ${startup.techExecution}/100, pitch ${startup.pitchScore}/100, market potential ${startup.marketPotential}/100.

# What I want you to do
1. INFER the Ideal Customer Profile (ICP) for this product in one sentence — who exactly is the early adopter, what are they doing today, and what is the painful trigger that pushes them to try this. Be specific (role, segment, behaviour, willingness-to-pay).
2. Mentally walk EACH persona through onboarding → first value → repeat use → invite-a-friend. Score each persona 0..100 on how likely they are to keep using it after week 2.
3. Aggregate to one panel score (the average rounded to int).
4. Write a substantive 4-6 sentence narrative review in the panel's voice. It MUST mention specific objections (pricing, friction, missing capability, ICP mismatch) and specific delights (where the product hits) — NOT generic praise. Reference at least one persona by name.
5. Estimate how many upvotes this would earn on a launch board (0..30).

# Output JSON schema
{
  "icp": "<one-sentence ICP — who they are, what they do today, what triggers them>",
  "perPersona": [ { "id": "<persona id>", "score": <int 0..100>, "objection": "<one short objection>" }, ... one per persona ],
  "score": <int 0..100, average>,
  "notes": "<4-6 sentence panel review, specific, NOT generic>",
  "upvoteBump": <int 0..30>
}`;
    const out = await this.chat<{
      icp: string;
      perPersona: { id: string; score: number; objection: string }[];
      score: number;
      notes: string;
      upvoteBump: number;
    }>(prompt, { max_tokens: 1400 });
    const icpLine = out.icp ? `ICP: ${out.icp}\n\n` : '';
    return {
      personaIds: personas,
      score: clamp(out.score, 0, 100),
      notes: (icpLine + String(out.notes ?? '')).slice(0, 2000),
      upvoteBump: clamp(Math.round(out.upvoteBump), 0, 30),
    };
  }

  async reviewForMarket({ startup }: { startup: Startup }): Promise<MarketReview> {
    const prompt = `# Task
You are a market analyst writing a 12-month forward view (May 2026 → May 2027) for an early-stage startup. Your output drives an investor's go/no-go decision, so be specific and opinionated. Use the web_search_preview tool to ground your analysis in current data.

# Startup
- Name: ${startup.name}
- Pitch: ${startup.pitch}
- Category: ${startup.category}
- Hashtags: ${startup.hashtags.map((h) => '#' + h).join(' ')}
- Long description:
"""
${startup.description ?? '(none)'}
"""

# Research steps (use web_search_preview)
Run 2-4 distinct web searches BEFORE answering. Useful queries:
- "${startup.category} market size 2026"
- "${startup.hashtags.slice(0, 2).map((h) => h.replace(/-/g, ' ')).join(' ')} startups 2026"
- "${startup.name} competitors" OR a substitute named in the description
- recent funding / launches / regulation news in the segment

# What I want
1. Locate this startup in a SPECIFIC named segment (not just "AI tools"). Note any 2026 trend you find from search (funding velocity, public launches, regulation, model-cost shifts).
2. Name 2-3 incumbents or close substitutes by name — what do users currently do? Cite sources where you found them.
3. Identify the strongest 1-2 tailwinds and the strongest 1-2 headwinds for this segment over the next 12 months, grounded in what you searched.
4. Score the market 0..100 on how favourable conditions are for a small new entrant in this exact niche. 50 = neutral; 75+ = real pull; <40 = hostile.
5. Write a 4-6 sentence narrative — segment named, dynamics specific, evidence-driven. Reference at least one finding from your searches.
6. Emit 3-6 trend labels with numerical impact in [-0.3, +0.3]. Short labels (#hashtag-style or 2-3 words). Positive = tailwind, negative = headwind.
7. List the 2-4 URLs you actually used.

# Output JSON schema
{
  "segment": "<specific named segment>",
  "incumbents": "<comma-separated 2-3 substitutes>",
  "score": <int 0..100>,
  "notes": "<4-6 sentence market narrative>",
  "trends": [ { "label": "<short label>", "impact": <float -0.3..0.3> }, ... 3-6 entries ],
  "sources": [ "<https://url>", ... 2-4 entries ]
}`;
    const out = await this.chatWithSearch<{
      segment: string;
      incumbents: string;
      score: number;
      notes: string;
      trends: { label: string; impact: number }[];
      sources: string[];
    }>(prompt, { max_tokens: 1800 });
    const header = out.segment
      ? `Segment: ${out.segment}${out.incumbents ? ` · Substitutes: ${out.incumbents}` : ''}\n\n`
      : '';
    const footer = Array.isArray(out.sources) && out.sources.length
      ? `\n\nSources:\n${out.sources.filter((u) => typeof u === 'string').slice(0, 4).map((u) => '· ' + u).join('\n')}`
      : '';
    return {
      score: clamp(out.score, 0, 100),
      notes: (header + String(out.notes ?? '') + footer).slice(0, 3000),
      trends: (out.trends ?? []).map((t) => ({ label: String(t.label).slice(0, 40), impact: clamp(t.impact, -0.3, 0.3) })),
    };
  }

  async forecastSeries({
    startup, months, userScore, marketScore,
  }: { startup: Startup; months: string[]; userScore: number; marketScore: number }): Promise<MonthlyPoint[]> {
    const prompt = `# Task
Project monthly users + monthly USD revenue for the startup, month by month, for these 13 months: ${months.join(', ')}.

# Inputs
- Startup: ${startup.name}
- Pitch: ${startup.pitch}
- Hashtags: ${startup.hashtags.join(', ')}
- Tech execution: ${startup.techExecution}/100
- Pitch score: ${startup.pitchScore}/100
- Market potential: ${startup.marketPotential}/100
- User panel review score: ${userScore}/100
- Market review score: ${marketScore}/100

# Modelling guidance
- Initial month (${months[0]}) users should be in the 50..500 range — a credible MVP launch baseline.
- Apply compound monthly growth shaped by user + market scores. Higher scores = steeper curve. Cap monthly growth at ~25%.
- Add mild seasonal variation (summer dip, autumn spike).
- ARPU should reflect persona satisfaction (low if user score < 40, mid 40-70, high > 70).
- By month 13 the curve should reflect both product pull (user score) AND market timing (market score) — not just one.
- Returned numbers must be integers.

# Output JSON schema
{
  "monthly": [
    { "month": "${months[0]}", "users": <int>, "revenueUSD": <int> },
    ... ${months.length} entries, in the same order as the input months list
  ]
}`;
    const out = await this.chat<{ monthly: MonthlyPoint[] }>(prompt, { max_tokens: 1400, temperature: 0.3 });
    const arr = Array.isArray(out.monthly) ? out.monthly : [];
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
    const prompt = `# Task
You are an experienced advisor giving the founder of an early-stage startup a substantive, non-generic, prioritised recommendation for the next 90 days.

# Startup
- Name: ${startup.name}
- Pitch: ${startup.pitch}
- Category: ${startup.category}
- Long description:
"""
${startup.description ?? '(none)'}
"""

# Findings so far
- User panel score: ${userReview.score}/100. Notes: ${userReview.notes}
- Market score: ${marketReview.score}/100. Notes: ${marketReview.notes}
- Top trend signals: ${marketReview.trends.slice(0, 4).map((t) => `${t.label} (${t.impact >= 0 ? '+' : ''}${Math.round(t.impact * 100)}%)`).join(', ') || '—'}

# What I want
A real recommendation — not a fortune cookie. Structure it as 4-7 sentences that:
1. Open with the single most important call (double down / pivot wedge / cut scope / kill / change ICP / etc.).
2. Reference at least one specific finding from the user OR market review by name (objection, ICP mismatch, named substitute, tailwind, etc.) — show you read the analysis.
3. List 2-3 concrete actions for the next 30/60/90 days. Specific actions, not "improve onboarding". Examples of specific: "ship a 60-second-to-first-value demo flow", "publish a benchmark vs <named substitute>", "narrow ICP to <specific segment> and rewrite landing accordingly".
4. End with the one metric the founder should monitor weekly to know if the call is working.

# Output JSON schema
{ "recommendation": "<4-7 sentence concrete advice>" }`;
    const out = await this.chat<{ recommendation: string }>(prompt, { max_tokens: 700 });
    return String(out.recommendation ?? '').slice(0, 1600);
  }
}

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

// Module-level semaphore that throttles the web_search-backed calls so we
// don't slam OpenAI's tier with 16 concurrent /v1/responses requests when
// the cohort simulation kicks off. Other calls (chat.completions) remain
// unthrottled — they're cheap and CORS-allowed.
const MAX_SEARCH_CONCURRENCY = 3;
let activeSearches = 0;
const searchQueue: Array<() => void> = [];

function acquireSearchSlot(): Promise<void> {
  return new Promise((resolve) => {
    if (activeSearches < MAX_SEARCH_CONCURRENCY) {
      activeSearches += 1;
      resolve();
    } else {
      searchQueue.push(() => { activeSearches += 1; resolve(); });
    }
  });
}
function releaseSearchSlot() {
  activeSearches -= 1;
  const next = searchQueue.shift();
  if (next) next();
}

// Pull the final assistant text from a /v1/responses payload. The convenience
// helper `output_text` is preferred when present; otherwise walk the structured
// `output` array for a `message` item with an `output_text` content block.
function extractResponsesText(json: any): string | null {
  if (typeof json?.output_text === 'string' && json.output_text.length > 0) {
    return json.output_text;
  }
  const items = Array.isArray(json?.output) ? json.output : [];
  for (const item of items) {
    if (item?.type !== 'message') continue;
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const c of content) {
      if (typeof c?.text === 'string' && c.text.length > 0) return c.text;
    }
  }
  return null;
}
