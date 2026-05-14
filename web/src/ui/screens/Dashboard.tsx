import { Link } from 'react-router-dom';
import { Bento, BentoHeader } from '../components/Bento';
import { Chip } from '../components/Chip';
import { useStore } from '../AppStore';
import { useScores } from '../hooks';
import { modeStatuses } from '@/domain/modes';
import { Avatar } from '../components/Avatar';
import { ArrowRightIcon, ChartIcon, PlusIcon, RocketIcon, SparkleIcon } from '../design/Icon';

export function Dashboard() {
  const { state } = useStore();
  const scores = useScores();
  const me = state.session?.handle;
  const myStartups = scores.filter((s) => s.startup.ownerHandle === me);
  const others = scores.filter((s) => s.startup.ownerHandle !== me);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="display-mono">workspace</div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">My Startups</h1>
          <p className="text-white/50 mt-1 text-sm">Each startup is a CLAUDE.md runtime — modes, statuses, versioned spec.</p>
        </div>
        <Link to="/app/new" className="neon-button">
          <PlusIcon /> New startup
        </Link>
      </div>

      {/* Mine */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {myStartups.length === 0 ? (
          <Bento tone="yellow" className="md:col-span-2 xl:col-span-3">
            <div className="flex items-center gap-3">
              <SparkleIcon className="text-neon-400" />
              <div className="font-display text-lg">Start your first startup</div>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Genesis will interview you with an AI Analyst, generate a versioned spec, render a
              Mermaid architecture, and let peers invest credits in your idea.
            </p>
            <Link to="/app/new" className="neon-button mt-5">
              <PlusIcon /> Create startup
            </Link>
          </Bento>
        ) : myStartups.map(({ startup, score }) => {
          const spec = state.specs.find((p) => p.startupId === startup.id);
          const modes = modeStatuses(spec);
          const currentMode = modes.find((m) => m.mode === startup.currentMode);
          return (
            <Bento key={startup.id} tone="yellow">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="display-mono">{startup.category}</div>
                  <Link to={`/app/startups/${startup.id}/health`} className="block">
                    <div className="font-display text-xl font-semibold leading-tight">{startup.name}</div>
                  </Link>
                  <div className="mt-1 line-clamp-2 text-sm text-white/60">{startup.pitch}</div>
                </div>
                <Avatar seed={startup.name} size={42} />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <Metric label="Spec" value={score.specCompleteness} tone="text-neon-400" />
                <Metric label="Trace" value={score.traceCoverage} tone="text-sky-400" />
                <Metric label="Readiness" value={score.readiness} tone="text-signal-violet" />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <Chip tone="yellow">{currentMode?.mode} · {currentMode?.label}</Chip>
                <Link to={`/app/startups/${startup.id}/spec`} className="ghost-button !py-1.5 !px-3 text-xs">
                  Open spec <ArrowRightIcon size={12} />
                </Link>
              </div>
            </Bento>
          );
        })}
      </div>

      {/* Mode tracker for first startup */}
      {myStartups[0] ? (
        <Bento>
          <BentoHeader
            eyebrow="claude.md modes"
            title={`Methodology progress for ${myStartups[0].startup.name}`}
            right={<Chip tone="sky">{myStartups[0].startup.currentMode}</Chip>}
          />
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {modeStatuses(state.specs.find((p) => p.startupId === myStartups[0]!.startup.id)).slice(0, 8).map((m) => (
              <div
                key={m.mode}
                className={`bento-inset p-3 ${m.ready ? 'border-signal-green/30' : 'border-white/[0.04]'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs text-white/50">{m.mode}</div>
                  <Chip tone={m.ready ? 'green' : 'neutral'}>{m.ready ? 'READY' : 'LOCKED'}</Chip>
                </div>
                <div className="mt-2 text-sm font-medium">{m.label}</div>
                <div className="mt-1 line-clamp-2 text-xs text-white/50">{m.ready ? m.description : (m.reason ?? m.description)}</div>
              </div>
            ))}
          </div>
        </Bento>
      ) : null}

      {/* Other startups in batch (Mini-market preview) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Bento className="md:col-span-2">
          <BentoHeader
            eyebrow="cohort market"
            title="Other startups in your batch"
            right={<Link to="/app/marketplace" className="ghost-button !py-1.5 !px-3 text-xs">Marketplace <ArrowRightIcon size={12} /></Link>}
          />
          <ul className="mt-4 divide-y divide-white/[0.04]">
            {others.slice(0, 5).map(({ startup, score }) => (
              <li key={startup.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar seed={startup.name} size={32} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{startup.name}</div>
                    <div className="truncate text-xs text-white/40">{startup.pitch}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Chip tone="sky">readiness {Math.round(score.readiness)}</Chip>
                  <Link to={`/app/marketplace?focus=${startup.id}`} className="ghost-button !py-1 !px-3 text-xs">Invest</Link>
                </div>
              </li>
            ))}
          </ul>
        </Bento>

        <Bento tone="sky">
          <BentoHeader
            eyebrow="your market"
            title="Investor activity"
            right={<ChartIcon className="text-sky-400" />}
          />
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-white/[0.06] bg-ink-800/60 p-3">
              <div className="display-mono">your investments</div>
              <div className="mt-1 font-display text-2xl font-semibold">
                {state.investments.filter((i) => i.investorHandle === me).reduce((a, b) => a + b.amount, 0)}
              </div>
              <div className="display-mono">credits allocated</div>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-ink-800/60 p-3">
              <div className="display-mono">demand on you</div>
              <div className="mt-1 font-display text-2xl font-semibold text-neon-400">
                {state.investments
                  .filter((i) => myStartups.some((s) => s.startup.id === i.startupId))
                  .reduce((a, b) => a + b.amount, 0)}
              </div>
              <div className="display-mono">credits received</div>
            </div>
            <Link to="/app/leaderboard" className="sky-button w-full text-center">
              <RocketIcon /> Leaderboard
            </Link>
          </div>
        </Bento>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-ink-800/60 p-3">
      <div className="display-mono">{label}</div>
      <div className={`mt-1 font-display text-xl font-semibold ${tone}`}>{Math.round(value)}</div>
      <div className="mt-1 h-1 rounded-full bg-white/[0.06]">
        <div className={`h-1 rounded-full ${tone.replace('text', 'bg')} opacity-70`} style={{ width: Math.max(2, Math.min(100, value)) + '%' }} />
      </div>
    </div>
  );
}
