/**
 * OpenAI credentials shim — kept only so older call sites compile cleanly.
 *
 * Real key handling now lives entirely on the server (server/index.js holds
 * OPENAI_API_KEY and the browser reaches OpenAI via the same-origin
 * /api/llm/chat + /api/llm/responses + /api/llm/image proxies). That means:
 *
 *   - the browser bundle no longer contains a real OpenAI key,
 *   - rotating the key is a server-side `.env` edit + `docker compose up -d --force-recreate auth`,
 *   - no `docker compose build web` is needed for key rotation.
 *
 * VITE_OPENAI_MODEL is still honoured at build time for the rare case where
 * we want the client to default to a specific model name in the request body
 * the proxy forwards; the server-side OPENAI_MODEL acts as the final fallback
 * when the client doesn't ask for one.
 */

export const BAKED_OPENAI_KEY = '';

export const BAKED_OPENAI_MODEL =
  (import.meta.env.VITE_OPENAI_MODEL as string | undefined)?.trim() || 'gpt-4o-mini';

// True at the type level so existing call sites keep using OpenAILlmAdapter
// (which now goes through the proxy). The adapter will surface a NO_OPENAI_KEY
// 503 from the proxy if the server itself has no key, and the runner falls
// back to MockLlmAdapter on that error.
export const HAS_BAKED_KEY = true;
