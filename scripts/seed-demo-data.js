#!/usr/bin/env node
/**
 * Demo data seeder — fills state.json + forecast.json with a plausible
 * play-through so screenshots show live numbers instead of zeros.
 *
 *   node scripts/seed-demo-data.js                 # writes ./data/*.json
 *   node scripts/seed-demo-data.js --out-dir=/opt/genesis/data
 *   node scripts/seed-demo-data.js --seed=picnic   # different-but-stable numbers
 *   node scripts/seed-demo-data.js --demote=S-p2pedit,S-arb   # push these down the board
 *
 * Output is deterministic for a given --seed, so re-running reproduces the
 * exact same board. Respects the same invariants the live API enforces:
 *   - one upvote per handle per startup
 *   - a handle never invests in a startup it owns (admin excepted)
 *   - each investor's total stays within CREDITS_PER_INVESTOR
 */

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const CREDITS_PER_INVESTOR = 100_000;
const MONTH_COUNT = 13;
const SIM_START = new Date(2026, 4, 1); // May 2026

const ADMINS = new Set(['andre-kuzminykh']);

const STARTUPS = [
  { id: 'S-artrise',      name: 'ArtRise',            owner: 'artem-grigorash', theme: 'AI art marketplace for emerging illustrators' },
  { id: 'S-shelfly',      name: 'Shelfly',            owner: 'artem3605',       theme: 'shelf-scanning inventory assistant for small retail' },
  { id: 'S-ailab',        name: 'AI Lab HW',          owner: 'darkmechanikum',  theme: 'homework grading copilot for CS instructors' },
  { id: 'S-bte',          name: 'Beat the Engine',    owner: 'denksworkspace',  theme: 'chess training that drills your own blunder patterns' },
  { id: 'S-albion',       name: 'Albion Advisor',     owner: 'hspyroblast',     theme: 'in-game market advisor for Albion Online traders' },
  { id: 'S-calenmind',    name: 'CalenMind',          owner: 'kamaliyaal',      theme: 'calendar that reschedules around your energy curve' },
  { id: 'S-invalerts',    name: 'InvestmentsAlert',   owner: 'kreativshikkk',   theme: 'retail-investor alerting on filings and insider moves' },
  { id: 'S-stylify',      name: 'Stylify',            owner: 'mashan555',       theme: 'wardrobe stylist that shops your existing closet' },
  { id: 'S-clutchup',     name: 'Clutch Up',          owner: 'maxlevitsky',     theme: 'esports VOD review that finds your losing habits' },
  { id: 'S-arb',          name: 'Arbitrage Bot',      owner: 'mitya139',        theme: 'cross-exchange arbitrage execution for small desks' },
  { id: 'S-creators',     name: 'Creators Platform',  owner: 'petrenkosofya',   theme: 'brand-deal pipeline manager for mid-tier creators' },
  { id: 'S-ztbrowser',    name: 'ZT Browser',         owner: 'rusyaew',         theme: 'zero-trust browser for contractor laptops' },
  { id: 'S-tglearn',      name: 'TG Learn',           owner: 'somethingnew179', theme: 'spaced-repetition language tutor inside Telegram' },
  { id: 'S-p2pedit',      name: 'P2PEdit',            owner: 'weethet',         theme: 'peer-to-peer collaborative editor with no server' },
  { id: 'S-tonloans',     name: 'TON NFT Loans',      owner: 'andre-kuzminykh', theme: 'NFT-collateralised lending on TON' },
  { id: 'S-fridgefriend', name: 'FridgeFriend',       owner: 'andre-kuzminykh', theme: 'photograph your fridge, get tonight’s dinner plan' },
];

const COHORT = [
  'andre-kuzminykh', 'artem-grigorash', 'artem3605', 'darkmechanikum',
  'denksworkspace', 'hspyroblast', 'kamaliyaal', 'kreativshikkk',
  'mashan555', 'maxlevitsky', 'mitya139', 'petrenkosofya', 'rusyaew',
  'somethingnew179', 'weethet', 'andreykuzminykh-hub', 'andre-dataistos',
  'ruguosob', 'tm-a-t', 'imartemy1524', 'yuumiya', 'vobolgus', 'ldpix',
];

