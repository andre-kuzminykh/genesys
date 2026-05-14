import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Chip } from '../components/Chip';
import { Avatar } from '../components/Avatar';
import {
  ArrowRightIcon,
  ChartIcon,
  CheckIcon,
  GithubIcon,
  RocketIcon,
  SparkleIcon,
  SpecIcon,
  TrophyIcon,
  XIcon,
} from '../design/Icon';
import { useStore } from '../AppStore';
import { useScores } from '../hooks';
import type { Score, Startup } from '@/domain/types';

const UPVOTE_KEY = 'genesis:upvotes:v1';

function loadUpvotes(): Record<string, number> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(UPVOTE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveUpvotes(v: Record<string, number>) {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(UPVOTE_KEY, JSON.stringify(v)); } catch { /* ignore */ }
}

// Cover gradients derived from startup name so they feel curated yet stable.
const COVERS = [
  { from: '#D5FF00', to: '#82A0FF' },
  { from: '#82A0FF', to: '#B698FF' },
  { from: '#FFB05A', to: '#5EE6A8' },
  { from: '#FF4B4B', to: '#D5FF00' },
  { from: '#5EE6A8', to: '#82A0FF' },
  { from: '#B698FF', to: '#E3FF33' },
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Landing() {
  const { state } = useStore();
  const scores = useScores();
  const published = useMemo(
    () => scores.filter((s) => s.startup.published && s.startup.batchId === state.activeBatchId),
    [scores, state.activeBatchId],
  );

  const [upvotes, setUpvotes] = useState<Record<string, number>>(() => loadUpvotes());
  const [opened, setOpened] = useState<string | null>(null);
  const [popping, setPopping] = useState<string | null>(null);

  // Seed initial upvotes from investor demand so the feed has a sense of momentum.
  const baseline = useMemo(() => {
    const m: Record<string, number> = {};
    for (const { startup, score } of published) {
      m[startup.id] = 6 + Math.round((score.investorDemand / 100) * 28); // 6..34
    }
    return m;
  }, [published]);

  const upvote = (id: string) => {
    setPopping(id);
    setUpvotes((prev) => {
      const next = { ...prev, [id]: (prev[id] ?? 0) + 1 };
      saveUpvotes(next);
      return next;
    });
    setTimeout(() => setPopping((p) => (p === id ? null : p)), 400);
  };

  const sorted = useMemo(() => {
    return [...published].sort((a, b) => {
      const av = (upvotes[a.startup.id] ?? 0) + (baseline[a.startup.id] ?? 0);
      const bv = (upvotes[b.startup.id] ?? 0) + (baseline[b.startup.id] ?? 0);
      return bv - av;
    });
  }, [published, upvotes, baseline]);

  const openedCard = sorted.find((s) => s.startup.id === opened) ?? null;

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 -z-10 grid-bg [mask-image:radial-gradient(900px_600px_at_50%_-20%,black,transparent_70%)]" />
      <div className="absolute -top-40 left-1/2 -z-10 h-[600px] w-[1200px] -translate-x-1/2 rounded-full bg-radial-neon blur-3xl opacity-90" />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-neon-500 text-base font-display text-lg font-extrabold shadow-neon">
            G
          </div>
          <div>
            <div className="font-display font-bold leading-tight">Genesis</div>
            <div className="display-mono">startup studio</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="ghost-button"><GithubIcon /> Login</Link>
          <Link to="/login" className="neon-button">
            Enter studio <ArrowRightIcon />
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-6">
        <div className="flex flex-col items-center text-center">
          <div className="chip chip-yellow-solid">
            <span className="h-1.5 w-1.5 animate-pulseGlow rounded-full bg-base" /> demo day · live feed
          </div>
          <h1 className="mt-5 max-w-3xl font-display text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
            Browse the <span className="text-neon-500">GENESIS-001</span> launches.
          </h1>
          <p className="mt-4 max-w-2xl text-textsec text-lg">
            Each card is a spec-versioned, GitHub-connected, market-simulated startup.
            Upvote the ones you want to back. Open any card to inspect its spec, architecture
            and persona feedback.
          </p>
        </div>
      </section>

      {/* Feed */}
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <div className="mb-3 flex items-center justify-between">
          <div className="display-mono">today · {sorted.length} launches</div>
          <div className="chip chip-neutral">sorted by upvotes</div>
        </div>
        <ul className="flex flex-col gap-4">
          {sorted.map(({ startup, score }, i) => {
            const cover = COVERS[hashStr(startup.id) % COVERS.length]!;
            const owner = state.users.find((u) => u.handle === startup.ownerHandle);
            const count = (upvotes[startup.id] ?? 0) + (baseline[startup.id] ?? 0);
            const popped = popping === startup.id;
            return (
              <li key={startup.id} className="bento p-5 transition hover:border-neon-500/30">
                <div className="flex items-stretch gap-5">
                  {/* rank */}
                  <div className="hidden sm:flex flex-col items-center justify-center w-8 text-textsec">
                    <span className="font-mono text-xs">#{i + 1}</span>
                  </div>

                  {/* cover */}
                  <button
                    onClick={() => setOpened(startup.id)}
                    className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-surfaceLight"
                    style={{ background: `linear-gradient(135deg, ${cover.from}, ${cover.to})` }}
                    aria-label={`Open ${startup.name}`}
                  >
                    <div className="absolute inset-0 grid place-items-center font-display text-3xl font-extrabold text-base">
                      {startup.name.slice(0, 1)}
                    </div>
                    <div className="absolute -bottom-6 -right-6 h-16 w-16 rounded-full bg-white/20 blur-2xl" />
                  </button>

                  {/* body */}
                  <button
                    onClick={() => setOpened(startup.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className="font-display text-xl font-bold truncate">{startup.name}</div>
                      <Chip tone="neutral">{startup.category}</Chip>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-textsec">{startup.pitch}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-textsec">
                      <span className="flex items-center gap-1.5">
                        <Avatar seed={owner?.handle ?? '?'} size={18} />
                        <span>{owner?.name ?? '@' + startup.ownerHandle}</span>
                      </span>
                      <span>·</span>
                      <span className="font-mono">readiness {Math.round(score.readiness)}</span>
                      <span>·</span>
                      <span className="font-mono">demand {Math.round(score.investorDemand)}</span>
                    </div>
                  </button>

                  {/* upvote */}
                  <div className="flex shrink-0 items-center">
                    <button
                      onClick={() => upvote(startup.id)}
                      className={`group flex w-16 flex-col items-center justify-center rounded-2xl border border-surfaceLight bg-base px-2 py-2 transition hover:border-neon-500/40 hover:bg-neon-500/[0.06] ${popped ? 'animate-upvotePop' : ''}`}
                      title="Upvote"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="text-textsec group-hover:text-neon-500">
                        <path d="M12 5l-7 8h4v6h6v-6h4l-7-8z" />
                      </svg>
                      <span className="mt-0.5 font-display text-base font-bold">{count}</span>
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
          {sorted.length === 0 ? (
            <li className="bento p-6 text-textsec">
              <SparkleIcon className="inline mr-2 text-neon-500" /> No launches yet.
            </li>
          ) : null}
        </ul>
      </section>

      {/* How it works (kept condensed) */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="mb-6 text-center font-display text-3xl font-extrabold">
          The startup OS for the <span className="text-neon-500">AI-native</span> economy
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              eyebrow: 'MODE-1 · PRD',
              icon: <SparkleIcon className="text-neon-500" />,
              title: 'AI Analyst interviews you',
              body: 'Turns intent into Features, Stories, Use Cases, BDD, FR/NFR — each with stable IDs.',
            },
            {
              eyebrow: 'MODE-2..5',
              icon: <SpecIcon className="text-softblue" />,
              title: 'Versioned spec, live Mermaid',
              body: 'Every change is a new version with diffs, reason, author. Architecture renders from the same model.',
            },
            {
              eyebrow: 'MODE-6',
              icon: <RocketIcon className="text-signal-violet" />,
              title: 'TDD against /genesis/spec',
              body: 'Claude Code / SuperAgent writes code against your tests. Health & coverage in one screen.',
            },
            {
              eyebrow: 'AUTH',
              icon: <GithubIcon className="text-softblue" />,
              title: 'GitHub-only entry',
              body: 'Allowlisted handles for this cohort. One trust boundary across all protected routes.',
            },
            {
              eyebrow: 'DEMO',
              icon: <TrophyIcon className="text-neon-500" />,
              title: 'Market, not popularity',
              body: 'Peers allocate Genesis Credits. AI personas score your product. Composite readiness leaderboard.',
            },
            {
              eyebrow: 'METHOD',
              icon: <ChartIcon className="text-signal-violet" />,
              title: 'CLAUDE.md as the engine',
              body: 'Modes, statuses, artifacts and transitions are first-class entities — the product runs the methodology.',
            },
          ].map((c) => (
            <div key={c.title} className="bento p-6">
              <div className="display-mono">{c.eyebrow}</div>
              <div className="mt-2 flex items-center gap-2">
                {c.icon}
                <div className="font-display text-lg font-bold">{c.title}</div>
              </div>
              <p className="mt-2 text-sm text-textsec">{c.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <Link to="/login" className="neon-button text-base">
            <GithubIcon /> Continue with GitHub
          </Link>
          <div className="display-mono">github is the only entry point · allowlist-gated</div>
        </div>
      </section>

      <footer className="border-t border-surfaceLight py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-xs text-textsec">
          <div>genesis startup studio · v0.1.0</div>
          <div className="display-mono">claude-md · single source of methodology</div>
        </div>
      </footer>

      {opened && openedCard ? (
        <CardDetailDialog
          startup={openedCard.startup}
          score={openedCard.score}
          ownerName={state.users.find((u) => u.handle === openedCard.startup.ownerHandle)?.name}
          upvotes={(upvotes[openedCard.startup.id] ?? 0) + (baseline[openedCard.startup.id] ?? 0)}
          onUpvote={() => upvote(openedCard.startup.id)}
          onClose={() => setOpened(null)}
        />
      ) : null}
    </div>
  );
}

function CardDetailDialog({
  startup,
  score,
  ownerName,
  upvotes,
  onUpvote,
  onClose,
}: {
  startup: Startup;
  score: Score;
  ownerName?: string;
  upvotes: number;
  onUpvote: () => void;
  onClose: () => void;
}) {
  const cover = COVERS[hashStr(startup.id) % COVERS.length]!;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-40 grid place-items-center bg-base/80 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bento p-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative h-44 w-full"
          style={{ background: `linear-gradient(135deg, ${cover.from}, ${cover.to})` }}
        >
          <div className="absolute inset-0 grid place-items-center font-display text-7xl font-extrabold text-base/80">
            {startup.name.slice(0, 1)}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 rounded-full bg-base/70 p-2 text-white hover:bg-base"
          >
            <XIcon size={14} />
          </button>
        </div>

        <div className="p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-2xl font-extrabold">{startup.name}</h3>
                <Chip tone="neutral">{startup.category}</Chip>
              </div>
              <p className="mt-1 text-textsec">{startup.pitch}</p>
              <div className="mt-2 flex items-center gap-2 text-sm text-textsec">
                <Avatar seed={startup.ownerHandle} size={20} />
                <span>{ownerName ?? '@' + startup.ownerHandle}</span>
                {startup.repo ? <span className="font-mono">· {startup.repo}</span> : null}
              </div>
            </div>
            <button
              onClick={onUpvote}
              className="group flex flex-col items-center justify-center rounded-2xl border border-surfaceLight bg-base px-3 py-2 hover:border-neon-500/40"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="text-textsec group-hover:text-neon-500">
                <path d="M12 5l-7 8h4v6h6v-6h4l-7-8z" />
              </svg>
              <span className="mt-0.5 font-display text-lg font-bold">{upvotes}</span>
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Spec" value={score.specCompleteness} tone="text-neon-500" />
            <Stat label="Trace" value={score.traceCoverage} tone="text-softblue" />
            <Stat label="Tests" value={score.testPassRate} tone="text-signal-green" />
            <Stat label="Persona" value={score.personaSatisfaction} tone="text-signal-violet" />
            <Stat label="Demand" value={score.investorDemand} tone="text-signal-amber" />
            <Stat label="Market" value={score.marketPotential} tone="text-softblue" />
            <Stat label="Pitch" value={score.pitchScore} tone="text-signal-amber" />
            <Stat label="Readiness" value={score.readiness} tone="text-neon-500" highlight />
          </div>

          <div className="mt-6 rounded-2xl border border-surfaceLight bg-base p-4 text-sm text-textsec">
            <div className="flex items-center gap-2 text-white"><CheckIcon className="text-neon-500" /> What's inside</div>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Spec hierarchy: Features → Stories → Use Cases → BDD → FR/NFR → Tests, with stable IDs.</li>
              <li>Live Mermaid architecture (Layered / ERD / Data Flow / Spec Graph).</li>
              <li>AI persona simulation: deterministic feedback per persona.</li>
              <li>GitHub repo plan at <code className="font-mono">/genesis/spec</code> + <code className="font-mono">/genesis/tests</code>.</li>
            </ul>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="display-mono">sign in to invest or run the full simulation</div>
            <div className="flex gap-2">
              <button onClick={onClose} className="ghost-button">Close</button>
              <Link to="/login" className="neon-button">
                <GithubIcon /> Continue with GitHub
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone, highlight = false }: { label: string; value: number; tone: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border ${highlight ? 'border-neon-500/40 bg-neon-500/[0.06]' : 'border-surfaceLight bg-base'} p-3`}>
      <div className="display-mono">{label}</div>
      <div className={`mt-1 font-display text-xl font-extrabold ${tone}`}>{Math.round(value)}</div>
    </div>
  );
}
