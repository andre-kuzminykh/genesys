import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../AppStore';
import { useServer } from '../ServerStore';
import { ScrollToTop } from '../components/ScrollToTop';
import { Footer } from '../components/Footer';
import { CookieBanner } from '../components/CookieBanner';
import { useInfinitePagination } from '../hooks/useInfinitePagination';
import { useScores } from '../hooks';
import type { Score, Startup } from '@/domain/types';
import { ArrowRightIcon, GithubIcon, MoonIcon, SunIcon, SparkleIcon, XIcon, ChevronLeftIcon, ChevronRightIcon, DollarIcon } from '../design/Icon';
import { Wordmark } from '../components/Wordmark';
import { useTheme } from '../Theme';
import { filterByTags, popularTags, toggleTag } from '@/domain/tags';
import { searchStartups } from '@/domain/search';

// ---------- helpers ----------

const COVERS = [
  { from: '#7FFF00', to: '#82A0FF' },
  { from: '#82A0FF', to: '#B698FF' },
  { from: '#FFB05A', to: '#5EE6A8' },
  { from: '#FF4B4B', to: '#7FFF00' },
  { from: '#5EE6A8', to: '#82A0FF' },
  { from: '#B698FF', to: '#9DFF40' },
  { from: '#9DFF40', to: '#FFB05A' },
  { from: '#82A0FF', to: '#5EE6A8' },
];

const LANDING_PAGE_SIZE = 20;

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function coverFor(id: string) { return COVERS[hashStr(id) % COVERS.length]!; }

