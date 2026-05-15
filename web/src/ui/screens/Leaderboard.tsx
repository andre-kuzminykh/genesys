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

const KEY_STORAGE = 'genesys:openai-key:v1';

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

  const [forecast, setForecast] = useState<SimulationResult | null>(() => loadCached());
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<string>('');
  const [focus, setFocus] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>(() => {
    try { return localStorage.getItem(KEY_STORAGE) ?? ''; } catch { return ''; }
  });
  const [showKey, setShowKey] = useState(false);
  const [adapterErr, setAdapterErr] = useState<string | null>(null);
  const useReal = apiKey.trim().length > 0;

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
    const stages = useReal
      ? [
          'Calling OpenAI: reading each startup description…',
          'Calling OpenAI: market deep-research per segment…',
          'Calling OpenAI: simulating persona panels (impatient · technical · student · power_user · skeptical_investor)…',
          'Calling OpenAI: forecasting May 2026 → May 2027 monthly users + revenue…',
          'Aggregating reviews · choosing the cohort winner…',
        ]
      : [
          'Reading each startup description (mock LLM)…',
          'Probing hashtag-driven market trend index…',
          'Running persona panels: impatient · technical · student · power_user · skeptical_investor…',
          'Forecasting monthly users + revenue (May 2026 → May 2027)…',
          'Aggregating reviews and crowning the winner…',
        ];

    let llm: LlmPort = new MockLlmAdapter();
    if (useReal) {
      llm = new OpenAILlmAdapter({ apiKey: apiKey.trim() });
    }

    try {
      // Drive the stage messages while the LLM works in parallel.
      const ticker = (async () => {
        for (const s of stages) {
          setStage(s);
          await sleep(600);
        }
      })();
      const [result] = await Promise.all([runSimulation(startups, llm), ticker]);

      saveCached(result);
      applyUpvoteBumps(result);
      setForecast(result);
    } catch (e: any) {
      // Fall back to the mock so the user always sees a result.
      setAdapterErr(`OpenAI failed (${e?.message ?? e}). Using deterministic mock instead.`);
      const mockResult = await runSimulation(startups, new MockLlmAdapter());
      saveCached(mockResult);
      applyUpvoteBumps(mockResult);
      setForecast(mockResult);
    } finally {
      setBusy(false);
      setStage('');
    }
  }

  function saveKey(k: string) {
    setApiKey(k);
    try {
      if (k.trim()) localStorage.setItem(KEY_STORAGE, k.trim());
      else localStorage.removeItem(KEY_STORAGE);
    } catch { /* ignore */ }
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
          <Wordmark size="md" />
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/" className="ghost-button"><SparkleIcon /> Browse cohort</Link>
          <Link to="/login" className="ghost-button"><GithubIcon /> Login</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-20">
        {/* Hero */}
        <section className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Chip tone="yellow"><TrophyIcon size={12} /> demo-day · live forecast</Chip>
            <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight tracking-tight">
              Leaderboard
            </h1>
            <p className="mt-2 max-w-2xl text-textsec">
              An LLM panel reads each startup's spec, probes the market through hashtag trend signals,
              runs persona reviews, and forecasts monthly users and revenue from May 2026 to May 2027.
            </p>
          </div>
          <div className="text-right">
            <button onClick={run} disabled={busy} className="neon-button disabled:opacity-60">
              <SparkleIcon /> {busy ? 'Running…' : forecast ? 'Re-run simulation' : 'Run market simulation'}
            </button>
            <div className="mt-2 flex items-center justify-end gap-2 text-xs">
              <span className={`inline-flex h-2 w-2 rounded-full ${useReal ? 'bg-neon-500' : 'bg-textsec'}`} />
              <span className="display-mono">{useReal ? 'using OpenAI · live LLM' : 'mock LLM · deterministic'}</span>
            </div>
            {forecast && !busy ? (
              <div className="display-mono mt-1">last run · {new Date(forecast.runAt).toLocaleString()}</div>
            ) : null}
          </div>
        </section>

        {/* OpenAI key field — stored only in localStorage, never bundled */}
        <Bento className="mt-6">
          <details>
            <summary className="cursor-pointer flex items-center gap-2">
              <SparkleIcon className="text-neon-500" />
              <span className="font-display font-bold">{useReal ? 'OpenAI key attached' : 'Bring your own OpenAI key (optional — turns mock into live LLM)'}</span>
            </summary>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 rounded-2xl border border-surfaceLight bg-base px-3 py-2.5 focus-within:border-neon-500/60">
                <span className="text-textsec">sk-</span>
                <input
                  value={apiKey}
                  onChange={(e) => saveKey(e.target.value)}
                  type={showKey ? 'text' : 'password'}
                  placeholder="paste sk-… or sk-proj-… here"
                  className="flex-1 bg-transparent outline-none placeholder:text-textsec font-mono text-sm"
                  spellCheck={false}
                  autoComplete="off"
                />
                <button onClick={() => setShowKey((v) => !v)} className="text-xs text-textsec hover:text-white">
                  {showKey ? 'hide' : 'show'}
                </button>
                {apiKey ? (
                  <button onClick={() => saveKey('')} className="text-xs text-textsec hover:text-danger">
                    forget
                  </button>
                ) : null}
              </div>
              <p className="text-xs text-textsec">
                Stored only in this browser's <code className="font-mono">localStorage</code> · never committed to the repo · never sent to Genesys servers.
                Calls go directly to <code className="font-mono">api.openai.com</code> with this key.
              </p>
            </div>
          </details>
        </Bento>

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
              Mock LLM adapter: deterministic, no network. The interface is identical to a real
              OpenAI / Anthropic adapter we'll plug in once an API key is wired up.
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
            {/* Winner banner */}
            <Bento className="mt-6 glow-yellow">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <Chip tone="yellow"><TrophyIcon size={12} /> winner</Chip>
                  <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight">{forecast.winner.startupName}</h2>
                  <p className="mt-2 max-w-2xl text-sm text-textsec">{forecast.winner.reasoning}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-right">
                  <Stat label="End users" value={ranked.find((r) => r.startupId === forecast.winner.startupId)?.endUsers.toLocaleString() ?? '—'} />
                  <Stat label="Year revenue" value={fmtUSD(ranked.find((r) => r.startupId === forecast.winner.startupId)?.totalRevenueUSD ?? 0)} />
                </div>
              </div>
            </Bento>

            {/* Charts */}
            <Bento className="mt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChartIcon className="text-softblue" />
                  <div className="font-display text-lg font-bold">Users · monthly</div>
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
                />
              </div>
            </Bento>

            <Bento className="mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChartIcon className="text-neon-500" />
                  <div className="font-display text-lg font-bold">Revenue · monthly (USD)</div>
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
                />
              </div>
            </Bento>

            {/* Per-startup cards */}
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
                          <p className="mt-2 text-sm text-textsec">{f.userReview.notes}</p>
                        </div>
                        <div className="rounded-2xl border border-surfaceLight bg-base p-4">
                          <div className="display-mono">market review</div>
                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="font-display text-3xl font-extrabold text-softblue">{f.marketReview.score}</span>
                            <span className="text-xs text-textsec">/ 100</span>
                          </div>
                          <p className="mt-2 text-sm text-textsec">{f.marketReview.notes}</p>
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
                        <p className="mt-1 text-sm">{f.recommendation}</p>
                      </div>
                    </Bento>
                  </li>
                ))}
              </ul>
            </section>

            {/* Final summary */}
            <Bento className="mt-8">
              <div className="font-display text-xl font-extrabold">Cohort verdict</div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <SummaryCard tone="text-neon-500" label="users" body={forecast.userSummary} />
                <SummaryCard tone="text-softblue" label="market" body={forecast.marketSummary} />
                <SummaryCard tone="text-signal-violet" label="overall" body={forecast.overallSummary} />
              </div>
            </Bento>
          </>
        ) : null}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-surfaceLight bg-base px-3 py-2">
      <div className="display-mono">{label}</div>
      <div className="mt-0.5 font-display text-base font-extrabold">{value}</div>
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
