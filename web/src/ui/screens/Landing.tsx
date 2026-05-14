import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '../AppStore';
import { useScores } from '../hooks';
import type { Score, Startup } from '@/domain/types';
import { ArrowRightIcon, GithubIcon, XIcon } from '../design/Icon';

const COVERS = [
  { from: '#D5FF00', to: '#82A0FF' },
  { from: '#82A0FF', to: '#B698FF' },
  { from: '#FFB05A', to: '#5EE6A8' },
  { from: '#FF4B4B', to: '#D5FF00' },
  { from: '#5EE6A8', to: '#82A0FF' },
  { from: '#B698FF', to: '#E3FF33' },
];

const UPVOTE_KEY = 'genesys:upvotes:v1';

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function loadUpvotes(): Record<string, number> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(UPVOTE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveUpvotes(v: Record<string, number>) {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(UPVOTE_KEY, JSON.stringify(v)); } catch { /* ignore */ }
}

function UpArrow({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5l-7 8h4v6h6v-6h4l-7-8z" />
    </svg>
  );
}

export function Landing() {
  const { state } = useStore();
  const scores = useScores();
  const cards = useMemo(
    () => scores.filter((s) => s.startup.published && s.startup.batchId === state.activeBatchId),
    [scores, state.activeBatchId],
  );

  const [upvotes, setUpvotes] = useState<Record<string, number>>(() => loadUpvotes());
  const [popping, setPopping] = useState<string | null>(null);

  // Seed baseline from investor demand so the order has signal even on first visit.
  const baseline = useMemo(() => {
    const m: Record<string, number> = {};
    for (const { startup, score } of cards) {
      m[startup.id] = 6 + Math.round((score.investorDemand / 100) * 28);
    }
    return m;
  }, [cards]);

  const upvoteOf = useCallback(
    (id: string) => (upvotes[id] ?? 0) + (baseline[id] ?? 0),
    [upvotes, baseline],
  );

  const sorted = useMemo(
    () => [...cards].sort((a, b) => upvoteOf(b.startup.id) - upvoteOf(a.startup.id)),
    [cards, upvoteOf],
  );

  const upvote = useCallback((id: string) => {
    setPopping(id);
    setUpvotes((prev) => {
      const next = { ...prev, [id]: (prev[id] ?? 0) + 1 };
      saveUpvotes(next);
      return next;
    });
    setTimeout(() => setPopping((p) => (p === id ? null : p)), 400);
  }, []);

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const close = useCallback(() => setOpenIndex(null), []);
  const next  = useCallback(() => setOpenIndex((i) => (i === null ? null : (i + 1) % sorted.length)), [sorted.length]);
  const prev  = useCallback(() => setOpenIndex((i) => (i === null ? null : (i - 1 + sorted.length) % sorted.length)), [sorted.length]);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openIndex, close, next, prev]);

  const open = openIndex !== null ? sorted[openIndex] : null;

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-neon-500 text-base font-display text-lg font-extrabold">
            G
          </div>
          <div className="font-display font-bold">Genesys</div>
        </div>
        <Link to="/login" className="ghost-button">
          <GithubIcon /> Login
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16">
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map(({ startup }, i) => (
            <li key={startup.id}>
              <ProductCard
                startup={startup}
                upvotes={upvoteOf(startup.id)}
                popping={popping === startup.id}
                onOpen={() => setOpenIndex(i)}
                onUpvote={() => upvote(startup.id)}
              />
            </li>
          ))}
        </ul>
      </main>

      {open ? (
        <ProductDialog
          startup={open.startup}
          score={open.score}
          ownerName={state.users.find((u) => u.handle === open.startup.ownerHandle)?.name}
          upvotes={upvoteOf(open.startup.id)}
          popping={popping === open.startup.id}
          onClose={close}
          onNext={next}
          onPrev={prev}
          onUpvote={() => upvote(open.startup.id)}
          index={openIndex! + 1}
          total={sorted.length}
        />
      ) : null}
    </div>
  );
}