function UpArrow({ size = 16, className = '', style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M12 5l-7 8h4v6h6v-6h4l-7-8z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-textsec">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-surfaceLight bg-surface text-textsec transition hover:border-neon-500/40 hover:text-neon-500"
    >
      {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
    </button>
  );
}

// Slim arrow inside the "Visit landing" / "Read more" CTA.
function ArrowRight16() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// ---------- screenshots (used in the detail dialog) ----------

function ScreenshotMock({ from, to, variant }: { from: string; to: string; variant: 0 | 1 | 2 | 3 }) {
  const w = '#FFFFFF';
  return (
    <div className="aspect-[3/4] w-56 shrink-0 overflow-hidden rounded-2xl border border-surfaceLight" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
      <svg viewBox="0 0 100 130" preserveAspectRatio="none" className="h-full w-full">
        <rect x={0} y={0} width="100" height="8" fill="rgba(0,0,0,0.25)" />
        <circle cx={4} cy={4} r={1.2} fill={w} opacity={0.6} />
        <circle cx={8} cy={4} r={1.2} fill={w} opacity={0.45} />
        <circle cx={12} cy={4} r={1.2} fill={w} opacity={0.3} />
        {variant === 0 && (<>
          <rect x={6} y={14} width="40" height="6" fill={w} opacity={0.7} rx={1.5} />
          <rect x={6} y={26} width="42" height="40" fill={w} opacity={0.18} rx={3} />
          <rect x={52} y={26} width="42" height="40" fill={w} opacity={0.13} rx={3} />
          <rect x={6} y={72} width="88" height="22" fill={w} opacity={0.10} rx={3} />
          <rect x={6} y={102} width="56" height="6" fill={w} opacity={0.5} rx={1.5} />
          <rect x={6} y={114} width="36" height="6" fill={w} opacity={0.35} rx={1.5} />
        </>)}
        {variant === 1 && (<>
          <rect x={0} y={8} width="22" height="122" fill="rgba(0,0,0,0.20)" />
          <rect x={4} y={16} width="14" height="3" fill={w} opacity={0.45} rx={1} />
          <rect x={4} y={22} width="10" height="3" fill={w} opacity={0.30} rx={1} />
          <rect x={4} y={28} width="14" height="3" fill={w} opacity={0.30} rx={1} />
          <rect x={26} y={16} width="68" height="4" fill={w} opacity={0.6} rx={1} />
          <rect x={26} y={26} width="64" height="3" fill={w} opacity={0.35} rx={1} />
          <rect x={26} y={32} width="58" height="3" fill={w} opacity={0.35} rx={1} />
          <rect x={26} y={50} width="68" height="20" fill={w} opacity={0.10} rx={2} />
        </>)}
        {variant === 2 && (<>
          <rect x={6} y={14} width="44" height="6" fill={w} opacity={0.7} rx={1.5} />
          <rect x={6} y={26} width="88" height="44" fill={w} opacity={0.10} rx={3} />
          <polyline points="10,62 22,52 34,58 46,42 58,48 70,32 82,36 92,26" stroke={w} strokeWidth={1.2} fill="none" opacity={0.85} />
          <circle cx={92} cy={26} r={1.5} fill={w} />
          <rect x={6} y={76} width="20" height="22" fill={w} opacity={0.10} rx={2} />
          <rect x={28} y={76} width="20" height="22" fill={w} opacity={0.18} rx={2} />
          <rect x={50} y={76} width="20" height="22" fill={w} opacity={0.25} rx={2} />
          <rect x={72} y={76} width="22" height="22" fill={w} opacity={0.40} rx={2} />
        </>)}
        {variant === 3 && (<>
          {[0, 1, 2].map((row) => (
            <g key={row}>
              <rect x={6} y={16 + row * 32} width="20" height="20" fill={w} opacity={0.20} rx={3} />
              <rect x={30} y={16 + row * 32} width="64" height="4" fill={w} opacity={0.6} rx={1} />
              <rect x={30} y={24 + row * 32} width="48" height="3" fill={w} opacity={0.35} rx={1} />
              <rect x={30} y={30 + row * 32} width="40" height="3" fill={w} opacity={0.35} rx={1} />
            </g>
          ))}
        </>)}
      </svg>
    </div>
  );
}

function PitchMediaTile({ kind, href, accent }: { kind: 'pdf' | 'video'; href: string; accent: string }) {
  const label = kind === 'pdf' ? 'Pitch deck' : 'Demo video';
  const ext = kind === 'pdf' ? 'pitch.pdf' : 'video.mp4';
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex h-32 items-center gap-3 overflow-hidden rounded-2xl border border-surfaceLight bg-surface px-4 py-3 transition hover:border-neon-500/40"
    >
      <div
        className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-ink"
        style={{ background: accent }}
      >
        {kind === 'pdf' ? (
          <svg viewBox="0 0 24 24" width={28} height={28} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5" />
            <path d="M8 13h8M8 17h5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width={28} height={28} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x={3} y={5} width={18} height={14} rx={3} />
            <path d="M10 9l5 3-5 3z" fill="currentColor" />
          </svg>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-lg font-extrabold">{label}</div>
        <div className="mt-1 font-mono text-xs text-textsec">{ext}</div>
      </div>
      <ArrowRightIcon />
    </a>
  );
}

// ---------- shared visual atoms ----------

function CoverArea({ name, height, badge, image }: { name: string; height: number; badge?: React.ReactNode; image?: string }) {
  const cover = coverFor(name);
  const [ok, setOk] = useState(true);
  const showImage = image && ok;
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height, background: showImage ? undefined : `linear-gradient(135deg, ${cover.from}, ${cover.to})` }}
    >
      {showImage ? (
        <img
          src={image}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          draggable={false}
          onError={() => setOk(false)}
        />
      ) : (
        <div
          className="absolute -bottom-10 -left-4 select-none font-display font-extrabold leading-none text-ink/25"
          style={{ fontSize: Math.round(height * 0.95) }}
        >
          {name.slice(0, 1)}
        </div>
      )}
      {badge ? <div className="absolute top-4 left-4 z-10">{badge}</div> : null}
    </div>
  );
}

function HashChips({ tags, onClick, limit = 6, dense = false }: { tags: string[]; onClick?: (t: string) => void; limit?: number; dense?: boolean }) {
  // Single horizontal scroll-strip — same shape as the hashtag bar under the
  // search box. Each chip is shrink-0 + whitespace-nowrap so the row never
  // wraps and the user swipes/scrolls sideways when there are more than fit.
  return (
    <div className="-mx-2 flex items-center gap-1.5 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tags.slice(0, limit).map((t) => (
        <button
          key={t}
          onClick={(e) => { e.stopPropagation(); onClick?.(t); }}
          className={`shrink-0 whitespace-nowrap rounded-full border border-surfaceLight bg-base ${dense ? 'px-2 py-0.5' : 'px-2.5 py-1'} text-[10px] font-bold uppercase tracking-wider text-textsec transition hover:text-neon-500 hover:border-neon-500/40`}
        >
          #{t}
        </button>
      ))}
    </div>
  );
}

