import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../AppStore';
import { Wordmark } from '../components/Wordmark';
import { Bento } from '../components/Bento';
import { Chip } from '../components/Chip';
import { Footer } from '../components/Footer';
import { CookieBanner } from '../components/CookieBanner';
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
  const [currentLine, setCurrentLine] = useState<string>('');
  // Queue + drainer: lines arrive one-at-a-time at a steady rate so the
  // single-line ticker is readable even when 16 events fire in a burst.
  const queueRef = useRef<string[]>([]);
  const drainTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drainIntervalRef = useRef<number>(800);
  const pumpQueue = useCallback(() => {
    if (drainTimerRef.current) return;
    const tick = () => {
      const next = queueRef.current.shift();
      if (next === undefined) { drainTimerRef.current = null; return; }
      setCurrentLine(next);
      drainTimerRef.current = setTimeout(tick, drainIntervalRef.current);
    };
    drainTimerRef.current = setTimeout(tick, 0);
  }, []);
  const logActivity = useCallback((line: string) => {
    queueRef.current.push(line);
    pumpQueue();
  }, [pumpQueue]);
  const setDrainSpeed = useCallback((ms: number) => { drainIntervalRef.current = ms; }, []);
  const drainNow = useCallback(async () => {
    while (queueRef.current.length > 0 || drainTimerRef.current) {
      await new Promise<void>((r) => setTimeout(r, 50));
    }
  }, []);
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
    queueRef.current = [];
    setCurrentLine('');

    const llm: LlmPort = HAS_BAKED_KEY
      ? new OpenAILlmAdapter({ apiKey: BAKED_OPENAI_KEY, model: BAKED_OPENAI_MODEL })
      : new MockLlmAdapter();

    setStage('analysing 16 cohort startups…');
    setDrainSpeed(450);

    // Compact analysis feed: ONE narrative line per startup (no per-phase
    // chatter). The interesting stuff lands during the monthly reveal.
    let analysed = 0;
    const onEvent = (e: import('@/domain/simulation').SimulationEvent) => {
      if (e.kind === 'startup-done') {
        analysed += 1;
        logActivity(`🤖 (${analysed}/${startups.length}) ${e.startupName} analysed — ${e.endUsers.toLocaleString()} users, $${e.totalRevenueUSD.toLocaleString()}/yr forecast`);
      }
    };

    let result: SimulationResult;
    try {
      result = await runSimulation(startups, llm, onEvent);
    } catch (e: any) {
      setAdapterErr(`LLM call failed (${e?.message ?? e}). Falling back to a deterministic forecast.`);
      logActivity(`❌ LLM call failed: ${e?.message ?? e}. Falling back to deterministic mock.`);
      result = await runSimulation(startups, new MockLlmAdapter(), onEvent);
    }

    saveCached(result);
    setForecast(result);
    await drainNow();
    logActivity(`✨ All ${startups.length} startups analysed. Rolling the month-by-month tape now…`);
    await drainNow();

    // Month-by-month reveal — for each month: stream one news line per
    // startup at a steady cadence (events FIRST), THEN advance the chart,
    // then a short breath before the next month. Reads like a news ticker
    // walking through the year.
    const PER_EVENT_MS = 900;
    const MONTH_BREATHER_MS = 500;
    const monthLabel = (ym: string) => {
      const [y, m] = ym.split('-').map(Number);
      const d = new Date(y!, m! - 1, 1);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    setDrainSpeed(PER_EVENT_MS);

    for (let i = 1; i <= result.months.length; i++) {
      const ym = result.months[i - 1]!;
      setStage(`📅 ${monthLabel(ym)} · month ${i}/${result.months.length}`);

      for (const f of result.startups) {
        const cur = f.monthly[i - 1]!;
        const prev = i > 1 ? f.monthly[i - 2]! : { users: 0, revenueUSD: 0 } as { users: number; revenueUSD: number };
        const du = cur.users - prev.users;
        const ev = f.events?.find((x) => x.month === ym);
        const head =
          i === 1 ? '🚀' :
          (du < 0) ? '📉' :
          (prev.users < 100 && cur.users >= 100)   ? '⭐' :
          (prev.users < 500 && cur.users >= 500)   ? '🌟' :
          (prev.users < 1000 && cur.users >= 1000) ? '🌠' :
          (prev.users > 0 && du / prev.users > 0.3) ? '📈' :
          '📰';
        const date = monthLabel(ym);
        const text = ev?.event ?? `${f.startupName}: ${cur.users.toLocaleString()} users, $${cur.revenueUSD.toLocaleString()} this month.`;
        logActivity(`${head} ${date} · ${text}`);
      }

      // Wait for the dripper to finish emitting THIS month's events before
      // the chart steps forward, then breathe a moment.
      await drainNow();
      setRevealIndex(i);
      await sleep(MONTH_BREATHER_MS);
    }

    applyUpvoteBumps(result);
    logActivity(`🏆 Final tape: ${result.winner.startupName} wins on combined signal.`);
    await drainNow();
    await sleep(2500);
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
          <Link to="/" className="ghost-button"><span aria-hidden>←</span> Back</Link>
          <Link to="/login" className="ghost-button"><GithubIcon /> Login</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-20">
        {/* Single-line news ticker on the left of the row, run/running CTA on
            the right. Same width as everything else on the page. */}
        <section className="mt-6">
          <div className="flex items-stretch gap-3">
            <div className="flex-1 min-w-0 rounded-2xl border border-surfaceLight bg-surface px-4 py-3">
              <div
                key={currentLine}
                className="flex items-center gap-2 font-mono text-sm text-textsec animate-tickerFade"
              >
                {busy ? (
                  <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-neon-500 animate-pulseGlow" />
                ) : null}
                <span className="truncate">
                  {currentLine ||
                    (busy ? 'spinning up the panel…'
                          : forecast ? 'last run complete — hit Re-run to refresh'
                                     : 'idle — hit Run to start the cohort simulation')}
                </span>
              </div>
            </div>
            <button
              onClick={run}
              disabled={busy}
              className="neon-button shrink-0 disabled:opacity-60"
            >
              <SparkleIcon /> {busy ? 'Running…' : forecast ? 'Re-run simulation' : 'Run market simulation'}
            </button>
          </div>
          {stage ? (
            <div className="mt-2 px-1 font-mono text-[11px] uppercase tracking-wider text-textsec">{stage}</div>
          ) : null}
        </section>

        {adapterErr ? (
          <div className="mt-4 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{adapterErr}</div>
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
              <div className="flex items-center gap-3">
                <ChartIcon size={28} className="text-softblue" />
                <div className="font-display text-2xl font-extrabold">Users · monthly</div>
                {revealing ? (
                  <span className="ml-2 chip chip-yellow-solid">
                    {revealIndex}/{forecast.months.length} · {forecast.months[Math.max(0, revealIndex - 1)]}
                  </span>
                ) : null}
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
              <ChartLegend series={seriesUsers} focusId={focus} onFocus={setFocus} />
            </Bento>

            <Bento className="mt-4">
              <div className="flex items-center gap-3">
                <ChartIcon size={28} className="text-neon-500" />
                <div className="font-display text-2xl font-extrabold">Revenue · monthly (USD)</div>
                {revealing ? (
                  <span className="ml-2 chip chip-yellow-solid">
                    {revealIndex}/{forecast.months.length} · {forecast.months[Math.max(0, revealIndex - 1)]}
                  </span>
                ) : null}
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
              <ChartLegend series={seriesRevenue} focusId={focus} onFocus={setFocus} />
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
                        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
                          <span className="display-mono">End users</span>
                          <span className="font-display text-lg font-extrabold">{f.endUsers.toLocaleString()}</span>
                          <span className="text-textsec">·</span>
                          <span className="display-mono">Year rev.</span>
                          <span className="font-display text-lg font-extrabold">{fmtUSD(f.totalRevenueUSD)}</span>
                          <span className="text-textsec">·</span>
                          <span className="display-mono">+upvotes</span>
                          <span className="font-display text-lg font-extrabold text-signal-green">+{f.userReview.upvoteBump}</span>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-surfaceLight bg-base p-4">
                          <div className="display-mono">user review · personas {f.userReview.personaIds.length}</div>
                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="font-display text-3xl font-extrabold text-neon-500">{f.userReview.score}</span>
                            <span className="text-xs text-textsec">/ 100</span>
                          </div>
                          {f.userReview.perPersona && f.userReview.perPersona.length > 0 ? (
                            <PersonaPanel verdicts={f.userReview.perPersona} />
                          ) : null}
                          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-textsec">{f.userReview.notes}</p>
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
      <Footer />
      <CookieBanner />
    </div>
  );
}

function ActivityLog({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);
  return (
    <div
      ref={ref}
      className="mt-3 max-h-72 overflow-y-auto rounded-2xl border border-surfaceLight bg-base/60 p-3 font-mono text-xs text-textsec"
    >
      {lines.map((line, i) => {
        // Lightweight news-ticker coloring keyed on the leading emoji.
        const head = line.trimStart().slice(0, 2);
        const cls =
          head === '🏆' || head === '🏁' || head === '✨' || head === '⭐' || head === '🌟' || head === '🌠' || head === '🚀' || head === '📈' ? 'text-signal-green' :
          head === '❌' || head === '📉' ? 'text-danger' :
          head === '📅' ? 'text-neon-500' :
          head === '🔍' || head === '🎯' || head === '🧭' || head === '📝' ? 'text-softblue' :
          'text-textsec';
        return (
          <div key={i} className={`whitespace-pre-wrap leading-relaxed ${cls}`}>
            {line}
          </div>
        );
      })}
    </div>
  );
}

function PersonaPanel({ verdicts }: { verdicts: Array<{ id: string; label: string; score: number; quote: string }> }) {
  // Two-tone silhouette: deterministic gender based on persona-id hash so the
  // same persona always renders with the same avatar across runs.
  const isFemale = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h) % 2 === 1;
  };
  return (
    <ul className="mt-3 space-y-2.5">
      {verdicts.map((v) => (
        <li key={v.id + v.label} className="flex items-start gap-3">
          <span
            aria-hidden
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-surfaceLight bg-surface text-textsec"
          >
            <SilhouetteIcon female={isFemale(v.id + v.label)} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-sm font-extrabold">{v.label}</span>
              <span className="font-mono text-[10px] text-textsec">{v.score}/100</span>
            </div>
            <div className="mt-0.5 text-sm leading-snug text-textsec">"{v.quote}"</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SilhouetteIcon({ female }: { female: boolean }) {
  // Generic faceless head+shoulders silhouette. The `female` flag swaps in
  // longer hair contour — purely decorative, no facial features.
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      {female ? (
        // round head + shoulder-length hair contour + torso
        <path d="M12 2c2.5 0 4.5 2 4.5 4.5v.7c1 .6 1.7 1.7 1.7 3v.6c0 1.2-.7 2.3-1.7 2.9V14c0 1.6 1 3 2.5 3.6V19c0 1.7-3.4 3-7 3s-7-1.3-7-3v-1.4C6.5 17 7.5 15.6 7.5 14v-.3c-1-.6-1.7-1.7-1.7-2.9v-.6c0-1.3.7-2.4 1.7-3v-.7C7.5 4 9.5 2 12 2z" />
      ) : (
        // round head + tight torso silhouette
        <path d="M12 2.5a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0v-1a4 4 0 0 1 4-4zm-7 18c0-3.5 3.1-5.5 7-5.5s7 2 7 5.5V22H5z" />
      )}
    </svg>
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
