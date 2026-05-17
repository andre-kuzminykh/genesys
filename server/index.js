// Genesys backend — GitHub OAuth proxy + shared state API.
//
// State persistence: a single JSON file at $STATE_FILE (default /data/state.json).
// All mutating endpoints take a GitHub bearer token, verify the caller's login
// against the cohort allowlist, and serialise writes through a tiny in-process
// promise queue. Listing/reading is unauthenticated so anonymous visitors can
// still see the leaderboard.

import express from 'express';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.PORT || 3000);
const CLIENT_ID = (process.env.GITHUB_CLIENT_ID || '').trim();
const CLIENT_SECRET = (process.env.GITHUB_CLIENT_SECRET || '').trim();
const PUBLIC_URL = (process.env.PUBLIC_URL || '').replace(/\/$/, ''); // no trailing slash
const STATE_FILE = process.env.STATE_FILE || '/data/state.json';
const SCOPE = 'read:user repo';
const CREDITS_PER_INVESTOR = 100000;

// Server-side OpenAI key — used to proxy the Responses API (web_search) call
// from the browser. Browser CORS blocks /v1/responses directly, so we sign
// the request server-side and forward the body unchanged. The key stays out
// of the JS bundle when callers route through the proxy.
const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '').trim();
const OPENAI_MODEL = (process.env.OPENAI_MODEL || process.env.VITE_OPENAI_MODEL || 'gpt-4o').trim();

// Cohort allowlist — kept in sync with web/src/data/seed.ts. Comparison is
// case-insensitive because GitHub returns the canonical casing of the login
// while users may type any variant.
const ADMINS = new Set(['andre-kuzminykh']);

const ALLOWLIST = new Set([
  ...ADMINS,
  'artem-grigorash', 'artem3605', 'darkmechanikum', 'denksworkspace',
  'hspyroblast', 'kamaliyaal', 'kreativshikkk', 'mashan555',
  'maxlevitsky', 'mitya139', 'petrenkosofya', 'rusyaew',
  'somethingnew179', 'weethet',
].map((h) => h.toLowerCase()));

// Map of startup -> owner handle, used to enforce the no-self-invest rule.
// Kept in sync with web/src/data/seed.ts (S-* IDs).
const STARTUP_OWNERS = {
  'S-artrise':      'artem-grigorash',
  'S-shelfly':      'artem3605',
  'S-ailab':        'darkmechanikum',
  'S-bte':          'denksworkspace',
  'S-albion':       'hspyroblast',
  'S-calenmind':    'kamaliyaal',
  'S-invalerts':    'kreativshikkk',
  'S-stylify':      'mashan555',
  'S-clutchup':     'maxlevitsky',
  'S-arb':          'mitya139',
  'S-creators':     'petrenkosofya',
  'S-ztbrowser':    'rusyaew',
  'S-tglearn':      'somethingnew179',
  'S-p2pedit':      'weethet',
  'S-tonloans':     'andre-kuzminykh',
  'S-fridgefriend': 'andre-kuzminykh',
};

// ------------------------------ State store --------------------------------

/** @type {{ upvotes: Record<string, string[]>, investments: Array<{startupId:string, investorHandle:string, amount:number, ts:number}> }} */
let state = { upvotes: {}, investments: [] };