// ---------- featured card (image + title overlay, no body, no upvote, no Visit) ----------

function FeaturedCard({
  startup, onOpen, topOverlay,
}: {
  startup: Startup;
  onOpen: () => void;
  topOverlay?: React.ReactNode;
}) {
  const cover = coverFor(startup.id);
  return (
    <button
      onClick={onOpen}
      aria-label={`Open ${startup.name}`}
      className="bento relative block w-full overflow-hidden text-left"
    >
      <div
        className="relative h-[380px] w-full"
        style={{ background: startup.coverImage ? undefined : `linear-gradient(135deg, ${cover.from}, ${cover.to})` }}
      >
        {startup.coverImage ? (
          <img
            src={startup.coverImage}
            alt={startup.name}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div
            className="pointer-events-none absolute -bottom-12 -left-6 select-none font-display font-extrabold leading-none text-ink/20"
            style={{ fontSize: 360 }}
          >
            {startup.name.slice(0, 1)}
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_70%_at_50%_30%,transparent_40%,rgba(0,0,0,0.55)_100%)]" />

        <div className="absolute top-5 left-5">
          <span
            className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neon-500 border border-neon-500/30 backdrop-blur"
            style={{ background: 'rgba(0,0,0,0.65)' }}
          >
            <SparkleIcon size={10} className="inline mr-1" /> Featured
          </span>
        </div>

        {topOverlay ? (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10">
            {topOverlay}
          </div>
        ) : null}

        <div className="absolute bottom-0 left-0 right-0 p-7">
          <h2
            className="font-display text-5xl font-extrabold leading-[1.05] drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
            style={{ color: '#FFFFFF' }}
          >
            {startup.name}
          </h2>
          <p
            className="mt-3 max-w-2xl line-clamp-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
            style={{ color: 'rgba(255,255,255,0.85)' }}
          >
            {startup.pitch}
          </p>
        </div>
      </div>
    </button>
  );
}

// ---------- carousel of featured cards ----------

