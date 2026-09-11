import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Bento, BentoHeader } from '../components/Bento';
import { Chip } from '../components/Chip';
import { Avatar } from '../components/Avatar';
import { useStore } from '../AppStore';
import { useScores } from '../hooks';
import { remainingCredits } from '@/domain/investments';
import { CoinIcon, ShopIcon, SparkleIcon } from '../design/Icon';

export function Marketplace() {
  const { state, invest } = useStore();
  const scores = useScores();
  const [search] = useSearchParams();
  const focusId = search.get('focus');
  const session = state.session!;
  const credits = remainingCredits(state, state.activeBatchId, session.handle);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<string>('all');

  const published = useMemo(() => scores.filter(({ startup }) => startup.published && startup.batchId === state.activeBatchId), [scores, state.activeBatchId]);

  const categories = useMemo(() => Array.from(new Set(published.map((p) => p.startup.category))), [published]);
  const visible = published.filter(({ startup }) => {
    if (cat !== 'all' && startup.category !== cat) return false;
    if (query && !startup.name.toLowerCase().includes(query.toLowerCase()) && !startup.pitch.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <Bento>
        <BentoHeader
          eyebrow="cohort market"
          title="Marketplace"
          right={
            <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5">
              <CoinIcon size={14} className="text-neon-400" />
              <span className="font-mono text-sm">{credits}</span>
              <span className="text-xs text-white/40">credits left</span>
            </div>
          }
        />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search startups…"
            className="w-64 rounded-2xl border border-white/[0.08] bg-ink-800/60 px-3 py-2 text-sm outline-none focus:border-neon-500/60"
          />
          <button onClick={() => setCat('all')} className={`chip ${cat === 'all' ? 'chip-yellow' : 'chip-neutral'}`}>all</button>
          {categories.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`chip ${cat === c ? 'chip-sky' : 'chip-neutral'}`}>{c}</button>
          ))}
        </div>
      </Bento>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map(({ startup, score }) => (
          <StartupCard
            key={startup.id}
            startupId={startup.id}
            name={startup.name}
            pitch={startup.pitch}
            category={startup.category}
            ownerHandle={startup.ownerHandle}
            readiness={score.readiness}
            demand={score.investorDemand}
            isFocused={focusId === startup.id}
            onInvest={(amt) => {
              const r = invest(startup.id, amt);
              if (!r.ok) alert(REASON_MAP[r.reason] ?? r.reason);
            }}
          />
        ))}
        {visible.length === 0 ? (
          <Bento className="sm:col-span-2 xl:col-span-3">
            <div className="flex items-center gap-2"><SparkleIcon className="text-neon-400" /> Nothing matches your filters.</div>
          </Bento>
        ) : null}
      </div>
    </div>
  );
}

const REASON_MAP: Record<string, string> = {
  INSUFFICIENT_CREDITS: 'You do not have enough credits.',
  SELF_INVEST_FORBIDDEN: 'Self-investment is forbidden by batch policy.',
  STARTUP_NOT_PUBLISHED: 'This startup is not published.',
  INVALID_AMOUNT: 'Pick a positive amount.',
  NO_SESSION: 'Log in first.',
};

function StartupCard({
  startupId,
  name,
  pitch,
  category,
  ownerHandle,
  readiness,
  demand,
  isFocused,
  onInvest,
}: {
  startupId: string;
  name: string;
  pitch: string;
  category: string;
  ownerHandle: string;
  readiness: number;
  demand: number;
  isFocused: boolean;
  onInvest: (n: number) => void;
}) {
  const [amount, setAmount] = useState(100);
  return (
    <Bento tone={isFocused ? 'yellow' : 'default'} className={isFocused ? 'glow-yellow' : ''}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar seed={name} size={42} />
          <div className="min-w-0">
            <div className="display-mono">{category}</div>
            <Link to={`/app/startups/${startupId}/showcase`} className="block">
              <div className="truncate font-display text-lg font-semibold">{name}</div>
            </Link>
            <div className="text-xs text-white/40">@{ownerHandle}</div>
          </div>
        </div>
        <Chip tone="yellow">{Math.round(readiness)}</Chip>
      </div>

      <p className="mt-3 line-clamp-3 min-h-[3rem] text-sm text-white/70">{pitch}</p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Stat label="Readiness" value={Math.round(readiness)} tone="text-neon-400" />
        <Stat label="Demand" value={Math.round(demand)} tone="text-sky-400" />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          type="number"
          min={1}
          step={1}
          value={amount}
          onChange={(e) => setAmount(Math.max(1, Number(e.target.value || 0)))}
          className="w-24 rounded-2xl border border-white/[0.08] bg-ink-800/60 px-3 py-2 text-sm outline-none focus:border-neon-500/60"
        />
        <button onClick={() => onInvest(amount)} className="neon-button !py-2 flex-1">
          <CoinIcon size={14} /> Invest
        </button>
        <Link to={`/app/startups/${startupId}/showcase`} className="ghost-button !py-2 !px-3 text-xs">
          <ShopIcon size={12} /> View
        </Link>
      </div>
    </Bento>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-ink-800/60 p-2">
      <div className="display-mono">{label}</div>
      <div className={`mt-0.5 font-display text-lg font-semibold ${tone}`}>{value}</div>
    </div>
  );
}