async function loadState() {
  try {
    const raw = await fs.readFile(STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    state = {
      upvotes: parsed?.upvotes && typeof parsed.upvotes === 'object' ? parsed.upvotes : {},
      investments: Array.isArray(parsed?.investments) ? parsed.investments : [],
    };
    console.log(`[genesys-api] loaded state from ${STATE_FILE} (` +
      `${Object.keys(state.upvotes).length} upvote rows, ${state.investments.length} investments)`);
  } catch (e) {
    if (e?.code !== 'ENOENT') console.warn(`[genesys-api] failed to load ${STATE_FILE}:`, e?.message);
    state = { upvotes: {}, investments: [] };
  }
}

let writeChain = Promise.resolve();
function persistState() {
  writeChain = writeChain.then(async () => {
    try {
      await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
      const tmp = STATE_FILE + '.tmp';
      await fs.writeFile(tmp, JSON.stringify(state), 'utf8');
      await fs.rename(tmp, STATE_FILE);
    } catch (e) {
      console.error(`[genesys-api] failed to persist ${STATE_FILE}:`, e);
    }
  });
  return writeChain;
}

// ---------------------------- GitHub helpers -------------------------------

async function whoami(token) {
  const r = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!r.ok) throw new Error(`github /user → ${r.status}`);
  const j = await r.json();
  if (!j?.login) throw new Error('github /user returned no login');
  return String(j.login);
}

function bearer(req) {
  const h = String(req.headers.authorization || '');
  const m = /^Bearer\s+(.+)$/i.exec(h) || /^token\s+(.+)$/i.exec(h);
  return m ? m[1].trim() : null;
}

// ------------------------------- App ---------------------------------------

const app = express();
app.use(express.json({ limit: '32kb' }));

app.get('/auth/health', (_req, res) => {
  res.json({
    ok: true,
    configured: Boolean(CLIENT_ID && CLIENT_SECRET && PUBLIC_URL),
    publicUrl: PUBLIC_URL || null,
    stateFile: STATE_FILE,
    upvoteRows: Object.keys(state.upvotes).length,
    investmentCount: state.investments.length,
    openai: { hasKey: Boolean(OPENAI_API_KEY), model: OPENAI_MODEL },
  });
});

// ----- OpenAI Responses API proxy --------------------------------------------
// Browser-direct calls to /v1/responses fail with a CORS preflight error
// (OpenAI does NOT expose CORS on the Responses endpoint, even though they do
// on /v1/chat/completions). We forward the same request body server-side and
// return the response payload unchanged so the frontend can keep parsing it
// the same way.
// Image generation proxy — DALL-E. Returns the raw OpenAI payload (with
// `data: [{ b64_json }]`). The frontend wraps b64_json into a data URL.
app.post('/api/llm/image', async (req, res) => {
  if (!OPENAI_API_KEY) {
    return res.status(503).json({ ok: false, error: 'NO_OPENAI_KEY' });
  }
  const payload = {
    model: 'dall-e-3',
    size: '1024x1024',
    response_format: 'b64_json',
    n: 1,
    ...(req.body ?? {}),
  };
  const startTs = Date.now();
  const tag = `[genesys-api] image ${payload.model}`;
  try {
    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    const json = await r.json().catch(() => ({}));
    console.log(`${tag} ← ${r.status} (${Date.now() - startTs} ms)`);
    return res.status(r.status).json(json);
  } catch (e) {
    console.error(`${tag} FAILED:`, e?.message ?? e);
    return res.status(502).json({ ok: false, error: 'PROXY_FAILED', message: String(e?.message ?? e) });
  }
});

// Simple chat.completions passthrough — same security model as the Responses
// proxy above, but for the cheap JSON chat path used by the Build wizard's
// "magic wand" suggestions.
app.post('/api/llm/chat', async (req, res) => {
  if (!OPENAI_API_KEY) {
    return res.status(503).json({ ok: false, error: 'NO_OPENAI_KEY' });
  }
  const payload = { ...(req.body ?? {}) };
  if (!payload.model) payload.model = OPENAI_MODEL;
  const startTs = Date.now();
  const tag = `[genesys-api] chat ${payload.model}`;
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    const json = await r.json().catch(() => ({}));
    console.log(`${tag} ← ${r.status} (${Date.now() - startTs} ms)`);
    return res.status(r.status).json(json);
  } catch (e) {
    console.error(`${tag} FAILED:`, e?.message ?? e);
    return res.status(502).json({ ok: false, error: 'PROXY_FAILED', message: String(e?.message ?? e) });
  }
});