function FeaturedCarousel({
  items, onOpen,
}: {
  items: { startup: Startup; score: Score }[];
  onOpen: (id: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = items.length;

  useEffect(() => {
    if (paused || total <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % total), 6000);
    return () => clearInterval(t);
  }, [paused, total]);

  if (total === 0) return null;
  const current = items[index]!;

  return (
    <section
      className="mx-auto mt-6 max-w-5xl px-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative">
        <FeaturedCard
          startup={current.startup}
          onOpen={() => onOpen(current.startup.id)}
          topOverlay={
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 backdrop-blur-md"
              style={{ background: 'rgba(0,0,0,0.55)' }}
            >
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === index ? 'w-7 bg-neon-500' : 'w-2'}`}
                  style={i !== index ? { background: 'rgba(255,255,255,0.45)' } : undefined}
                />
              ))}
            </div>
          }
        />

        {/* Plain chevrons further out from the card edges. No bg, no border. */}
        <button
          onClick={() => setIndex((i) => (i - 1 + total) % total)}
          aria-label="Previous"
          className="absolute -left-20 top-1/2 -translate-y-1/2 text-textsec transition hover:text-neon-500"
        >
          <ChevronLeftIcon size={40} />
        </button>
        <button
          onClick={() => setIndex((i) => (i + 1) % total)}
          aria-label="Next"
          className="absolute -right-20 top-1/2 -translate-y-1/2 text-textsec transition hover:text-neon-500"
        >
          <ChevronRightIcon size={40} />
        </button>
      </div>
    </section>
  );
}

// ---------- list card ----------

function ListCard({
  startup, upvotes, voted, popping, invested, onOpen, onUpvote, onTagClick,
}: {
  startup: Startup;
  upvotes: number;
  voted: boolean;
  popping: boolean;
  invested: number;
  onOpen: () => void;
  onUpvote: () => void;
  onTagClick: (t: string) => void;
}) {
  return (
    <article className="bento overflow-hidden">
      <button onClick={onOpen} className="block w-full text-left" aria-label={`Open ${startup.name}`}>
        <CoverArea name={startup.name} height={300} image={startup.coverImage} />
      </button>

      <div className="p-7">
        <h3
          className="cursor-pointer font-display text-2xl font-extrabold leading-tight hover:text-neon-500"
          onClick={onOpen}
        >
          {startup.name}
        </h3>
        <div className="mt-3"><HashChips tags={startup.hashtags} onClick={onTagClick} limit={50} dense /></div>
        <p className="mt-3 whitespace-pre-line text-[15px] text-textsec leading-relaxed">
          {((startup.description ?? startup.pitch) || '').slice(0, 2000)}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-surfaceLight pt-4">
          {/* Upvote — plain arrow + number, no border/pill. One vote per browser;
              clicking when voted flips the arrow to point down (= "undo"). */}
          <button
            onClick={(e) => { e.stopPropagation(); onUpvote(); }}
            className={`group inline-flex items-center gap-1.5 transition hover:text-neon-500 ${voted ? 'text-neon-500' : 'text-textsec'} ${popping ? 'animate-upvotePop' : ''}`}
            aria-label={voted ? 'Remove upvote' : 'Upvote'}
            aria-pressed={voted}
          >
            <UpArrow size={18} style={voted ? { transform: 'rotate(180deg)' } : undefined} />
            <span className="font-display text-lg font-extrabold leading-none">{upvotes}</span>
          </button>

          <div className="flex items-center gap-3">
            {invested > 0 ? (
              <span className="inline-flex items-center text-neon-500">
                <span className="font-display text-sm font-extrabold leading-none">{fmtUSD(invested)}</span>
              </span>
            ) : null}
            <button onClick={onOpen} className="ghost-button !py-2 !px-5 text-sm">
              Open <ArrowRight16 />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

// ---------- hashtag bar ----------

function HashtagBar({
  allItems, selected, onToggleTag, onClear,
}: {
  allItems: Startup[];
  selected: string[];
  onToggleTag: (t: string) => void;
  onClear: () => void;
}) {
  const top = useMemo(() => popularTags(allItems, 40), [allItems]);
  const sorted = useMemo(() => {
    const inSel = top.filter((t) => selected.includes(t.tag));
    const rest = top.filter((t) => !selected.includes(t.tag));
    return [...inSel, ...rest];
  }, [top, selected]);

  return (
    <div className="mx-auto -mt-3 max-w-5xl px-6 pb-1">
      <div className="-mx-2 flex items-center gap-2 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {selected.length > 0 ? (
          <button
            onClick={onClear}
            className="shrink-0 whitespace-nowrap rounded-full border border-surfaceLight bg-surface px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-textsec hover:text-neon-500"
          >
            clear ×
          </button>
        ) : null}
        {sorted.map(({ tag }) => {
          const active = selected.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                active
                  ? 'bg-neon-500 text-ink'
                  : 'border border-surfaceLight bg-surface text-textsec hover:text-neon-500 hover:border-neon-500/30'
              }`}
            >
              #{tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- detail dialog ----------

function fmtUSD(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (abs >= 1_000) return '$' + Math.round(n / 1000) + 'k';
  return '$' + n.toLocaleString('en-US');
}

function DetailDialog({
  startup, score, upvotes, voted, popping,
  onClose, onNext, onPrev, onUpvote, onTagClick,
}: {
  startup: Startup;
  score: Score;
  upvotes: number;
  voted: boolean;
  popping: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onUpvote: () => void;
  onTagClick: (t: string) => void;
}) {
  const { state } = useStore();
  const server = useServer();
  const me = state.session?.handle;
  const wallet = me ? server.walletRemaining(me) : null;
  const [investOpen, setInvestOpen] = useState(false);
  const [amount, setAmount] = useState('1000');
  const [investErr, setInvestErr] = useState<string | null>(null);
  const [investing, setInvesting] = useState(false);

  const myInvested = me
    ? server.state.investments
        .filter((i) => i.investorHandle.toLowerCase() === me.toLowerCase() && i.startupId === startup.id)
        .reduce((a, b) => a + b.amount, 0)
    : 0;

  // Pull the latest forecast for this startup, if any.
  const forecastForThis = useMemo(() => {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('genesys:forecast:v1') : null;
      if (!raw) return null;
      const sim = JSON.parse(raw) as { startups: Array<{ startupId: string; endUsers: number; totalRevenueUSD: number }> };
      return sim.startups.find((s) => s.startupId === startup.id) ?? null;
    } catch { return null; }
  }, [startup.id, server.state.investments.length]);

  async function submitInvest() {
    setInvestErr(null);
    const amt = Math.floor(Number(amount));
    if (!Number.isFinite(amt) || amt <= 0) { setInvestErr('Enter a positive amount.'); return; }
    setInvesting(true);
    const r = await server.invest(startup.id, amt);
    setInvesting(false);
    if (!r.ok) {
      const m: Record<string, string> = {
        INSUFFICIENT_CREDITS: 'Not enough budget in your wallet.',
        SELF_INVEST_FORBIDDEN: "You can't invest in your own startup.",
        INVALID_AMOUNT: 'Enter a positive amount.',
        NOT_IN_ALLOWLIST: 'Your GitHub handle is not on the cohort allowlist.',
        BAD_TOKEN: 'Your GitHub session expired — sign in again.',
        NO_TOKEN: 'Sign in with GitHub to invest.',
      };
      setInvestErr(m[r.code] ?? r.message);
      return;
    }
    setInvestOpen(false);
    setAmount('1000');
  }

  const cover = coverFor(startup.id);
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = dialogRef.current;
    if (el && typeof el.scrollTo === 'function') el.scrollTo({ top: 0 });
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
        className="absolute left-3 top-1/2 -translate-y-1/2 hidden md:inline-flex h-11 w-11 items-center justify-center rounded-full border border-surfaceLight bg-surface text-textsec transition hover:border-neon-500/40 hover:text-neon-500 md:left-8"
      >
        <div style={{ transform: 'rotate(180deg)' }}><ArrowRight16 /></div>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        aria-label="Next"
        className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex h-11 w-11 items-center justify-center rounded-full border border-surfaceLight bg-surface text-textsec transition hover:border-neon-500/40 hover:text-neon-500 md:right-8"
      >
        <ArrowRight16 />
      </button>

      <div
        ref={dialogRef}
        className="bento relative w-full max-w-3xl max-h-[90vh] overflow-y-auto p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative h-60 w-full"
          style={{ background: startup.coverImage ? undefined : `linear-gradient(135deg, ${cover.from}, ${cover.to})` }}
        >
          {startup.coverImage ? (
            <img
              src={startup.coverImage}
              alt={startup.name}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              draggable={false}
            />
          ) : (
            <div className="absolute -left-6 -bottom-10 select-none font-display text-[260px] font-extrabold leading-none text-ink/25">
              {startup.name.slice(0, 1)}
            </div>
          )}
          <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 rounded-full bg-base/80 p-2 text-white hover:bg-base z-10">
            <XIcon size={14} />
          </button>
        </div>

        <div className="px-7 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-display text-3xl font-extrabold">{startup.name}</h2>
              <div className="mt-2"><HashChips tags={startup.hashtags} onClick={onTagClick} limit={50} /></div>
            </div>
            {/* Upvote moved out of the cover overlay so it can't be hit by the
                prev/next viewport-edge nav buttons on smaller screens. */}
            <button
              onClick={(e) => { e.stopPropagation(); onUpvote(); }}
              aria-label={voted ? 'Remove upvote' : 'Upvote'}
              aria-pressed={voted}
              className={`shrink-0 inline-flex items-center gap-2 rounded-2xl border border-surfaceLight bg-surface px-3 py-2 transition hover:border-neon-500/40 ${voted ? 'text-neon-500' : 'text-textsec'} ${popping ? 'animate-upvotePop' : ''}`}
            >
              <UpArrow
                size={20}
                style={voted ? { transform: 'rotate(180deg)' } : undefined}
              />
              <span className="font-display text-xl font-extrabold leading-none">{upvotes}</span>
            </button>
          </div>

          <p className="mt-5 font-display text-lg leading-snug">{startup.pitch}</p>
        </div>

        <div className="pt-6">
          <div className="px-7 pb-3 display-mono">pitch & demo</div>
          <div className="grid grid-cols-1 gap-3 px-7 pb-2 sm:grid-cols-2">
            <PitchMediaTile
              kind="pdf"
              href={`https://github.com/${startup.repo}/blob/main/pitch.pdf`}
              accent={cover.from}
            />
            <PitchMediaTile
              kind="video"
              href={`https://github.com/${startup.repo}/blob/main/video.mp4`}
              accent={cover.to}
            />
          </div>
        </div>

        {startup.description ? (
          <div className="px-7 pt-6">
            <div className="display-mono pb-2">about</div>
            <p className="text-textsec leading-relaxed whitespace-pre-line">{startup.description}</p>
          </div>
        ) : null}

        {forecastForThis ? (
          <div className="px-7 pt-6">
            <div className="display-mono pb-2">numbers</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <FlatMetric label="Users (May 27)"  value={forecastForThis.endUsers}                  tone="text-softblue"  />
              <FlatMetric label="Revenue (year)"  value={Math.round(forecastForThis.totalRevenueUSD)} tone="text-neon-500"  prefix="$" />
            </div>
          </div>
        ) : null}

        {/* Open the repo on GitHub before the money flow. */}
        <div className="px-7 pt-7">
          <a
            href={startup.landingUrl ?? `https://github.com/${startup.repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ghost-button w-full justify-center"
          >
            <GithubIcon size={16} /> Open project on GitHub <ArrowRightIcon />
          </a>
        </div>

        {/* Invest block */}
        <div className="px-7 pt-5 pb-7">
          <div className="rounded-2xl border border-surfaceLight bg-base p-6">
            {!me ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-display text-lg font-bold">Sign in to invest</div>
                  <div className="text-sm text-textsec">Every allowlisted member gets a $100,000 demo budget.</div>
                </div>
                <Link to="/login" className="neon-button">
                  <GithubIcon /> Continue with GitHub
                </Link>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-neon-500 text-ink shadow-neon">
                      <DollarIcon size={22} />
                    </div>
                    <div>
                      <div className="display-mono">your wallet</div>
                      <div className="font-display text-2xl font-extrabold leading-tight">{fmtUSD(wallet ?? 0)}</div>
                    </div>
                  </div>
                  {!investOpen ? (
                    <button
                      onClick={() => { setInvestErr(null); setInvestOpen(true); }}
                      className="neon-button"
                    >
                      <DollarIcon /> Invest
                    </button>
                  ) : null}
                </div>

                {myInvested > 0 ? (
                  <div className="mt-4 flex items-center justify-between rounded-2xl border border-neon-500/30 bg-neon-500/[0.08] px-4 py-2.5">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarIcon size={14} className="text-neon-500" />
                      <span>You've invested in {startup.name}</span>
                    </div>
                    <span className="font-display text-lg font-extrabold text-neon-500">{fmtUSD(myInvested)}</span>
                  </div>
                ) : null}

                {investOpen ? (
                  <form
                    onSubmit={(e) => { e.preventDefault(); submitInvest(); }}
                    className="mt-4 space-y-3"
                  >
                    <div className="label">Amount, USD</div>
                    <div className="flex items-center gap-2 rounded-2xl border border-surfaceLight bg-surface px-4 py-2.5 focus-within:border-neon-500/60">
                      <DollarIcon className="text-textsec" />
                      <input
                        value={amount}
                        onChange={(e) => { setAmount(e.target.value.replace(/[^0-9]/g, '')); setInvestErr(null); }}
                        inputMode="numeric"
                        autoFocus
                        className="flex-1 bg-transparent outline-none placeholder:text-textsec"
                        placeholder="1000"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {[500, 1000, 5000, 10000].filter((v) => v <= (wallet ?? 0)).map((v) => (
                        <button
                          type="button"
                          key={v}
                          onClick={() => setAmount(String(v))}
                          className="rounded-full border border-surfaceLight bg-base px-3 py-1 text-xs font-bold uppercase tracking-wider text-textsec hover:text-neon-500 hover:border-neon-500/40"
                        >
                          {fmtUSD(v)}
                        </button>
                      ))}
                      {(wallet ?? 0) > 0 ? (
                        <button
                          type="button"
                          onClick={() => setAmount(String(wallet))}
                          className="rounded-full border border-surfaceLight bg-base px-3 py-1 text-xs font-bold uppercase tracking-wider text-textsec hover:text-neon-500 hover:border-neon-500/40"
                        >
                          max
                        </button>
                      ) : null}
                    </div>

                    {investErr ? (
                      <div className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{investErr}</div>
                    ) : null}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="text-xs text-textsec">
                        After: <span className="font-mono text-white">{fmtUSD(Math.max(0, (wallet ?? 0) - Math.max(0, Math.floor(Number(amount) || 0))))}</span>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => { setInvestOpen(false); setInvestErr(null); }} className="ghost-button !py-2 !px-4 text-sm">
                          Cancel
                        </button>
                        <button type="submit" disabled={investing} className="neon-button !py-2 !px-5 text-sm disabled:opacity-60">
                          <DollarIcon size={14} /> {investing ? 'Sending…' : 'Confirm'}
                        </button>
                      </div>
                    </div>
                  </form>
                ) : null}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function FlatMetric({ label, value, tone, prefix = '' }: { label: string; value: number; tone: string; prefix?: string }) {
  const n = Math.round(value);
  const display =
    n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' :
    n >= 1_000 ? Math.round(n / 1000) + 'k' :
    String(n);
  return (
    <div>
      <div className="display-mono">{label}</div>
      <div className={`mt-0.5 font-display text-2xl font-extrabold ${tone}`}>{prefix}{display}</div>
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

  const server = useServer();
  const [popping, setPopping] = useState<string | null>(null);

  // Both reads come from the backend (everyone sees the same totals).
  const upvoteOf = useCallback((id: string) => server.upvoteCount(id), [server]);
  const hasVoted = useCallback((id: string) => server.hasVoted(id), [server]);

  const upvote = useCallback((id: string) => {
    setPopping(id);
    void server.toggleUpvote(id);
    setTimeout(() => setPopping((p) => (p === id ? null : p)), 400);
  }, [server]);

  const featured = useMemo(() => {
    return [...published]
      .sort((a, b) => upvoteOf(b.startup.id) - upvoteOf(a.startup.id))
      .slice(0, 4);
  }, [published, upvoteOf]);

  const [query, setQuery] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const list = useMemo(() => {
    const startups = published.map((p) => p.startup);
    const byTags = filterByTags(startups, tags);
    const byQuery = searchStartups(byTags, query);
    const ids = new Set(byQuery.map((s) => s.id));
    const filtered = published.filter((p) => ids.has(p.startup.id));
    return [...filtered].sort((a, b) => upvoteOf(b.startup.id) - upvoteOf(a.startup.id));
  }, [published, tags, query, upvoteOf]);

  const { visible: visibleCards, sentinelRef: cardsSentinelRef } = useInfinitePagination(
    list.length,
    LANDING_PAGE_SIZE,
    [query, tags.join('|')],
  );

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const close = useCallback(() => setOpenIndex(null), []);
  const next = useCallback(() => setOpenIndex((i) => (i === null ? null : (i + 1) % list.length)), [list.length]);
  const prev = useCallback(() => setOpenIndex((i) => (i === null ? null : (i - 1 + list.length) % list.length)), [list.length]);

  const openById = useCallback((id: string) => {
    const i = list.findIndex((x) => x.startup.id === id);
    if (i >= 0) setOpenIndex(i);
  }, [list]);

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

  const myHandle = state.session?.handle;
  const activeBatch = state.batches.find((b) => b.id === state.activeBatchId);
  const defaultBudget = activeBatch?.creditsPerInvestor ?? 100000;
  const myWallet = myHandle ? server.walletRemaining(myHandle) : defaultBudget;
  const myInvestments: Record<string, number> = useMemo(() => {
    const out: Record<string, number> = {};
    if (!myHandle) return out;
    for (const i of server.state.investments) {
      if (i.investorHandle.toLowerCase() === myHandle.toLowerCase()) {
        out[i.startupId] = (out[i.startupId] ?? 0) + i.amount;
      }
    }
    return out;
  }, [server.state.investments, myHandle]);

  return (
    <div className="min-h-screen">
      <header className="mx-auto max-w-5xl px-6 py-5">
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <Link to="/" aria-label="Genesys home" className="shrink-0">
            <span className="md:hidden"><Wordmark size="lg" /></span>
            <span className="hidden md:inline-flex"><Wordmark size="xl" /></span>
          </Link>

          <div className="order-last w-full md:order-none md:flex-1 md:flex md:justify-center">
            <div className="flex w-full md:max-w-[420px] items-center gap-2 rounded-full border border-surfaceLight bg-surface px-4 py-2.5 focus-within:border-neon-500/60">
              <SearchIcon />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, pitch, hashtag…"
                className="flex-1 bg-transparent outline-none placeholder:text-textsec"
              />
            {query ? (
              <button onClick={() => setQuery('')} className="text-textsec hover:text-white" aria-label="Clear search">
                <XIcon size={14} />
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/leaderboard"
            title={myHandle ? 'Open leaderboard · your wallet' : 'Sign in to invest · open leaderboard'}
            className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full border border-surfaceLight bg-surface px-4 font-display font-extrabold transition hover:border-neon-500/40 hover:text-neon-500"
          >
            <DollarIcon size={14} className="text-neon-500" />
            <span>{fmtUSD(myWallet)}</span>
          </Link>
          <ThemeToggle />
          {myHandle ? (
            <Link
              to="/onboarding/repo"
              title={`Open your repositories — signed in as @${myHandle}`}
              className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full border border-signal-green/40 bg-signal-green/10 px-4 font-display text-sm font-bold text-signal-green transition hover:bg-signal-green/15"
            >
              <span className="inline-flex h-2 w-2 rounded-full bg-signal-green animate-pulseGlow shadow-[0_0_8px_rgba(94,230,168,0.7)]" />
              Connected
            </Link>
          ) : (
            <Link to="/login" className="ghost-button shrink-0"><GithubIcon /> Login</Link>
          )}
        </div>
        </div>
      </header>

      <HashtagBar
        allItems={published.map((p) => p.startup)}
        selected={tags}
        onToggleTag={(t) => setTags((cur) => toggleTag(cur, t))}
        onClear={() => setTags([])}
      />

      <FeaturedCarousel
        items={featured}
        onOpen={openById}
      />

      <main className="mx-auto max-w-5xl px-6 pb-16 pt-10">
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {list.slice(0, visibleCards).map(({ startup }) => (
            <li key={startup.id}>
              <ListCard
                startup={startup}
                upvotes={upvoteOf(startup.id)}
                voted={hasVoted(startup.id)}
                popping={popping === startup.id}
                invested={myInvestments[startup.id] ?? 0}
                onOpen={() => openById(startup.id)}
                onUpvote={() => upvote(startup.id)}
                onTagClick={(t) => setTags((cur) => toggleTag(cur, t))}
              />
            </li>
          ))}
          {list.length === 0 ? (
            <li className="bento p-6 text-textsec md:col-span-2">
              <SparkleIcon size={14} className="inline mr-1 text-neon-500" /> Nothing matches — clear filters or change the query.
            </li>
          ) : null}
        </ul>

        <div ref={cardsSentinelRef} aria-hidden className="h-1" />
        {list.length > visibleCards ? (
          <div className="mt-6 text-center display-mono text-textsec">
            loading {list.length - visibleCards} more…
          </div>
        ) : null}
      </main>

      <ScrollToTop />
      <Footer />
      <CookieBanner />

      {open ? (
        <DetailDialog
          startup={open.startup}
          score={open.score}
          upvotes={upvoteOf(open.startup.id)}
          voted={hasVoted(open.startup.id)}
          popping={popping === open.startup.id}
          onClose={close}
          onNext={next}
          onPrev={prev}
          onUpvote={() => upvote(open.startup.id)}
          onTagClick={(t) => setTags((cur) => toggleTag(cur, t))}
        />
      ) : null}
    </div>
  );
}
