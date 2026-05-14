import { Link } from 'react-router-dom';
import { Bento, BentoHeader } from '../components/Bento';
import { Chip } from '../components/Chip';
import { Avatar } from '../components/Avatar';
import { useStore } from '../AppStore';
import { investorPortfolio, remainingCredits } from '@/domain/investments';
import { useScores } from '../hooks';
import { ChartIcon, CoinIcon } from '../design/Icon';

export function Portfolio() {
  const { state } = useStore();
  const scores = useScores();
  const me = state.session!.handle;
  const remaining = remainingCredits(state, state.activeBatchId, me);
  const portfolio = investorPortfolio(state, me).map((p) => ({
    ...p,
    target: scores.find((s) => s.startup.id === p.startupId),
  }));
  const allocated = portfolio.reduce((a, b) => a + b.amount, 0);
  const value = portfolio.reduce((a, b) => {
    if (!b.target) return a;
    // simple simulation bonus from readiness/100
    return a + b.amount * (1 + b.target.score.readiness / 200);
  }, 0);

  return (
    <div className="space-y-5">
      <Bento tone="sky" padding="p-7">
        <BentoHeader
          eyebrow="investor view"
          title="My Portfolio"
          right={<Chip tone="sky">batch GENESYS-001</Chip>}
        />
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Credits left" value={remaining} tone="text-neon-400" />
          <Stat label="Allocated" value={allocated} tone="text-sky-400" />
          <Stat label="Positions" value={portfolio.length} tone="text-signal-violet" />
          <Stat label="Portfolio value" value={Math.round(value)} tone="text-signal-green" />
        </div>
      </Bento>

      <Bento padding="p-0">
        <div className="grid grid-cols-12 gap-2 border-b border-white/[0.06] px-5 py-3 text-xs uppercase tracking-widest text-white/40">
          <div className="col-span-6">Startup</div>
          <div className="col-span-2 text-right">Allocated</div>
          <div className="col-span-2 text-right">Readiness</div>
          <div className="col-span-2 text-right">Value</div>
        </div>
        <ul className="divide-y divide-white/[0.04]">
          {portfolio.map((p) => (
            <li key={p.startupId} className="grid grid-cols-12 items-center gap-2 px-5 py-3">
              <Link to={`/app/startups/${p.startupId}/showcase`} className="col-span-6 flex items-center gap-3 hover:opacity-90">
                <Avatar seed={p.target?.startup.name ?? p.startupId} size={32} />
                <div>
                  <div className="text-sm">{p.target?.startup.name ?? p.startupId}</div>
                  <div className="text-xs text-white/40">{p.target?.startup.pitch ?? '—'}</div>
                </div>
              </Link>
              <div className="col-span-2 text-right font-mono text-sm"><CoinIcon size={12} className="inline text-neon-400" /> {p.amount}</div>
              <div className="col-span-2 text-right font-mono text-sm text-sky-400">{Math.round(p.target?.score.readiness ?? 0)}</div>
              <div className="col-span-2 text-right font-display text-base font-semibold text-signal-green">
                {Math.round(p.amount * (1 + (p.target?.score.readiness ?? 0) / 200))}
              </div>
            </li>
          ))}
          {portfolio.length === 0 ? (
            <li className="px-5 py-6 text-sm text-white/50">No positions yet. Head to <Link to="/app/marketplace" className="text-neon-400 underline">Marketplace</Link>.</li>
          ) : null}
        </ul>
      </Bento>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-ink-800/60 p-3">
      <div className="display-mono">{label}</div>
      <div className={`mt-1 font-display text-2xl font-semibold ${tone}`}>{value}</div>
    </div>
  );
}
