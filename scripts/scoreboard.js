#!/usr/bin/env node
/**
 * Investor scoreboard CLI.
 *
 *   node scripts/scoreboard.js                       # state + invested-only ranking
 *   node scripts/scoreboard.js --forecast=fc.json    # state + simulated revenue weights
 *   node scripts/scoreboard.js --state=/path/to/state.json --forecast=fc.json
 *
 * Defaults match the production VM (/opt/genesis/data/state.json).
 *
 * state.json shape:  { upvotes: {...}, investments: [{ startupId, investorHandle, amount }, ...] }
 * forecast.json shape (copy of browser localStorage 'genesys:forecast:v1'):
 *   { startups: [{ startupId, endUsers, totalRevenueUSD }, ...] }
 *
 * Score formula (mirrors web/src/domain/winners.ts → computeBestInvestor):
 *   score = Σ amount × (startupRevenue / 1_000_000)        — per investor
 *   when no forecast is supplied, every startup gets the DEFAULT_REVENUE of $100k,
 *   so the ranking collapses to "by total invested".
 */

import { readFile } from 'node:fs/promises';

const DEFAULT_STATE = '/opt/genesis/data/state.json';
const DEFAULT_REVENUE = 100_000;
const REVENUE_DENOMINATOR = 1_000_000;

function parseArgs(argv) {
  const out = { state: DEFAULT_STATE, forecast: null };
  for (const a of argv.slice(2)) {
    const m = a.match(/^--([a-z]+)=(.*)$/);
    if (!m) continue;
    if (m[1] === 'state') out.state = m[2];
    if (m[1] === 'forecast') out.forecast = m[2];
  }
  return out;
}

function fmtUSD(n) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M';
  if (abs >= 1_000) return '$' + Math.round(n / 1000) + 'k';
  return '$' + Math.round(n).toLocaleString('en-US');
}

function pad(s, w, right = false) {
  s = String(s);
  if (s.length >= w) return s;
  return right ? s + ' '.repeat(w - s.length) : ' '.repeat(w - s.length) + s;
}

async function loadJSON(p) {
  const raw = await readFile(p, 'utf8');
  return JSON.parse(raw);
}

async function main() {
  const args = parseArgs(process.argv);

  const state = await loadJSON(args.state).catch((e) => {
    console.error(`scoreboard: cannot read state.json at ${args.state}: ${e.message}`);
    process.exit(1);
  });
  const investments = Array.isArray(state.investments) ? state.investments : [];

  let revenueByStartup = {};
  if (args.forecast) {
    const fc = await loadJSON(args.forecast).catch((e) => {
      console.error(`scoreboard: cannot read forecast at ${args.forecast}: ${e.message}`);
      process.exit(1);
    });
    const rows = Array.isArray(fc.startups) ? fc.startups : [];
    for (const s of rows) revenueByStartup[s.startupId] = Number(s.totalRevenueUSD) || 0;
  }

  if (investments.length === 0) {
    console.log('No investments recorded yet — scoreboard is empty.');
    return;
  }

  // Group by handle.
  const portfolio = new Map();
  for (const inv of investments) {
    const handle = String(inv.investorHandle).toLowerCase();
    const slot = portfolio.get(handle) ?? { invested: 0, score: 0, picks: 0, startups: new Map() };
    slot.invested += inv.amount;
    slot.picks += 1;
    const revenue = revenueByStartup[inv.startupId] ?? DEFAULT_REVENUE;
    slot.score += inv.amount * (revenue / REVENUE_DENOMINATOR);
    slot.startups.set(inv.startupId, (slot.startups.get(inv.startupId) ?? 0) + inv.amount);
    portfolio.set(handle, slot);
  }

  const ranked = [...portfolio.entries()]
    .map(([handle, p]) => ({ handle, ...p }))
    .sort((a, b) => b.score - a.score || b.invested - a.invested);

  const hasForecast = args.forecast !== null;
  const totalInvested = investments.reduce((a, b) => a + b.amount, 0);

  console.log('');
  console.log(`Genesys investor scoreboard — ${investments.length} investments · ${fmtUSD(totalInvested)} total`);
  console.log(hasForecast
    ? `  weighted by forecast revenue from ${args.forecast}`
    : `  no forecast supplied — ranking by total invested (pass --forecast=path/to/forecast.json for weighted score)`);
  console.log('');

  console.log(`  ${pad('#', 3)}  ${pad('handle', 22, true)}  ${pad('picks', 6)}  ${pad('invested', 12)}  ${pad('score', 12)}`);
  console.log(`  ${'-'.repeat(3)}  ${'-'.repeat(22)}  ${'-'.repeat(6)}  ${'-'.repeat(12)}  ${'-'.repeat(12)}`);
  for (let i = 0; i < ranked.length; i++) {
    const r = ranked[i];
    console.log(`  ${pad(i + 1, 3)}  ${pad(r.handle, 22, true)}  ${pad(r.picks, 6)}  ${pad(fmtUSD(r.invested), 12)}  ${pad(fmtUSD(r.score), 12)}`);
  }
  console.log('');

  // Per-investor pick breakdown (helps debate the result).
  console.log('Picks per investor:');
  for (const r of ranked) {
    const picks = [...r.startups.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id, amt]) => `${id}=${fmtUSD(amt)}`)
      .join(', ');
    console.log(`  ${pad(r.handle, 22, true)}  ${picks}`);
  }
  console.log('');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