const PERSONAS = ['impatient', 'technical', 'student', 'power_user', 'skeptical_investor'];

const PERSONA_LABEL = {
  impatient:          'Mia, impatient PM',
  technical:          'Dev, staff engineer',
  student:            'Kostya, CS student',
  power_user:         'Rae, keyboard-first power user',
  skeptical_investor: 'Nadia, seed investor',
};

const PERSONA_QUOTE = {
  impatient: [
    'Got to something useful in under a minute. That is rare and I noticed.',
    'Three screens before I saw any value. I would have closed this at home.',
    'Fast enough that I stopped noticing the product, which is the point.',
  ],
  technical: [
    'The API surface is small and honest. No magic I would have to unlearn.',
    'State lives in too many places. I would fight this during an incident.',
    'Self-host story is credible. That alone moves it onto my shortlist.',
  ],
  student: [
    'Free tier actually covers a semester. That decides it for me.',
    'Pricing jumps right where a student stops being able to pay.',
    'I learned the domain by using it, which beats reading docs.',
  ],
  power_user: [
    'Keyboard coverage is most of the way there. Give me a command palette.',
    'I want to compose these steps into a workflow, not click them each time.',
    'Defaults are sane and everything I wanted to change was changeable.',
  ],
  skeptical_investor: [
    'Retention story is still anecdotal. Show me week-four cohorts.',
    'Real pull in a narrow segment. That is worth more than broad curiosity.',
    'Nice demo, unclear wedge. I would want a second look in a quarter.',
  ],
};

const TREND_POOL = [
  { label: 'ai-agents tailwind',        impact:  0.30 },
  { label: 'segment budget tightening', impact: -0.18 },
  { label: 'incumbent bundling risk',   impact: -0.25 },
  { label: 'inference cost drop',       impact:  0.22 },
  { label: 'creator-economy rebound',   impact:  0.16 },
  { label: 'compliance headwind',       impact: -0.20 },
  { label: 'mobile-first shift',        impact:  0.14 },
  { label: 'organic search decay',      impact: -0.12 },
];

const EVENT_TEMPLATES = [
  'Launched on a niche community board; {u} signups in the first week, mostly word of mouth.',
  'Onboarding rewrite cut the first-value path in half and week-two retention moved with it.',
  'A mid-size customer churned after a pricing change; the team walked the increase back.',
  'Press mention in a segment newsletter drove a spike that mostly failed to convert.',
  'Shipped the most-requested integration; activation among power users climbed noticeably.',
  'Infra incident took the product down for six hours and refunds followed.',
  'Switched to usage-based pricing; revenue per account rose while signups flattened.',
  'Competitor bundled a similar feature for free, compressing the top of the funnel.',
  'Partnership with a community operator opened a steady low-cost acquisition channel.',
  'Hired the first support person; resolution time dropped and expansion revenue followed.',
  'Seasonal lull across the segment; the team used it to pay down product debt.',
  'Annual plans introduced; a third of active accounts prepaid within the month.',
  'Closed the year at {u} active users and a renewal rate the team could finally quote.',
];

const RECOMMENDATION_TEMPLATES = [
  'Next 30 days: instrument the first-run path and find where the {pct}% who never return drop off. Next 60: pick one acquisition channel and make it repeatable before adding a second. Next 90: put a real number on week-four retention so the wedge stops being a story and starts being evidence.',
  'Next 30 days: stop broadening. The segment that already pulls is small enough to serve by hand. Next 60: raise price on the tier that converts and watch whether anyone leaves. Next 90: build the one integration that keeps accounts from lapsing.',
  'Next 30 days: the product is ahead of the distribution. Ship nothing new and spend the month on channel. Next 60: move the free tier boundary to where value is obvious but incomplete. Next 90: get to {users} weekly actives or narrow the target until you can.',
];

// ---------- deterministic PRNG ----------

