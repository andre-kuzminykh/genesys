/**
 * Build-wizard LLM helpers.
 *
 * Every "magic wand" button on the Build screen routes through this module.
 * All calls go through the same-origin /api/llm/chat proxy so the OpenAI key
 * stays server-side.
 */

const ENDPOINT = '/api/llm/chat';

export class BuildAssistError extends Error {
  constructor(public code: 'NO_KEY' | 'NETWORK' | 'BAD_JSON' | 'API', message: string) {
    super(message);
    this.name = 'BuildAssistError';
  }
}

async function chatJSON<T>(systemPrompt: string, userPrompt: string, maxTokens = 800): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!res.ok) {
    let msg = `chat ${res.status}`;
    try { const j = await res.json(); msg = j?.error?.message ?? j?.error ?? msg; } catch {/* ignore */}
    if (res.status === 503) throw new BuildAssistError('NO_KEY', 'OpenAI key not configured on the server.');
    throw new BuildAssistError('API', msg);
  }
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new BuildAssistError('BAD_JSON', 'Empty response from OpenAI.');
  try {
    return JSON.parse(content) as T;
  } catch {
    throw new BuildAssistError('BAD_JSON', 'Could not parse JSON from the model.');
  }
}

// ---- Step 1: Product foundation ---------------------------------------------

export interface ProductSeed {
  user?: string;
  problem?: string;
  solution?: string;
  metrics?: string[];
}

const SYSTEM_PRODUCT =
  'You are a senior product analyst helping a founder spec a brand-new product. ' +
  'Your answers are short, opinionated, concrete. Return ONLY JSON matching the requested schema.';

export async function suggestUser(p: ProductSeed): Promise<string> {
  const r = await chatJSON<{ user: string }>(SYSTEM_PRODUCT, `Given the partial product brief below, write a one-sentence description of the IDEAL early adopter (role + segment + what triggers them to look for a tool like this).

Brief so far:
- problem: ${p.problem || '(unknown)'}
- solution: ${p.solution || '(unknown)'}
- metrics: ${(p.metrics ?? []).filter(Boolean).join('; ') || '(none)'}

Return JSON: { "user": "<one sentence>" }`);
  return r.user;
}

export async function suggestProblem(p: ProductSeed): Promise<string> {
  const r = await chatJSON<{ problem: string }>(SYSTEM_PRODUCT, `Given the partial product brief below, write a 1-2 sentence description of the painful problem this product solves — frame it from the user's POV with a concrete moment of pain.

Brief so far:
- user: ${p.user || '(unknown)'}
- solution: ${p.solution || '(unknown)'}

Return JSON: { "problem": "<1-2 sentences>" }`);
  return r.problem;
}

export async function suggestSolution(p: ProductSeed): Promise<string> {
  const r = await chatJSON<{ solution: string }>(SYSTEM_PRODUCT, `Given the partial product brief below, write a 1-2 sentence description of the solution this product offers — what it actually does, end-to-end, in plain English.

Brief so far:
- user: ${p.user || '(unknown)'}
- problem: ${p.problem || '(unknown)'}

Return JSON: { "solution": "<1-2 sentences>" }`);
  return r.solution;
}

export async function suggestMetrics(p: ProductSeed): Promise<string[]> {
  const r = await chatJSON<{ metrics: string[] }>(SYSTEM_PRODUCT, `Given the product brief below, propose 3 concrete success metrics — each one a short measurable statement (e.g. "Median time-to-first-value < 60 s", "Weekly active users in target segment").

- user: ${p.user || '(unknown)'}
- problem: ${p.problem || '(unknown)'}
- solution: ${p.solution || '(unknown)'}

Return JSON: { "metrics": ["<m1>", "<m2>", "<m3>"] }`, 600);
  return Array.isArray(r.metrics) ? r.metrics.slice(0, 5).map(String) : [];
}

// ---- Cover image generation -------------------------------------------------

/**
 * Generates a cover image for the product brief via OpenAI's image endpoint.
 * Returns a `data:image/png;base64,…` URL suitable for `<img src>` and for
 * storing inline in the localStorage draft.
 */
export async function generateCoverImage(p: ProductSeed): Promise<string> {
  const prompt = [
    `Editorial cover illustration for an early-stage AI startup card.`,
    `Subject: ${p.solution || 'an AI productivity tool'} for ${p.user || 'modern professionals'}.`,
    `Problem it solves: ${p.problem || '(unspecified pain)'}.`,
    `Style: dark navy background with neon-green and soft-blue accents.`,
    `Editorial, minimal, symbolic. No text or logos. No human faces. Modern, clean.`,
  ].join(' ');

  const res = await fetch('/api/llm/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, size: '1024x1024', n: 1, response_format: 'b64_json' }),
  });
  if (!res.ok) {
    if (res.status === 503) throw new BuildAssistError('NO_KEY', 'OpenAI key not configured on the server.');
    let msg = `image ${res.status}`;
    try { const j = await res.json(); msg = j?.error?.message ?? j?.error ?? msg; } catch {/* ignore */}
    throw new BuildAssistError('API', msg);
  }
  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (typeof b64 !== 'string' || b64.length === 0) {
    throw new BuildAssistError('BAD_JSON', 'OpenAI returned no image bytes.');
  }
  return `data:image/png;base64,${b64}`;
}

export interface FeatureSuggestion {
  name: string;
  oneliner: string;
  priority: 'must' | 'should' | 'could';
}

export async function suggestFeatures(p: ProductSeed): Promise<FeatureSuggestion[]> {
  const r = await chatJSON<{ features: FeatureSuggestion[] }>(SYSTEM_PRODUCT, `Given the product brief below, propose 4-6 cohesive features for a credible v1. Each feature has:
  - name: 2-4 words
  - oneliner: ≤ 15 words, what the user can DO with it
  - priority: "must" | "should" | "could"

A v1 should have 2-3 "must" features and the rest a mix of should/could.

Brief:
- user: ${p.user || '(unknown)'}
- problem: ${p.problem || '(unknown)'}
- solution: ${p.solution || '(unknown)'}
- metrics: ${(p.metrics ?? []).filter(Boolean).join('; ') || '(none)'}

Return JSON: { "features": [ { "name": "...", "oneliner": "...", "priority": "must" }, ... ] }`, 1000);
  return Array.isArray(r.features)
    ? r.features.slice(0, 8).map((f) => ({
        name: String(f.name ?? '').slice(0, 60),
        oneliner: String(f.oneliner ?? '').slice(0, 200),
        priority: (f.priority === 'must' || f.priority === 'should' || f.priority === 'could') ? f.priority : 'should',
      }))
    : [];
}
