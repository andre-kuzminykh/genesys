import { Link } from 'react-router-dom';
import { Bento, BentoHeader } from '../components/Bento';
import { Chip } from '../components/Chip';
import { Avatar } from '../components/Avatar';
import { useLeaderboard } from '../hooks';
import { TrophyIcon } from '../design/Icon';

export function Leaderboard() {
  const ranked = useLeaderboard();
  const top = ranked[0];

  return (
    <div className="space-y-5">
      <Bento tone="yellow" padding="p-7">
        <BentoHeader
          eyebrow="demo-day · live"
          title="Leaderboard"
          right={<Chip tone="yellow"><TrophyIcon size={12} /> batch GENESYS-001</Chip>}
        />
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          Sorted by Readiness Score (desc). Ties are broken by total credits invested.
        </p>
        {top ? (
          <div className="mt-5 flex flex-wrap items-center gap-5 rounded-3xl border border-neon-500/30 bg-neon-500/[0.06] p-5">
            <Avatar seed={top.startup.name} size={72} />
            <div className="flex-1">
              <Chip tone="yellow">#1 · pole position</Chip>
              <div className="mt-2 font-display text-3xl font-semibold">{top.startup.name}</div>
              <div className="text-white/60">{top.startup.pitch}</div>
            </div>
            <div className="text-right">
              <div className="display-mono">readiness</div>
              <div className="font-display text-4xl font-semibold text-neon-400">{Math.round(top.score.readiness)}</div>
            </div>
          </div>
        ) : null}
      </Bento>

      <Bento padding="p-0">
        <div className="grid grid-cols-12 gap-2 border-b border-white/[0.06] px-5 py-3 text-xs uppercase tracking-widest text-white/40">
          <div className="col-span-1">#</div>
          <div className="col-span-4">Startup</div>
          <div className="col-span-1 text-right">Spec</div>
          <div className="col-span-1 text-right">Trace</div>
          <div className="col-span-1 text-right">Tests</div>
          <div className="col-span-1 text-right">Persona</div>
          <div className="col-span-1 text-right">Demand</div>
          <div className="col-span-2 text-right">Readiness</div>
        </div>
        <ul className="divide-y divide-white/[0.04]">
          {ranked.map(({ startup, score }, i) => (
            <li key={startup.id} className="grid grid-cols-12 items-center gap-2 px-5 py-3">
              <div className="col-span-1 font-mono text-sm text-white/40">{i + 1}</div>
              <Link to={`/app/startups/${startup.id}/showcase`} className="col-span-4 flex min-w-0 items-center gap-3 hover:opacity-90">
                <Avatar seed={startup.name} size={32} />
                <div className="min-w-0">
                  <div className="truncate text-sm">{startup.name}</div>
                  <div className="truncate text-xs text-white/40">{startup.pitch}</div>
                </div>
              </Link>
              <Cell value={score.specCompleteness} tone="text-neon-400" />
              <Cell value={score.traceCoverage} tone="text-sky-400" />
              <Cell value={score.testPassRate} tone="text-signal-green" />
              <Cell value={score.personaSatisfaction} tone="text-signal-violet" />
              <Cell value={score.investorDemand} tone="text-signal-amber" />
              <div className="col-span-2 text-right font-display text-xl font-semibold text-neon-400">
                {Math.round(score.readiness)}
              </div>
            </li>
          ))}
        </ul>
      </Bento>
    </div>
  );
}

function Cell({ value, tone }: { value: number; tone: string }) {
  return <div className={`col-span-1 text-right font-mono text-sm ${tone}`}>{Math.round(value)}</div>;
}