function hashSeed(s) {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const between = (rng, lo, hi) => lo + rng() * (hi - lo);
const intBetween = (rng, lo, hi) => Math.floor(between(rng, lo, hi + 1));

function shuffled(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Share of its normal traction a demoted startup keeps. */
const DEMOTE_RETENTION = 0.45;

/**
 * Shuffle the candidate list, dropping demoted startups from most members'
 * consideration. They keep roughly DEMOTE_RETENTION of their normal pull, so
 * they settle near the bottom of the board with real-but-small numbers rather
 * than a flat zero that reads as a bug on a screenshot.
 */
function shuffledWithDemotions(rng, startups, demoted) {
  if (demoted.size === 0) return shuffled(rng, startups);
  const kept = startups.filter((s) => !demoted.has(s.id) || rng() < DEMOTE_RETENTION);
  return shuffled(rng, kept);
}

// ---------- generators ----------

function months() {
  const out = [];
  for (let i = 0; i < MONTH_COUNT; i++) {
    const d = new Date(SIM_START.getFullYear(), SIM_START.getMonth() + i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

function buildUpvotes(rng, demoted) {
  const upvotes = {};
  for (const s of STARTUPS) upvotes[s.id] = [];

  for (const handle of COHORT) {
    // Every member backs 4-9 projects, never their own.
    const candidates = STARTUPS.filter((s) => s.owner !== handle);
    const howMany = intBetween(rng, 4, 9);
    for (const s of shuffledWithDemotions(rng, candidates, demoted).slice(0, howMany)) {
      upvotes[s.id].push(handle);
    }
  }
  return upvotes;
}

function buildInvestments(rng, startTs, demoted) {
  const investments = [];
  const spent = Object.fromEntries(COHORT.map((h) => [h, 0]));
  // Most of the cohort invests; a few sit it out, which reads as realistic.
  const active = shuffled(rng, COHORT).slice(0, COHORT.length - 4);

  for (const handle of active) {
    const isAdmin = ADMINS.has(handle);
    const candidates = STARTUPS.filter((s) => isAdmin || s.owner !== handle);
    const picks = shuffledWithDemotions(rng, candidates, demoted).slice(0, intBetween(rng, 2, 5));
    // Deploy 35-95% of the wallet across the picks.
    let budget = Math.floor(CREDITS_PER_INVESTOR * between(rng, 0.35, 0.95));

    for (let i = 0; i < picks.length; i++) {
      const last = i === picks.length - 1;
      const remainingPicks = picks.length - i;
      let amount = last
        ? budget
        : Math.floor((budget / remainingPicks) * between(rng, 0.5, 1.5));
      amount = Math.max(500, Math.round(amount / 500) * 500);
      if (spent[handle] + amount > CREDITS_PER_INVESTOR) {
        amount = CREDITS_PER_INVESTOR - spent[handle];
        amount = Math.floor(amount / 500) * 500;
      }
      if (amount < 500) break;

      spent[handle] += amount;
      budget -= amount;
      investments.push({
        startupId: picks[i].id,
        investorHandle: handle,
        amount,
        ts: startTs + intBetween(rng, 0, 9 * 86400000),
      });
      if (budget < 500) break;
    }
  }

  // Nobody should show a flat $0 raised — on a screenshot that reads as a
  // broken row rather than an unpopular startup. Top every empty startup up
  // with one modest cheque from whoever still has headroom.
  for (const s of STARTUPS) {
    if (investments.some((i) => i.startupId === s.id)) continue;
    const eligible = shuffled(rng, COHORT).filter(
      (h) => (ADMINS.has(h) || s.owner !== h) && CREDITS_PER_INVESTOR - spent[h] >= 2000,
    );
    if (eligible.length === 0) continue;
    const handle = eligible[0];
    const headroom = CREDITS_PER_INVESTOR - spent[handle];
    const amount = Math.min(
      Math.max(2000, Math.round(between(rng, 2000, 12000) / 500) * 500),
      Math.floor(headroom / 500) * 500,
    );
    spent[handle] += amount;
    investments.push({
      startupId: s.id,
      investorHandle: handle,
      amount,
      ts: startTs + intBetween(rng, 0, 9 * 86400000),
    });
  }

  investments.sort((a, b) => a.ts - b.ts);
  return investments;
}

function buildForecast(rng, ms, upvotes) {
  const forecasts = STARTUPS.map((s) => {
    const userScore = intBetween(rng, 38, 92);
    const marketScore = intBetween(rng, 32, 90);

    // Growth curve: an S-shape whose steepness tracks the two scores.
    const seed0 = intBetween(rng, 120, 900);
    const ceiling = Math.round(seed0 * between(rng, 30, 420) * ((userScore + marketScore) / 120));
    const steep = between(rng, 0.42, 0.78);
    const arpu = between(rng, 0.6, 7.5);

    const monthly = ms.map((month, i) => {
      const t = i / (MONTH_COUNT - 1);
      const logistic = 1 / (1 + Math.exp(-((t - 0.55) / steep) * 6));
      const wobble = between(rng, 0.93, 1.07);
      const users = Math.max(seed0, Math.round(ceiling * logistic * wobble));
      const revenueUSD = Math.round(users * arpu * between(rng, 0.85, 1.15));
      return { month, users, revenueUSD };
    });

    const endUsers = monthly[monthly.length - 1].users;
    const totalRevenueUSD = monthly.reduce((a, p) => a + p.revenueUSD, 0);

    const perPersona = PERSONAS.map((id) => {
      const score = Math.max(5, Math.min(98, Math.round(userScore + between(rng, -22, 22))));
      const bucket = score >= 70 ? 0 : score >= 45 ? 2 : 1;
      return { id, label: PERSONA_LABEL[id], score, quote: PERSONA_QUOTE[id][bucket] };
    });

    const events = ms.map((month, i) => {
      const tpl = i === 0
        ? EVENT_TEMPLATES[0]
        : i === MONTH_COUNT - 1
          ? EVENT_TEMPLATES[EVENT_TEMPLATES.length - 1]
          : pick(rng, EVENT_TEMPLATES.slice(1, -1));
      return {
        month,
        event: tpl
          .replace('{u}', monthly[i].users.toLocaleString('en-US'))
          .replace('{users}', endUsers.toLocaleString('en-US')),
      };
    });

    const trends = shuffled(rng, TREND_POOL).slice(0, intBetween(rng, 2, 3));

    return {
      startupId: s.id,
      startupName: s.name,
      monthly,
      endUsers,
      totalRevenueUSD,
      userReview: {
        personaIds: PERSONAS,
        score: userScore,
        notes: `Panel of five ran ${s.name} end to end. The pull is real inside a narrow slice — ${s.theme} — and thin outside it. Friction concentrates in the first session; everyone who got past it stayed engaged through the task.`,
        upvoteBump: Math.max(0, Math.round((userScore - 45) / 9)),
        perPersona,
      },
      marketReview: {
        score: marketScore,
        notes: `Segment is active but not empty. Adjacent tools already train the behaviour, so the question is wedge depth rather than category education. Pricing power looks modest until retention is provable.`,
        trends,
      },
      recommendation: pick(rng, RECOMMENDATION_TEMPLATES)
        .replace('{pct}', String(intBetween(rng, 55, 80)))
        .replace('{users}', endUsers.toLocaleString('en-US')),
      events,
    };
  });

  // Winner: revenue weighted by the two review scores and live upvote pull.
  const scored = forecasts.map((f) => {
    const votes = (upvotes[f.startupId] ?? []).length;
    const composite =
      (f.totalRevenueUSD / 1000) * 0.55 +
      f.userReview.score * 40 +
      f.marketReview.score * 30 +
      votes * 120;
    return { f, composite };
  }).sort((a, b) => b.composite - a.composite);

  const top = scored[0].f;
  const runnerUp = scored[1].f;

  return {
    runAt: Date.now(),
    months: ms,
    startups: forecasts,
    winner: {
      startupId: top.startupId,
      startupName: top.startupName,
      reasoning: `${top.startupName} ends the year at ${top.endUsers.toLocaleString('en-US')} users and $${Math.round(top.totalRevenueUSD).toLocaleString('en-US')} cumulative revenue, with a user panel at ${top.userReview.score}/100 and market read at ${top.marketReview.score}/100. It wins less on raw growth than on the combination — the segment pulls, the panel stayed engaged past first session, and the cohort put real credits behind it. ${runnerUp.startupName} is the closest challenger and beats it on curve steepness, but its market read is softer and the retention evidence is thinner.`,
    },
    userSummary: `Across ${STARTUPS.length} products the panel split hard on first-run experience. The five highest user scores all got a persona to value inside one minute; the five lowest all asked for account setup before showing anything. Persona-level variance was widest for the skeptical investor, who rewarded narrow evidence and punished broad claims.`,
    marketSummary: `Two forces dominate the cohort: falling inference cost lifts every product with an AI step in the loop, and incumbent bundling compresses the ones whose wedge is a single feature. Products anchored to a community or a workflow held their curve through the mid-year lull; products anchored to a novelty did not.`,
    overallSummary: `Thirteen months in, the spread is wide: the top quartile compounds while the bottom quartile plateaus by month seven. The dividing line is not model quality — it is whether the team found one repeatable acquisition channel before trying to widen the product. ${top.startupName} takes the cohort on the combination of segment pull, panel retention and investor conviction.`,
  };
}

// ---------- main ----------

function parseArgs(argv) {
  const out = { outDir: './data', seed: 'genesys-demo-001', state: null, forecast: null, demote: [] };
  for (const a of argv.slice(2)) {
    const m = a.match(/^--([a-z-]+)=(.*)$/);
    if (!m) continue;
    if (m[1] === 'out-dir') out.outDir = m[2];
    if (m[1] === 'seed') out.seed = m[2];
    if (m[1] === 'state') out.state = m[2];
    if (m[1] === 'forecast') out.forecast = m[2];
    if (m[1] === 'demote') out.demote = m[2].split(',').map((x) => x.trim()).filter(Boolean);
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);
  const rng = mulberry32(hashSeed(args.seed));

  const statePath = args.state ?? path.join(args.outDir, 'state.json');
  const forecastPath = args.forecast ?? path.join(args.outDir, 'forecast.json');

  const demoted = new Set(args.demote);
  for (const id of demoted) {
    if (!STARTUPS.some((s) => s.id === id)) {
      console.error(`seed-demo-data: unknown startup id in --demote: ${id}`);
      process.exit(1);
    }
  }

  const ms = months();
  const upvotes = buildUpvotes(rng, demoted);
  const investments = buildInvestments(rng, Date.now() - 12 * 86400000, demoted);
  const forecast = buildForecast(rng, ms, upvotes);

  await mkdir(path.dirname(statePath), { recursive: true });
  await mkdir(path.dirname(forecastPath), { recursive: true });
  await writeFile(statePath, JSON.stringify({ upvotes, investments }), 'utf8');
  await writeFile(forecastPath, JSON.stringify(forecast), 'utf8');

  const totalVotes = Object.values(upvotes).reduce((a, l) => a + l.length, 0);
  const totalMoney = investments.reduce((a, i) => a + i.amount, 0);
  const investors = new Set(investments.map((i) => i.investorHandle)).size;

  console.log('');
  console.log(`seed             ${args.seed}`);
  console.log(`demoted          ${demoted.size ? [...demoted].join(', ') : '(none)'}`);
  console.log(`state.json       ${statePath}`);
  console.log(`forecast.json    ${forecastPath}`);
  console.log('');
  console.log(`upvotes          ${totalVotes} across ${STARTUPS.length} startups`);
  console.log(`investments      ${investments.length} from ${investors} investors, $${totalMoney.toLocaleString('en-US')} deployed`);
  console.log(`forecast winner  ${forecast.winner.startupName} (${forecast.winner.startupId})`);
  console.log('');

  const board = [...STARTUPS]
    .map((s) => ({
      name: s.name,
      votes: upvotes[s.id].length,
      money: investments.filter((i) => i.startupId === s.id).reduce((a, b) => a + b.amount, 0),
    }))
    .sort((a, b) => b.votes - a.votes || b.money - a.money);

  console.log('  votes  raised     startup');
  console.log('  -----  ---------  --------------------');
  for (const r of board) {
    console.log(`  ${String(r.votes).padStart(5)}  ${('$' + r.money.toLocaleString('en-US')).padStart(9)}  ${r.name}`);
  }
  console.log('');
}

main().catch((e) => { console.error(e); process.exit(1); });
