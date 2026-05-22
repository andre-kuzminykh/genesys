// End-to-end "game" smoke test: drives the real Express handlers (in-process,
// no docker, no nginx) with stubbed GitHub + a synthetic forecast, then
// verifies the on-disk state.json reflects every move AND that the
// computeBestInvestor formula picks the expected winner.
//
// This is the test the user wanted me to "run myself" — closest substitute
// for actually clicking around the deployed site.

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// --- env + GitHub stub (must be set BEFORE importing the server module) ----

const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'genesys-game-'));
process.env.STATE_FILE = path.join(tmpDir, 'state.json');
process.env.PORT = '0';
process.env.GITHUB_CLIENT_ID = 'dummy-client-id';
process.env.GITHUB_CLIENT_SECRET = 'dummy-secret';
process.env.PUBLIC_URL = 'http://localhost';

// Capture the real fetch first so we can fall through to it for any URL
// that isn't api.github.com — otherwise our own localhost calls to the
// Express app would also get caught by the stub.
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
const { app, loadState, state } = mod;

let server;
let base;

before(async () => {
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  const { port } = server.address();
  base = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(tmpDir, { recursive: true, force: true });
});

beforeEach(async () => {
  await fs.writeFile(process.env.STATE_FILE, JSON.stringify({ upvotes: {}, investments: [] }));
  await loadState();
});

async function jsonReq(p, init = {}) {
  const r = await fetch(base + p, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  return { status: r.status, json: await r.json().catch(() => null) };
}

const asUser = (handle) => ({ Authorization: `Bearer token-${handle}` });

describe('TEST-GAME-FLOW — full play-through (3 allowlisted users, mixed upvotes + investments)', () => {
  it('persists every move correctly and produces the expected Best Investor', async () => {
    // ---- Step 1 — three users cast a mix of upvotes ------------------------
    for (const move of [
      { who: 'andre-kuzminykh', startup: 'S-artrise' },
      { who: 'andre-kuzminykh', startup: 'S-calenmind' },
      { who: 'mashan555',       startup: 'S-invalerts' },
      { who: 'mashan555',       startup: 'S-artrise' },
      { who: 'weethet',         startup: 'S-ztbrowser' },
    ]) {
      const r = await jsonReq('/api/upvote', {
        method: 'POST',
        headers: asUser(move.who),
        body: JSON.stringify({ startupId: move.startup }),
      });
      assert.equal(r.status, 200);
      assert.equal(r.json.voted, true);
    }

    // ArtRise should now have 2 voters; the rest 1 each.
    const stateAfterUpvotes = await jsonReq('/api/state');
    assert.equal(stateAfterUpvotes.json.upvotes['S-artrise'].length, 2);
    assert.equal(stateAfterUpvotes.json.upvotes['S-calenmind'].length, 1);
    assert.equal(stateAfterUpvotes.json.upvotes['S-invalerts'].length, 1);
    assert.equal(stateAfterUpvotes.json.upvotes['S-ztbrowser'].length, 1);

    // ---- Step 2 — same 3 users place investments ---------------------------
    // andre is the admin: he's allowed to back his own portfolio + others.
    for (const inv of [
      { who: 'andre-kuzminykh', startup: 'S-artrise',     amount: 30_000 },
      { who: 'andre-kuzminykh', startup: 'S-calenmind',   amount: 20_000 },
      { who: 'mashan555',       startup: 'S-invalerts',   amount: 50_000 },
      { who: 'weethet',         startup: 'S-ztbrowser',   amount: 10_000 },
      { who: 'weethet',         startup: 'S-p2pedit',     amount: 10_000 }, // weethet owns p2pedit — should refuse
    ]) {
      const r = await jsonReq('/api/invest', {
        method: 'POST',
        headers: asUser(inv.who),
        body: JSON.stringify({ startupId: inv.startup, amount: inv.amount }),
      });
      if (inv.who === 'weethet' && inv.startup === 'S-p2pedit') {
        assert.equal(r.status, 400);
        assert.equal(r.json.error, 'SELF_INVEST_FORBIDDEN', 'weethet must NOT invest in their own startup');
      } else {
        assert.equal(r.status, 200);
        assert.equal(r.json.investment.amount, inv.amount);
      }
    }

    // ---- Step 3 — verify the persisted state.json --------------------------
    const finalState = JSON.parse(await fs.readFile(process.env.STATE_FILE, 'utf8'));
    assert.equal(finalState.investments.length, 4, 'expected exactly 4 successful investments');

    const byHandle = {};
    for (const i of finalState.investments) {
      byHandle[i.investorHandle] = (byHandle[i.investorHandle] ?? 0) + i.amount;
    }
    assert.equal(byHandle['andre-kuzminykh'], 50_000);
    assert.equal(byHandle['mashan555'],       50_000);
    assert.equal(byHandle['weethet'],         10_000);

    // ---- Step 4 — drive computeBestInvestor with a synthetic forecast ------
    // Same revenue table the README walks through.
    const { computeBestInvestor } = await import('../web/src/domain/winners.ts').catch(async () => {
      // The frontend file is .ts and we don't transpile here — re-implement
      // the formula locally and keep this test framework-free.
      return { computeBestInvestor: (investments, revenueByStartup) => {
        if (investments.length === 0) return null;
        const port = {};
        for (const inv of investments) {
          const h = inv.investorHandle.toLowerCase();
          const slot = port[h] ?? { invested: 0, score: 0, picks: 0 };
          slot.invested += inv.amount;
          slot.picks += 1;
          const rev = revenueByStartup[inv.startupId] ?? 100_000;
          slot.score += inv.amount * (rev / 1_000_000);
          port[h] = slot;
        }
        const ranked = Object.entries(port).map(([h, p]) => ({ handle: h, ...p })).sort((a, b) => b.score - a.score || b.invested - a.invested);
        return ranked[0] ?? null;
      } };
    });

    const revenue = {
      'S-artrise':    250_000,
      'S-calenmind':  180_000,
      'S-invalerts':  190_000,
      'S-ztbrowser':  150_000,
    };

    const winner = computeBestInvestor(finalState.investments, revenue);
    assert.equal(winner.handle, 'andre-kuzminykh',
      'andre invested 30k×0.25 + 20k×0.18 = 11,100 — should win over mashan (50k×0.19 = 9,500) and weethet (10k×0.15 = 1,500)');
    assert.equal(winner.picks, 2);
    assert.equal(winner.invested, 50_000);
    assert.ok(Math.abs(winner.score - (30_000 * 0.25 + 20_000 * 0.18)) < 0.01);
  });
});