app.post('/api/llm/responses', async (req, res) => {
  if (!OPENAI_API_KEY) {
    return res.status(503).json({ ok: false, error: 'NO_OPENAI_KEY' });
  }
  const payload = { ...(req.body ?? {}) };
  if (!payload.model) payload.model = OPENAI_MODEL;
  const startTs = Date.now();
  const tag = `[genesys-api] responses ${payload.model}`;
  console.log(`${tag} → OpenAI`);
  const ctrl = new AbortController();
  // 4-minute hard ceiling — web_search calls are typically 5-25 s, but
  // OpenAI can stall on the Responses API and we'd rather error than
  // hang nginx workers indefinitely.
  const timer = setTimeout(() => ctrl.abort(), 240_000);
  try {
    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    const json = await r.json().catch(() => ({}));
    const ms = Date.now() - startTs;
    console.log(`${tag} ← ${r.status} (${ms} ms)`);
    return res.status(r.status).json(json);
  } catch (e) {
    const ms = Date.now() - startTs;
    console.error(`${tag} FAILED after ${ms} ms:`, e?.message ?? e);
    return res.status(502).json({ ok: false, error: 'PROXY_FAILED', message: String(e?.message ?? e) });
  } finally {
    clearTimeout(timer);
  }
});

// Reject obvious placeholder values so users see a clear error instead of GitHub's 404.
const PLACEHOLDER_RX = /(your|client_id|client_secret|placeholder|<.*>|change_me|todo)/i;

app.get('/auth/github', (_req, res) => {
  if (!CLIENT_ID || !PUBLIC_URL) {
    return res.status(500).type('text/html').send(htmlError(
      'GitHub OAuth not configured',
      'Set <code>GITHUB_CLIENT_ID</code>, <code>GITHUB_CLIENT_SECRET</code> and <code>PUBLIC_URL</code> in /opt/genesis/.env, then <code>docker compose up -d --force-recreate auth</code>.',
    ));
  }
  if (PLACEHOLDER_RX.test(CLIENT_ID) || PLACEHOLDER_RX.test(CLIENT_SECRET)) {
    return res.status(500).type('text/html').send(htmlError(
      'You left placeholder values in .env',
      'Create a real GitHub OAuth App at <a href="https://github.com/settings/applications/new">github.com/settings/applications/new</a>, copy the Client ID + Client Secret into /opt/genesis/.env, then <code>docker compose up -d --force-recreate auth</code>.',
    ));
  }
  const stateParam = Math.random().toString(36).slice(2);
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: `${PUBLIC_URL}/auth/github/callback`,
    scope: SCOPE,
    state: stateParam,
    allow_signup: 'true',
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

app.get('/auth/github/callback', async (req, res) => {
  const code = String(req.query.code || '');
  if (!code) return res.redirect('/login?error=no_code');
  if (!CLIENT_ID || !CLIENT_SECRET) return res.redirect('/login?error=no_config');
  try {
    const r = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code }),
    });
    const j = await r.json().catch(() => ({}));
    const token = j?.access_token;
    if (!token) {
      console.warn('GitHub did not return access_token:', j);
      return res.redirect('/login?error=no_token');
    }
    return res.redirect(`/auth/success#token=${encodeURIComponent(token)}`);
  } catch (e) {
    console.error('OAuth exchange failed', e);
    return res.redirect('/login?error=exchange');
  }
});

// -------------------------- Shared state API -------------------------------

app.get('/api/state', (_req, res) => {
  res.json({ upvotes: state.upvotes, investments: state.investments });
});

function totalInvested(handle) {
  return state.investments
    .filter((i) => i.investorHandle.toLowerCase() === handle.toLowerCase())
    .reduce((a, b) => a + b.amount, 0);
}

