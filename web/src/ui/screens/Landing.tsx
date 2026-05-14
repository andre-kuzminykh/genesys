import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../AppStore';
import { useScores } from '../hooks';
import type { Score, Startup } from '@/domain/types';
import { ArrowRightIcon, GithubIcon, SparkleIcon, XIcon } from '../design/Icon';

// ---------- shared helpers ----------

const COVERS = [
  { from: '#D5FF00', to: '#82A0FF' },
  { from: '#82A0FF', to: '#B698FF' },
  { from: '#FFB05A', to: '#5EE6A8' },
  { from: '#FF4B4B', to: '#D5FF00' },
  { from: '#5EE6A8', to: '#82A0FF' },
  { from: '#B698FF', to: '#E3FF33' },
  { from: '#E3FF33', to: '#FFB05A' },
  { from: '#82A0FF', to: '#5EE6A8' },
];

const UPVOTE_KEY = 'genesys:upvotes:v1';

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function coverFor(id: string) {
  return COVERS[hashStr(id) % COVERS.length]!;
}

function loadUpvotes(): Record<string, number> {
  if (typeof localStorage === 'undefined') return {};
  try { const raw = localStorage.getItem(UPVOTE_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
function saveUpvotes(v: Record<string, number>) {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(UPVOTE_KEY, JSON.stringify(v)); } catch { /* ignore */ }
}

function UpArrow({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5l-7 8h4v6h6v-6h4l-7-8z" />
    </svg>
  );
}

// Stylized "screenshot" mocks rendered as SVG on the startup's gradient.
// Variants give the feeling of different product surfaces (dashboard, editor, …)
function ScreenshotMock({ from, to, variant }: { from: string; to: string; variant: 0 | 1 | 2 | 3 }) {
  const w = '#FFFFFF';
  return (
    <div
      className="aspect-[3/4] w-56 shrink-0 overflow-hidden rounded-2xl border border-surfaceLight"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <svg viewBox="0 0 100 130" preserveAspectRatio="none" className="h-full w-full">
        {/* top bar with three dots */}
        <rect x={0} y={0} width="100" height="8" fill="rgba(0,0,0,0.25)" />
        <circle cx={4} cy={4} r={1.2} fill={w} opacity={0.6} />
        <circle cx={8} cy={4} r={1.2} fill={w} opacity={0.45} />
        <circle cx={12} cy={4} r={1.2} fill={w} opacity={0.3} />

        {variant === 0 && (
          <>
            {/* dashboard */}
            <rect x={6} y={14} width="40" height="6" fill={w} opacity={0.7} rx={1.5} />
            <rect x={6} y={26} width="42" height="34" fill={w} opacity={0.18} rx={3} />
            <rect x={52} y={26} width="42" height="34" fill={w} opacity={0.13} rx={3} />
            <rect x={6} y={66} width="88" height="22" fill={w} opacity={0.10} rx={3} />
            <rect x={6} y={94} width="56" height="6" fill={w} opacity={0.5} rx={1.5} />
            <rect x={6} y={106} width="36" height="6" fill={w} opacity={0.35} rx={1.5} />
            <rect x={6} y={118} width="62" height="6" fill={w} opacity={0.35} rx={1.5} />
          </>
        )}
        {variant === 1 && (
          <>
            {/* editor / spec */}
            <rect x={0} y={8} width="22" height="122" fill="rgba(0,0,0,0.20)" />
            <rect x={4} y={16} width="14" height="3" fill={w} opacity={0.45} rx={1} />
            <rect x={4} y={22} width="10" height="3" fill={w} opacity={0.30} rx={1} />
            <rect x={4} y={28} width="14" height="3" fill={w} opacity={0.30} rx={1} />
            <rect x={4} y={34} width="12" height="3" fill={w} opacity={0.30} rx={1} />
            <rect x={26} y={16} width="68" height="4" fill={w} opacity={0.6} rx={1} />
            <rect x={26} y={26} width="64" height="3" fill={w} opacity={0.35} rx={1} />
            <rect x={26} y={32} width="58" height="3" fill={w} opacity={0.35} rx={1} />
            <rect x={26} y={38} width="62" height="3" fill={w} opacity={0.35} rx={1} />
            <rect x={26} y={50} width="68" height="20" fill={w} opacity={0.10} rx={2} />
            <rect x={26} y={76} width="40" height="3" fill={w} opacity={0.3} rx={1} />
            <rect x={26} y={82} width="60" height="3" fill={w} opacity={0.3} rx={1} />
          </>
        )}
        {variant === 2 && (
          <>
            {/* chart */}
            <rect x={6} y={14} width="44" height="6" fill={w} opacity={0.7} rx={1.5} />
            <rect x={6} y={26} width="88" height="44" fill={w} opacity={0.10} rx={3} />
            <polyline points="10,62 22,52 34,58 46,42 58,48 70,32 82,36 92,26" stroke={w} strokeWidth={1.2} fill="none" opacity={0.85} />
            <circle cx={92} cy={26} r={1.5} fill={w} />
            <rect x={6} y={76} width="20" height="22" fill={w} opacity={0.10} rx={2} />
            <rect x={28} y={76} width="20" height="22" fill={w} opacity={0.18} rx={2} />
            <rect x={50} y={76} width="20" height="22" fill={w} opacity={0.25} rx={2} />
            <rect x={72} y={76} width="22" height="22" fill={w} opacity={0.40} rx={2} />
            <rect x={6} y={106} width="60" height="4" fill={w} opacity={0.35} rx={1} />
            <rect x={6} y={114} width="40" height="4" fill={w} opacity={0.35} rx={1} />
          </>
        )}
        {variant === 3 && (
          <>
            {/* gallery / list */}
            {[0, 1, 2].map((row) => (
              <g key={row}>
                <rect x={6} y={16 + row * 32} width="20" height="20" fill={w} opacity={0.20} rx={3} />
                <rect x={30} y={16 + row * 32} width="64" height="4" fill={w} opacity={0.6} rx={1} />
                <rect x={30} y={24 + row * 32} width="48" height="3" fill={w} opacity={0.35} rx={1} />
                <rect x={30} y={30 + row * 32} width="40" height="3" fill={w} opacity={0.35} rx={1} />
              </g>
            ))}
          </>
        )}
      </svg>
    </div>
  );
}

// ---------- top: featured carousel ----------

function FeaturedCarousel({
  items,
  upvotes,
  baseline,
  popping,
  onUpvote,
  onOpen,
}: {
  items: { startup: Startup; score: Score }[];
  upvotes: Record<string, number>;
  baseline: Record<string, number>;
  popping: string | null;
  onUpvote: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = items.length;

  useEffect(() => {
    if (paused || total <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % total), 5000);
    return () => clearInterval(t);
  }, [paused, total]);

  if (total === 0) return null;
  const current = items[index]!;
  const cover = coverFor(current.startup.id);
  const upvoteCount = (upvotes[current.startup.id] ?? 0) + (baseline[current.startup.id] ?? 0);
  const isPopping = popping === current.startup.id;

  return (
    <section
      className="mx-auto mt-6 max-w-5xl px-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center justify-between px-1 pb-3">
        <div className="display-mono">today's launches · top {total}</div>
        <div className="flex items-center gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-8 bg-neon-500' : 'w-2 bg-surfaceLight hover:bg-textsec'}`}
            />
          ))}
        </div>
      </div>

      <div className="relative">
        {/* upvote — overlaid at the very top-right, just arrow + number */}
        <button
          onClick={(e) => { e.stopPropagation(); onUpvote(current.startup.id); }}
          aria-label="Upvote"
          className={`absolute top-3 right-4 z-10 flex flex-col items-center text-base/90 hover:text-neon-500 ${isPopping ? 'animate-upvotePop' : ''}`}
        >
          <UpArrow size={20} />
          <span className="mt-0.5 font-display text-lg font-extrabold leading-none">{upvoteCount}</span>
        </button>

        <button
          onClick={() => onOpen(current.startup.id)}
          className="relative block w-full overflow-hidden rounded-[32px] border border-surfaceLight text-left"
          style={{ background: `linear-gradient(135deg, ${cover.from}, ${cover.to})` }}
        >
          <div className="relative h-[300px] sm:h-[340px]">
            {/* big letter */}
            <div className="absolute -left-6 -bottom-10 select-none font-display text-[280px] font-extrabold leading-none text-base/30">
              {current.startup.name.slice(0, 1)}
            </div>

            {/* labels */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="rounded-full bg-base px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neon-500 border border-neon-500/30">
                <SparkleIcon size={10} className="inline mr-1" /> Featured
              </span>
              <span className="rounded-full bg-base/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white border border-surfaceLight">
                {current.startup.category}
              </span>
            </div>

            {/* bottom content */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-base/90 via-base/50 to-transparent p-6 pt-16">
              <div className="font-display text-4xl font-extrabold leading-tight">{current.startup.name}</div>
              <p className="mt-1 max-w-2xl text-white/85">{current.startup.pitch}</p>
              <div className="mt-2 text-xs text-white/70 font-mono">readiness {Math.round(current.score.readiness)} · @{current.startup.ownerHandle}</div>
            </div>
          </div>
        </button>

        {/* prev / next */}
        {total > 1 ? (
          <>
            <button
              onClick={() => setIndex((i) => (i - 1 + total) % total)}
              aria-label="Previous"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-surfaceLight bg-base/80 p-2.5 text-white hover:border-neon-500/40 hover:text-neon-500"
            >
              <ArrowRightIcon className="rotate-180" />
            </button>
            <button
              onClick={() => setIndex((i) => (i + 1) % total)}
              aria-label="Next"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-surfaceLight bg-base/80 p-2.5 text-white hover:border-neon-500/40 hover:text-neon-500"
            >
              <ArrowRightIcon />
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}

// ---------- middle: filters ----------

function Filters({
  categories,
  value,
  onChange,
}: { categories: string[]; value: string; onChange: (c: string) => void }) {
  return (
    <div className="mx-auto max-w-5xl px-6 pt-10">
      <div className="flex items-center justify-between pb-3">
        <h2 className="font-display text-2xl font-extrabold">All launches</h2>
        <div className="display-mono">filter by category</div>
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {['All', ...categories].map((c) => {
          const active = (c === 'All' && value === '') || c === value;
          return (
            <button
              key={c}
              onClick={() => onChange(c === 'All' ? '' : c)}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold uppercase tracking-wider transition ${
                active
                  ? 'bg-neon-500 text-base'
                  : 'border border-surfaceLight bg-surface text-textsec hover:text-white'
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- middle: vertical list ----------

function ListCard({
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
  const cover = coverFor(startup.id);
  return (
    <div
      onClick={onOpen}
      className="bento group relative flex cursor-pointer items-center gap-5 overflow-hidden p-4 transition hover:border-neon-500/40"
    >
      {/* upvote — overlaid at very top of the card, just arrow + number */}
      <button
        onClick={(e) => { e.stopPropagation(); onUpvote(); }}
        aria-label="Upvote"
        className={`absolute top-3 right-4 flex flex-col items-center text-textsec transition hover:text-neon-500 ${popping ? 'animate-upvotePop' : ''}`}
      >
        <UpArrow size={18} />
        <span className="mt-0.5 font-display text-base font-extrabold leading-none">{upvotes}</span>
      </button>

      <div
        className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border border-surfaceLight"
        style={{ background: `linear-gradient(135deg, ${cover.from}, ${cover.to})` }}
      >
        <span className="font-display text-4xl font-extrabold text-base/70">{startup.name.slice(0, 1)}</span>
      </div>

      <div className="min-w-0 flex-1 pr-12">
        <div className="flex items-center gap-2">
          <div className="font-display text-xl font-bold">{startup.name}</div>
          <span className="rounded-full border border-surfaceLight bg-base px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-textsec">
            {startup.category}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-textsec">{startup.pitch}</p>
        <div className="mt-1.5 text-xs text-textsec">@{startup.ownerHandle}</div>
      </div>

      <ArrowRightIcon className="hidden text-textsec group-hover:text-white sm:block" />
    </div>
  );
}

// ---------- detail dialog (Google Play style) ----------

function DetailDialog({
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
  const cover = coverFor(startup.id);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Reset scroll on prev/next.
  useEffect(() => {
    dialogRef.current?.scrollTo({ top: 0 });
  }, [startup.id]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-40 grid place-items-center bg-base/85 backdrop-blur-md p-4"
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
        ref={dialogRef}
        className="bento relative w-full max-w-3xl max-h-[90vh] overflow-y-auto p-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner */}
        <div
          className="relative h-60 w-full"
          style={{ background: `linear-gradient(135deg, ${cover.from}, ${cover.to})` }}
        >
          <div className="absolute -left-6 -bottom-10 select-none font-display text-[260px] font-extrabold leading-none text-base/25">
            {startup.name.slice(0, 1)}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 rounded-full bg-base/80 p-2 text-white hover:bg-base"
          >
            <XIcon size={14} />
          </button>
          <div className="absolute bottom-3 left-4 font-mono text-xs text-base/80">
            {String(index).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </div>
          {/* upvote — at top of card, no inner element */}
          <button
            onClick={(e) => { e.stopPropagation(); onUpvote(); }}
            aria-label="Upvote"
            className={`absolute bottom-3 right-3 flex flex-col items-center text-base hover:text-neon-500 ${popping ? 'animate-upvotePop' : ''}`}
          >
            <UpArrow size={20} />
            <span className="mt-0.5 font-display text-lg font-extrabold leading-none">{upvotes}</span>
          </button>
        </div>

        {/* Header row: title, category, owner, big CTA */}
        <div className="px-7 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-3xl font-extrabold">{startup.name}</h2>
                <span className="rounded-full border border-surfaceLight bg-base px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-textsec">
                  {startup.category}
                </span>
              </div>
              <div className="mt-1 text-sm text-textsec">{ownerName ?? '@' + startup.ownerHandle}</div>
            </div>

            <a
              href={startup.landingUrl ?? '#'}
              target="_blank"
              rel="noreferrer"
              className="neon-button text-base"
            >
              Visit landing <ArrowRightIcon />
            </a>
          </div>

          {/* tagline */}
          <p className="mt-5 font-display text-lg leading-snug text-white/90">{startup.pitch}</p>
        </div>

        {/* Screenshots — horizontal scroll */}
        <div className="pt-6">
          <div className="px-7 pb-3 display-mono">screenshots</div>
          <div className="flex gap-3 overflow-x-auto px-7 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[0, 1, 2, 3].map((v) => (
              <ScreenshotMock key={v} from={cover.from} to={cover.to} variant={v as 0 | 1 | 2 | 3} />
            ))}
          </div>
        </div>

        {/* About */}
        {startup.description ? (
          <div className="px-7 pt-6">
            <div className="display-mono pb-2">about</div>
            <p className="text-white/80 leading-relaxed">{startup.description}</p>
          </div>
        ) : null}

        {/* Stats */}
        <div className="px-7 pt-6">
          <div className="display-mono pb-2">numbers</div>
          <div className="grid grid-cols-4 gap-x-6 gap-y-3">
            <FlatMetric label="Spec"      value={score.specCompleteness} tone="text-neon-500" />
            <FlatMetric label="Trace"     value={score.traceCoverage}    tone="text-softblue" />
            <FlatMetric label="Tests"     value={score.testPassRate}     tone="text-signal-green" />
            <FlatMetric label="Readiness" value={score.readiness}        tone="text-neon-500" />
          </div>
        </div>

        {/* Big CTA at the bottom too */}
        <div className="px-7 pb-7 pt-7 flex flex-wrap items-center justify-between gap-3">
          <div className="display-mono">←/→ to browse · esc to close</div>
          <div className="flex gap-2">
            <Link to="/login" className="ghost-button">
              <GithubIcon /> Continue with GitHub
            </Link>
            <a
              href={startup.landingUrl ?? '#'}
              target="_blank"
              rel="noreferrer"
              className="neon-button"
            >
              Visit landing <ArrowRightIcon />
            </a>
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

// ---------- Landing ----------

export function Landing() {
  const { state } = useStore();
  const scores = useScores();
  const published = useMemo(
    () => scores.filter((s) => s.startup.published && s.startup.batchId === state.activeBatchId),
    [scores, state.activeBatchId],
  );

  const [upvotes, setUpvotes] = useState<Record<string, number>>(() => loadUpvotes());
  const [popping, setPopping] = useState<string | null>(null);

  const baseline = useMemo(() => {
    const m: Record<string, number> = {};
    for (const { startup, score } of published) {
      m[startup.id] = 8 + Math.round((score.investorDemand / 100) * 32);
    }
    return m;
  }, [published]);

  const upvoteOf = useCallback(
    (id: string) => (upvotes[id] ?? 0) + (baseline[id] ?? 0),
    [upvotes, baseline],
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

  // Featured: top 4 by upvotes total.
  const featured = useMemo(() => {
    return [...published]
      .sort((a, b) => upvoteOf(b.startup.id) - upvoteOf(a.startup.id))
      .slice(0, 4);
  }, [published, upvoteOf]);

  // Categories from published list.
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const { startup } of published) set.add(startup.category);
    return Array.from(set).sort();
  }, [published]);

  const [filter, setFilter] = useState<string>('');

  const list = useMemo(() => {
    const filtered = filter
      ? published.filter(({ startup }) => startup.category === filter)
      : published;
    return [...filtered].sort((a, b) => upvoteOf(b.startup.id) - upvoteOf(a.startup.id));
  }, [published, filter, upvoteOf]);

  // Detail dialog: index inside `list`.
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const close = useCallback(() => setOpenIndex(null), []);
  const next  = useCallback(() => setOpenIndex((i) => (i === null ? null : (i + 1) % list.length)), [list.length]);
  const prev  = useCallback(() => setOpenIndex((i) => (i === null ? null : (i - 1 + list.length) % list.length)), [list.length]);

  const openById = useCallback(
    (id: string) => {
      const i = list.findIndex((x) => x.startup.id === id);
      if (i >= 0) setOpenIndex(i);
    },
    [list],
  );

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

  const open = openIndex !== null ? list[openIndex] : null;

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
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

      <FeaturedCarousel
        items={featured}
        upvotes={upvotes}
        baseline={baseline}
        popping={popping}
        onUpvote={upvote}
        onOpen={openById}
      />

      <Filters categories={categories} value={filter} onChange={setFilter} />

      <main className="mx-auto max-w-5xl px-6 pb-16">
        <ul className="flex flex-col gap-4">
          {list.map(({ startup }) => (
            <li key={startup.id}>
              <ListCard
                startup={startup}
                upvotes={upvoteOf(startup.id)}
                popping={popping === startup.id}
                onOpen={() => openById(startup.id)}
                onUpvote={() => upvote(startup.id)}
              />
            </li>
          ))}
          {list.length === 0 ? (
            <li className="bento p-6 text-textsec">No products in this category yet.</li>
          ) : null}
        </ul>
      </main>

      {open ? (
        <DetailDialog
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
          total={list.length}
        />
      ) : null}
    </div>
  );
}
