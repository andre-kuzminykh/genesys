// Backend API tests for /api/state, /api/upvote and /api/invest.
// We don't mock GitHub: instead we stub global.fetch so whoami() returns a
// deterministic login per token, then drive the Express app directly with
// node:http requests.

import { describe, it, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// Configure state file BEFORE importing the server module.
const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'genesys-state-'));
process.env.STATE_FILE = path.join(tmpDir, 'state.json');
process.env.PORT = '0';
process.env.GITHUB_CLIENT_ID = 'dummy-client-id';
process.env.GITHUB_CLIENT_SECRET = 'dummy-secret';
process.env.PUBLIC_URL = 'http://localhost';

// Intercept fetch *only* for api.github.com so whoami() returns a deterministic
// login per token (we use tokens like "token-andre-kuzminykh" in tests). All
// other requests — notably the test client hitting our own loopback server —
// pass through to the real fetch.
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  const u = String(url);
  if (u.startsWith('https://api.github.com/user')) {
    const auth = String(init?.headers?.Authorization ?? '');
    const m = /token\s+token-(.+)/i.exec(auth);
    if (!m) return new Response('{"message":"bad creds"}', { status: 401 });
    return new Response(JSON.stringify({ login: m[1] }), { status: 200 });
  }
  return realFetch(url, init);
};

const mod = await import('./index.js');
const { app, loadState } = mod;

// Start the test server inline (top-level await) — putting it in node:test's
// `before` hook turned out to not always fire before subtests in this version.
const server = await new Promise((resolve) => {
  const s = app.listen(0, () => resolve(s));
});
const base = `http://127.0.0.1:${server.address().port}`;

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(tmpDir, { recursive: true, force: true });
});

beforeEach(async () => {
  await fs.writeFile(process.env.STATE_FILE, JSON.stringify({ upvotes: {}, investments: [] }));
  await loadState();
});

async function jsonReq(path, init = {}) {
  const r = await fetch(base + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  return { status: r.status, json: await r.json().catch(() => null) };
}

describe('TEST-GEN-220 — /api/state', () => {
  it('returns an empty store when nothing has happened yet', async () => {
    const r = await jsonReq('/api/state');
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { upvotes: {}, investments: [] });
  });
});

describe('TEST-GEN-221 — /api/upvote', () => {
  it('rejects requests without a bearer token', async () => {
    const r = await jsonReq('/api/upvote', { method: 'POST', body: JSON.stringify({ startupId: 'S-artrise' }) });
    assert.equal(r.status, 401);
    assert.equal(r.json.error, 'NO_TOKEN');
  });

  it('rejects users not on the cohort allowlist', async () => {
    const r = await jsonReq('/api/upvote', {
      method: 'POST',
      headers: { Authorization: 'Bearer token-randompasserby' },
      body: JSON.stringify({ startupId: 'S-artrise' }),
    });
    assert.equal(r.status, 403);
    assert.equal(r.json.error, 'NOT_IN_ALLOWLIST');
  });

  it('toggles a vote for an allowlisted user and persists it', async () => {
    const first = await jsonReq('/api/upvote', {
      method: 'POST',
      headers: { Authorization: 'Bearer token-andre-kuzminykh' },
      body: JSON.stringify({ startupId: 'S-artrise' }),
    });
    assert.equal(first.status, 200);
    assert.equal(first.json.voted, true);
    assert.equal(first.json.count, 1);

    const after = await jsonReq('/api/state');
    assert.deepEqual(after.json.upvotes['S-artrise'], ['andre-kuzminykh']);

    const second = await jsonReq('/api/upvote', {
      method: 'POST',
      headers: { Authorization: 'Bearer token-andre-kuzminykh' },
      body: JSON.stringify({ startupId: 'S-artrise' }),
    });
    assert.equal(second.json.voted, false);
    assert.equal(second.json.count, 0);
  });

  it('counts votes from different cohort members independently', async () => {
    await jsonReq('/api/upvote', {
      method: 'POST',
      headers: { Authorization: 'Bearer token-andre-kuzminykh' },
      body: JSON.stringify({ startupId: 'S-artrise' }),
    });
    const r2 = await jsonReq('/api/upvote', {
      method: 'POST',
      headers: { Authorization: 'Bearer token-mashan555' },
      body: JSON.stringify({ startupId: 'S-artrise' }),
    });
    assert.equal(r2.json.count, 2);
    const s = await jsonReq('/api/state');
    assert.equal(s.json.upvotes['S-artrise'].length, 2);
  });
});

describe('TEST-GEN-222 — /api/invest', () => {
  it('refuses self-investment when the caller owns the startup', async () => {
    const r = await jsonReq('/api/invest', {
      method: 'POST',
      headers: { Authorization: 'Bearer token-artem-grigorash' },
      body: JSON.stringify({ startupId: 'S-artrise', amount: 1000 }),
    });
    assert.equal(r.status, 400);
    assert.equal(r.json.error, 'SELF_INVEST_FORBIDDEN');
  });

  it('records an investment and updates the wallet remaining', async () => {
    const r = await jsonReq('/api/invest', {
      method: 'POST',
      headers: { Authorization: 'Bearer token-mashan555' },
      body: JSON.stringify({ startupId: 'S-artrise', amount: 25_000 }),
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.walletRemaining, 75_000);
    assert.equal(r.json.investment.investorHandle, 'mashan555');
    const s = await jsonReq('/api/state');
    assert.equal(s.json.investments.length, 1);
  });

  it('rejects an investment that would overdraw the $100,000 budget', async () => {
    await jsonReq('/api/invest', {
      method: 'POST',
      headers: { Authorization: 'Bearer token-mashan555' },
      body: JSON.stringify({ startupId: 'S-artrise', amount: 90_000 }),
    });
    const r = await jsonReq('/api/invest', {
      method: 'POST',
      headers: { Authorization: 'Bearer token-mashan555' },
      body: JSON.stringify({ startupId: 'S-bte', amount: 20_000 }),
    });
    assert.equal(r.status, 400);
    assert.equal(r.json.error, 'INSUFFICIENT_CREDITS');
    assert.equal(r.json.remaining, 10_000);
  });
});