app.post('/api/upvote', async (req, res) => {
  const token = bearer(req);
  if (!token) return res.status(401).json({ ok: false, error: 'NO_TOKEN' });
  const startupId = String(req.body?.startupId || '');
  if (!startupId) return res.status(400).json({ ok: false, error: 'NO_STARTUP_ID' });

  let login;
  try { login = await whoami(token); }
  catch (e) { return res.status(401).json({ ok: false, error: 'BAD_TOKEN' }); }

  if (!ALLOWLIST.has(login.toLowerCase())) {
    return res.status(403).json({ ok: false, error: 'NOT_IN_ALLOWLIST', login });
  }

  const list = state.upvotes[startupId] ?? [];
  const idx = list.findIndex((h) => h.toLowerCase() === login.toLowerCase());
  let voted;
  if (idx >= 0) { list.splice(idx, 1); voted = false; }
  else          { list.push(login);    voted = true; }
  state.upvotes[startupId] = list;
  await persistState();
  return res.json({ ok: true, startupId, voted, count: list.length, login });
});

app.post('/api/invest', async (req, res) => {
  const token = bearer(req);
  if (!token) return res.status(401).json({ ok: false, error: 'NO_TOKEN' });
  const startupId = String(req.body?.startupId || '');
  const amount = Math.floor(Number(req.body?.amount));
  if (!startupId) return res.status(400).json({ ok: false, error: 'NO_STARTUP_ID' });
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ ok: false, error: 'INVALID_AMOUNT' });

  let login;
  try { login = await whoami(token); }
  catch (e) { return res.status(401).json({ ok: false, error: 'BAD_TOKEN' }); }

  if (!ALLOWLIST.has(login.toLowerCase())) {
    return res.status(403).json({ ok: false, error: 'NOT_IN_ALLOWLIST', login });
  }

  const owner = STARTUP_OWNERS[startupId];
  // Admins can back every startup including the ones they own; regular cohort
  // members can't put their own credits into their own project.
  if (owner && owner.toLowerCase() === login.toLowerCase() && !ADMINS.has(login.toLowerCase())) {
    return res.status(400).json({ ok: false, error: 'SELF_INVEST_FORBIDDEN' });
  }

  const spent = totalInvested(login);
  if (spent + amount > CREDITS_PER_INVESTOR) {
    return res.status(400).json({ ok: false, error: 'INSUFFICIENT_CREDITS', remaining: CREDITS_PER_INVESTOR - spent });
  }

  const record = { startupId, investorHandle: login, amount, ts: Date.now() };
  state.investments.push(record);
  await persistState();
  return res.json({ ok: true, investment: record, walletRemaining: CREDITS_PER_INVESTOR - (spent + amount) });
});

function htmlError(title, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
  body{background:#060913;color:#fff;font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}
  .card{max-width:640px;border:1px solid #2A2E3D;background:#161B34;border-radius:24px;padding:32px}
  h1{color:#FF4B4B;margin:0 0 16px}
  p{color:#A0A8C6;line-height:1.6;font-size:15px}
  code{background:#060913;padding:2px 6px;border-radius:4px;color:#7FFF00;font-family:"JetBrains Mono",monospace}
  a{color:#7FFF00}
</style>
</head><body><div class="card"><h1>${title}</h1><p>${body}</p></div></body></html>`;
}

await loadState();

// Only listen when invoked as the CLI entrypoint. Tests import this module
// and start their own ephemeral server — calling `app.listen` at module load
// time would leak that port and keep the test process from exiting.
if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  app.listen(PORT, () => {
    console.log(`[genesys-auth] listening on :${PORT}, configured=${Boolean(CLIENT_ID && CLIENT_SECRET && PUBLIC_URL)}, state=${STATE_FILE}`);
  });
}

// Exported for tests
export { app, state, loadState, persistState, ALLOWLIST, STARTUP_OWNERS, CREDITS_PER_INVESTOR, OPENAI_API_KEY };