function ProductCard({
  startup,
  upvotes,
  popping,
  onOpen,
  onUpvote,
}: {
  startup: Startup;
  upvotes: number;
  popping: boolean;
  onOpen: () => void;
  onUpvote: () => void;
}) {
  const cover = COVERS[hashStr(startup.id) % COVERS.length]!;
  return (
    <div className="bento group overflow-hidden p-0 transition hover:border-neon-500/40">
      <button
        onClick={onOpen}
        className="block w-full text-left"
        aria-label={`Open ${startup.name}`}
      >
        <div
          className="relative h-44 w-full"
          style={{ background: `linear-gradient(135deg, ${cover.from}, ${cover.to})` }}
        >
          <div className="absolute inset-0 grid place-items-center font-display text-6xl font-extrabold text-base/70 transition group-hover:scale-105">
            {startup.name.slice(0, 1)}
          </div>
        </div>
        <div className="p-5">
          <div className="font-display text-xl font-bold">{startup.name}</div>
          <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm text-textsec">{startup.pitch}</p>
        </div>
      </button>

      <div className="flex items-center justify-between border-t border-surfaceLight px-5 py-3">
        <button
          onClick={(e) => { e.stopPropagation(); onUpvote(); }}
          className={`group/u flex items-center gap-2 rounded-full border border-surfaceLight bg-base px-3 py-1.5 transition hover:border-neon-500/50 hover:bg-neon-500/[0.06] ${popping ? 'animate-upvotePop' : ''}`}
          aria-label="Upvote"
        >
          <UpArrow size={14} className="text-textsec group-hover/u:text-neon-500" />
          <span className="font-display text-sm font-bold">{upvotes}</span>
        </button>
        <button
          onClick={onOpen}
          className="text-textsec hover:text-white"
          aria-label={`Open ${startup.name} details`}
        >
          <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
}

function ProductDialog({
  startup,
  score,
  ownerName,
  upvotes,
  popping,
  onClose,
  onNext,
  onPrev,
  onUpvote,
  index,
  total,
}: {
  startup: Startup;
  score: Score;
  ownerName?: string;
  upvotes: number;
  popping: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onUpvote: () => void;
  index: number;
  total: number;
}) {
  const cover = COVERS[hashStr(startup.id) % COVERS.length]!;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-40 grid place-items-center bg-base/80 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        aria-label="Previous"
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-surfaceLight bg-base/80 p-3 text-white hover:border-neon-500/40 hover:text-neon-500 md:left-8"
      >
        <ArrowRightIcon className="rotate-180" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        aria-label="Next"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-surfaceLight bg-base/80 p-3 text-white hover:border-neon-500/40 hover:text-neon-500 md:right-8"
      >
        <ArrowRightIcon />
      </button>

      <div
        className="relative w-full max-w-2xl bento p-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative h-56 w-full"
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
          <div className="absolute bottom-3 left-3 font-mono text-xs text-base/80">
            {String(index).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onUpvote(); }}
            className={`absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-base/80 px-3 py-1.5 text-white hover:bg-base ${popping ? 'animate-upvotePop' : ''}`}
            aria-label="Upvote"
          >
            <UpArrow size={14} className="text-neon-500" />
            <span className="font-display text-sm font-bold">{upvotes}</span>
          </button>
        </div>

        <div className="p-7">
          <div className="font-display text-3xl font-extrabold">{startup.name}</div>
          <p className="mt-2 text-textsec">{startup.pitch}</p>
          <div className="mt-2 text-sm text-textsec">{ownerName ?? '@' + startup.ownerHandle}</div>

          <div className="mt-6 grid grid-cols-4 gap-x-6 gap-y-3">
            <FlatMetric label="Spec"      value={score.specCompleteness} tone="text-neon-500" />
            <FlatMetric label="Trace"     value={score.traceCoverage}     tone="text-softblue" />
            <FlatMetric label="Tests"     value={score.testPassRate}      tone="text-signal-green" />
            <FlatMetric label="Readiness" value={score.readiness}         tone="text-neon-500" />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="display-mono">←/→ to browse · esc to close</div>
            <Link to="/login" className="neon-button">
              <GithubIcon /> Continue with GitHub
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlatMetric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div>
      <div className="display-mono">{label}</div>
      <div className={`mt-0.5 font-display text-2xl font-extrabold ${tone}`}>{Math.round(value)}</div>
    </div>
  );
}
