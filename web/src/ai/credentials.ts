/**
 * OpenAI credentials loaded from build-time env vars.
 *
 * Vite inlines `import.meta.env.VITE_*` at compile time. To bake your key into
 * the bundle, create a local `.env` (gitignored) in this folder:
 *
 *     VITE_OPENAI_API_KEY=sk-proj-...
 *     VITE_OPENAI_MODEL=gpt-4o-mini
 *
 * Or pass --build-arg on `docker compose build` (see web/Dockerfile).
 *
 * If no key is provided the OpenAI adapter throws on first call and the
 * runner silently falls back to the deterministic MockLlmAdapter.
 *
 * ⚠ The key ends up in the public JS bundle and is visible to anyone who
 *   opens DevTools on the deployed page. Rotate the key after the demo,
 *   or move OpenAI calls behind a backend proxy.
 */

export const BAKED_OPENAI_KEY =
  (import.meta.env.VITE_OPENAI_API_KEY as string | undefined)?.trim() ?? '';

export const BAKED_OPENAI_MODEL =
  (import.meta.env.VITE_OPENAI_MODEL as string | undefined)?.trim() || 'gpt-4o-mini';

export const HAS_BAKED_KEY = BAKED_OPENAI_KEY.length > 0;
