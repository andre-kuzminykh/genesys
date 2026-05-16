import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../AppStore';
import { Wordmark } from '../components/Wordmark';
import { Bento } from '../components/Bento';
import { Chip } from '../components/Chip';
import { LineChart, ChartLegend } from '../components/LineChart';
import { ChartIcon, GithubIcon, RocketIcon, SparkleIcon, TrophyIcon } from '../design/Icon';
import {
  MockLlmAdapter,
  runSimulation,
  type SimulationResult,
  type LlmPort,
} from '@/domain/simulation';
import { OpenAILlmAdapter } from '@/ai/openai';
import { BAKED_OPENAI_KEY, BAKED_OPENAI_MODEL, HAS_BAKED_KEY } from '@/ai/credentials';

const STORAGE_KEY = 'genesys:forecast:v1';

const PALETTE = [
  '#7FFF00', '#82A0FF', '#FFB05A', '#5EE6A8', '#B698FF',
  '#FF4B4B', '#9DFF40', '#FFD86B', '#82E5FF', '#E5C2FF',
];

function colorFor(i: number): string {
  return PALETTE[i % PALETTE.length]!;
}

function fmtUSD(v: number): string {
  if (v >= 1_000_000) return '$' + (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return '$' + Math.round(v / 1000) + 'k';
  return '$' + Math.round(v);
}

function fmtUsers(v: number): string {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return Math.round(v / 1000) + 'k';
  return String(Math.round(v));
}

function loadCached(): SimulationResult | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SimulationResult) : null;
  } catch { return null; }
}
function saveCached(s: SimulationResult) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function Leaderboard() {
  const { state } = useStore();
  const startups = useMemo(
    () => state.startups.filter((s) => s.published && s.batchId === state.activeBatchId),
    [state.startups, state.activeBatchId],
  );

  const bestInvestor = useMemo(() => {
    if (state.investments.length === 0) return null;
    const cached = (() => { try { const r = localStorage.getItem('genesys:forecast:v1'); return r ? JSON.parse(r) as SimulationResult : null; } catch { return null; }})();
    const revenueByStartup: Record<string, number> = {};
    if (cached) for (const f of cached.startups) revenueByStartup[f.startupId] = f.totalRevenueUSD;
    const portfolio: Record<string, { invested: number; score: number }> = {};
    for (const inv of state.investments) {
      if (!portfolio[inv.investorHandle]) portfolio[inv.investorHandle] = { invested: 0, score: 0 };
      portfolio[inv.investorHandle]!.invested += inv.amount;
      // weight by projected revenue of the startup
      portfolio[inv.investorHandle]!.score += inv.amount * ((revenueByStartup[inv.startupId] ?? 100_000) / 1_000_000);
    }
    const ranked = Object.entries(portfolio).map(([handle, p]) => ({ handle, ...p })).sort((a, b) => b.score - a.score);
    if (ranked.length === 0) return null;
    const top = ranked[0]!;
    const user = state.users.find((u) => u.handle === top.handle);
    return {
      handle: top.handle,
      name: user?.name ?? '@' + top.handle,
      invested: top.invested,
      score: top.score,
      picks: state.investments.filter((i) => i.investorHandle === top.handle).length,
    };
  }, [state.investments, state.users]);

  const [forecast, setForecast] = useState<SimulationResult | null>(() => loadCached());
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<string>('');
  const [focus, setFocus] = useState<string | null>(null);
  const [adapterErr, setAdapterErr] = useState<string | null>(null);
  const [revealIndex, setRevealIndex] = useState<number>(() => loadCached()?.months.length ?? 0);
  const revealing = forecast !== null && revealIndex < forecast.months.length;

  // pre-warm from a cached run
  useEffect(() => {
    if (!forecast) return;
    // make sure cached forecast still references existing startups
    const ok = forecast.startups.every((f) => startups.some((s) => s.id === f.startupId));
    if (!ok) setForecast(null);
  }, [forecast, startups]);

  async function run() {
    setBusy(true);
    setAdapterErr(null);
    setRevealIndex(0);

    const llm: LlmPort = HAS_BAKED_KEY
      ? new OpenAILlmAdapter({ apiKey: BAKED_OPENAI_KEY, model: BAKED_OPENAI_MODEL })
      : new MockLlmAdapter();

    setStage('Calling LLM: market deep research + persona reviews + 13-month forecast…');

    let result: SimulationResult;
    try {
      result = await runSimulation(startups, llm);
    } catch (e: any) {
      setAdapterErr(`LLM call failed (${e?.message ?? e}). Falling back to a deterministic forecast.`);
      result = await runSimulation(startups, new MockLlmAdapter());
    }

    saveCached(result);
    setForecast(result);

    // Month-by-month reveal — ~3 seconds per month so the user can watch
    // the curves grow and read the running narrative.
    for (let i = 1; i <= result.months.length; i++) {
      setRevealIndex(i);
      const cohortUsers = result.startups.reduce((a, f) => a + f.monthly[i - 1]!.users, 0);
      const cohortRev = result.startups.reduce((a, f) => a + f.monthly[i - 1]!.revenueUSD, 0);
      setStage(`Month ${i}/${result.months.length} · ${result.months[i - 1]} · ${cohortUsers.toLocaleString()} users · $${cohortRev.toLocaleString()} revenue`);
      await sleep(3000);
    }

    applyUpvoteBumps(result);
    setBusy(false);
    setStage('');
  }

  // map forecasts onto startups (preserve display order matching ranking)
  const ranked = useMemo(() => {
    if (!forecast) return [];
    return [...forecast.startups].sort((a, b) => b.totalRevenueUSD - a.totalRevenueUSD);
  }, [forecast]);

  const seriesUsers = useMemo(() => {
    if (!forecast) return [];
    return forecast.startups.map((f, i) => ({
      id: f.startupId,
      label: f.startupName,
      color: colorFor(i),
      points: f.monthly.map((p) => p.users),
    }));
  }, [forecast]);

  const seriesRevenue = useMemo(() => {
    if (!forecast) return [];
    return forecast.startups.map((f, i) => ({
      id: f.startupId,
      label: f.startupName,
      color: colorFor(i),
      points: f.monthly.map((p) => p.revenueUSD),
    }));
  }, [forecast]);

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-5">
        <Link to="/" aria-label="Genesys home">
          <Wordmark size="xl" />
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/" className="ghost-button"><SparkleIcon /> Browse cohort</Link>
          <Link to="/login" className="ghost-button"><GithubIcon /> Login</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-20">
        {/* Hero — no big heading; the screen content speaks for itself */}
        <section className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <p className="max-w-2xl text-textsec">
            An LLM panel reads each startup's spec, probes the market through hashtag trend signals,
            runs persona reviews, and forecasts monthly users and revenue from May 2026 to May 2027.
          </p>
          <div className="text-right">
            <button onClick={run} disabled={busy} className="neon-button disabled:opacity-60">
              <SparkleIcon /> {busy ? 'Running…' : forecast ? 'Re-run simulation' : 'Run market simulation'}
            </button>
          </div>
        </section>

        {adapterErr ? (
          <div className="mt-4 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{adapterErr}</div>
        ) : null}

        {busy ? (
          <Bento className="mt-6" tone="sky">
            <div className="flex items-center gap-3">
              <span className="inline-block h-3 w-3 rounded-full bg-neon-500 animate-pulseGlow" />
              <span className="font-display text-base">{stage}</span>
            </div>
            <p className="mt-2 text-sm text-textsec">
              {HAS_BAKED_KEY
                ? `Calling OpenAI ${BAKED_OPENAI_MODEL}: 4 prompts × ${startups.length} startups = ICP review, market deep-read, 13-month forecast, recommendation. This takes 30-60 s — sit tight.`
                : 'No OpenAI key configured at build time — falling back to deterministic mock. Set VITE_OPENAI_API_KEY in /opt/genesis/.env and rebuild to get real LLM analysis.'}
            </p>
          </Bento>
        ) : null}

        {!forecast && !busy ? (
          <Bento className="mt-6">
            <div className="flex items-center gap-2">
              <RocketIcon className="text-neon-500" />
              <div className="font-display text-lg font-bold">No forecast yet</div>
            </div>
            <p className="mt-1 text-sm text-textsec">
              Press "Run market simulation" to score the {startups.length} published startups in the
              cohort. The result will be cached so you can come back to it later.
            </p>
          </Bento>
        ) : null}

        {forecast ? (
          <>
            {/* Charts FIRST — these animate as the months reveal */}
            <Bento className="mt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChartIcon className="text-softblue" />
                  <div className="font-display text-lg font-bold">Users · monthly</div>
                  {revealing ? (
                    <span className="ml-2 chip chip-yellow-solid">
                      {revealIndex}/{forecast.months.length} · {forecast.months[Math.max(0, revealIndex - 1)]}
                    </span>
                  ) : null}
                </div>
                <ChartLegend series={seriesUsers} focusId={focus} onFocus={setFocus} />
              </div>
              <div className="mt-3">
                <LineChart
                  labels={forecast.months}
                  series={seriesUsers}
                  yLabel="users"
                  formatY={fmtUsers}
                  focusId={focus}
                  onFocus={setFocus}
                  revealUpTo={revealIndex}
                />
              </div>
            </Bento>

            <Bento className="mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChartIcon className="text-neon-500" />
                  <div className="font-display text-lg font-bold">Revenue · monthly (USD)</div>
                  {revealing ? (
                    <span className="ml-2 chip chip-yellow-solid">
                      {revealIndex}/{forecast.months.length} · {forecast.months[Math.max(0, revealIndex - 1)]}
                    </span>
                  ) : null}
                </div>
                <ChartLegend series={seriesRevenue} focusId={focus} onFocus={setFocus} />
              </div>
              <div className="mt-3">
                <LineChart
                  labels={forecast.months}
                  series={seriesRevenue}
                  yLabel="USD"
                  formatY={fmtUSD}
                  focusId={focus}
                  onFocus={setFocus}
                  revealUpTo={revealIndex}
                />
              </div>
            </Bento>

            {/* Winners — best startup + best investor — only after the full reveal */}
            {!revealing ? (
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Bento className="glow-yellow">
                  <Chip tone="yellow" icon={<TrophyIcon size={12} />}>best startup</Chip>
                  <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight">{forecast.winner.startupName}</h2>
                  <p className="mt-2 text-sm text-textsec">{forecast.winner.reasoning}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Stat label="End users" value={ranked.find((r) => r.startupId === forecast.winner.startupId)?.endUsers.toLocaleString() ?? '—'} />
                    <Stat label="Year revenue" value={fmtUSD(ranked.find((r) => r.startupId === forecast.winner.startupId)?.totalRevenueUSD ?? 0)} />
                  </div>
                </Bento>

                {bestInvestor ? (
                  <Bento className="glow-sky">
                    <Chip tone="sky" icon={<TrophyIcon size={12} />}>best investor</Chip>
                    <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight">{bestInvestor.name}</h2>
                    <p className="mt-2 text-sm text-textsec">
                      Backed {bestInvestor.picks} {bestInvestor.picks === 1 ? 'startup' : 'startups'} for a combined
                      ${bestInvestor.invested.toLocaleString()} — the highest revenue-weighted portfolio score
                      in the cohort.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Stat label="Picks" value={bestInvestor.picks} />
                      <Stat label="Invested" value={fmtUSD(bestInvestor.invested)} />
                    </div>
                  </Bento>
                ) : (
                  <Bento>
                    <Chip tone="sky" icon={<TrophyIcon size={12} />}>best investor</Chip>
                    <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight">No investors yet</h2>
                    <p className="mt-2 text-sm text-textsec">
                      Be the first — browse the cohort, open a card, hit Invest. The investor with the highest
                      revenue-weighted portfolio wins this slot.
                    </p>
                  </Bento>
                )}
              </div>
            ) : null}

            {/* Per-startup cards — only after the reveal */}
            {!revealing ? (
            <section className="mt-8">
              <div className="font-display text-2xl font-extrabold">Per-startup verdict</div>
              <p className="text-sm text-textsec">User review · market review · 12-month projection · recommendation</p>
              <ul className="mt-5 space-y-4">
                {ranked.map((f, i) => (
                  <li key={f.startupId}>
                    <Bento className="overflow-hidden">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="inline-block h-3 w-3 rounded-full" style={{ background: colorFor(forecast.startups.findIndex((x) => x.startupId === f.startupId)) }} />
                          <h3 className="font-display text-2xl font-extrabold">#{i + 1} · {f.startupName}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Stat label="End users" value={f.endUsers.toLocaleString()} />
                          <Stat label="Year rev." value={fmtUSD(f.totalRevenueUSD)} />
                          <Stat label="+upvotes" value={'+' + f.userReview.upvoteBump} />
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-surfaceLight bg-base p-4">
                          <div className="display-mono">user review · personas {f.userReview.personaIds.length}</div>
                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="font-display text-3xl font-extrabold text-neon-500">{f.userReview.score}</span>
                            <span className="text-xs text-textsec">/ 100</span>
                          </div>
                          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-textsec">{f.userReview.notes}</p>
                        </div>
                        <div className="rounded-2xl border border-surfaceLight bg-base p-4">
                          <div className="display-mono">market review</div>
                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="font-display text-3xl font-extrabold text-softblue">{f.marketReview.score}</span>
                            <span className="text-xs text-textsec">/ 100</span>
                          </div>
                          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-textsec">{f.marketReview.notes}</p>
                          {f.marketReview.trends.length ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {f.marketReview.trends.slice(0, 5).map((t) => (
                                <span key={t.label} className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${t.impact >= 0 ? 'border-signal-green/40 text-signal-green' : 'border-signal-amber/40 text-signal-amber'}`}>
                                  {t.label} {t.impact >= 0 ? '+' : ''}{Math.round(t.impact * 100)}%
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-neon-500/30 bg-neon-500/[0.06] p-4">
                        <div className="display-mono">recommendation</div>
                        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{f.recommendation}</p>
                      </div>
                    </Bento>
                  </li>
                ))}
              </ul>
            </section>
            ) : null}

            {/* Final summary — only after the reveal */}
            {!revealing ? (
              <Bento className="mt-8">
                <div className="font-display text-xl font-extrabold">Cohort verdict</div>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <SummaryCard tone="text-neon-500" label="users" body={forecast.userSummary} />
                  <SummaryCard tone="text-softblue" label="market" body={forecast.marketSummary} />
                  <SummaryCard tone="text-signal-violet" label="overall" body={forecast.overallSummary} />
                </div>
              </Bento>
            ) : null}
          </>
        ) : null}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-surfaceLight bg-surface px-4 py-3 min-w-[120px]">
      <div className="display-mono">{label}</div>
      <div className="mt-1 font-display text-xl font-extrabold leading-none">{value}</div>
    </div>
  );
}

function SummaryCard({ tone, label, body }: { tone: string; label: string; body: string }) {
  return (
    <div className="rounded-2xl border border-surfaceLight bg-base p-4">
      <div className={`display-mono ${tone}`}>{label}</div>
      <p className="mt-1 text-sm text-textsec leading-relaxed">{body}</p>
    </div>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

/** Apply userReview.upvoteBump to the public Landing's upvote map. */
function applyUpvoteBumps(forecast: SimulationResult) {
  if (typeof localStorage === 'undefined') return;
  const KEY = 'genesys:upvotes:v1';
  try {
    const raw = localStorage.getItem(KEY);
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    for (const f of forecast.startups) {
      map[f.startupId] = (map[f.startupId] ?? 0) + f.userReview.upvoteBump;
    }
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}
