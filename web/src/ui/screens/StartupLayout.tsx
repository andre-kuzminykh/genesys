import { NavLink, Outlet, useParams } from 'react-router-dom';
import { useStartup, useSpec, useStore } from '../AppStore';
import { Bento } from '../components/Bento';
import { Chip } from '../components/Chip';
import { Avatar } from '../components/Avatar';
import {
  ChartIcon,
  FlaskIcon,
  GithubIcon,
  HistoryIcon,
  RouteIcon,
  ShopIcon,
  SpecIcon,
  SparkleIcon,
  TraceIcon,
} from '../design/Icon';
import { useScoreFor } from '../hooks';

const TABS = [
  { to: 'spec', label: 'Spec', icon: <SpecIcon /> },
  { to: 'trace', label: 'Trace', icon: <TraceIcon /> },
  { to: 'architecture', label: 'Architecture', icon: <RouteIcon /> },
  { to: 'history', label: 'History', icon: <HistoryIcon /> },
  { to: 'repo', label: 'Repo', icon: <GithubIcon /> },
  { to: 'health', label: 'Health', icon: <ChartIcon /> },
  { to: 'showcase', label: 'Showcase', icon: <ShopIcon /> },
];

export function StartupLayout() {
  const { id } = useParams<{ id: string }>();
  const startup = useStartup(id);
  const spec = useSpec(id);
  const score = useScoreFor(id ?? '');
  const { togglePublished } = useStore();

  if (!startup || !spec) {
    return <div className="p-6 text-white/60">Startup not found.</div>;
  }

  return (
    <div className="space-y-5">
      <Bento>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar seed={startup.name} size={56} />
            <div>
              <div className="display-mono">{startup.category}</div>
              <div className="font-display text-2xl font-semibold leading-tight">{startup.name}</div>
              <div className="mt-1 max-w-xl text-sm text-white/60">{startup.pitch}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Chip tone="yellow">{startup.currentMode}</Chip>
            <Chip tone={startup.published ? 'green' : 'neutral'}>{startup.published ? 'PUBLISHED' : 'DRAFT'}</Chip>
            <button
              onClick={() => togglePublished(startup.id, !startup.published)}
              className={startup.published ? 'ghost-button' : 'neon-button'}
            >
              {startup.published ? 'Unpublish' : 'Publish'}
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
          <Pill label="Spec" value={score?.specCompleteness ?? 0} tone="neon-400" />
          <Pill label="Trace" value={score?.traceCoverage ?? 0} tone="sky-400" />
          <Pill label="Persona" value={score?.personaSatisfaction ?? 0} tone="signal-violet" />
          <Pill label="Demand" value={score?.investorDemand ?? 0} tone="signal-amber" />
          <Pill label="Readiness" value={score?.readiness ?? 0} tone="neon-400" highlight />
        </div>

        <nav className="mt-5 flex flex-wrap gap-1 rounded-2xl bg-ink-800/60 p-1">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm transition ${
                  isActive ? 'bg-neon-500 text-ink-950 font-medium shadow-neon' : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                }`
              }
            >
              <span>{t.icon}</span> {t.label}
            </NavLink>
          ))}
        </nav>
      </Bento>

      <Outlet />
    </div>
  );
}

function Pill({ label, value, tone, highlight = false }: { label: string; value: number; tone: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border ${highlight ? 'border-neon-500/40 bg-neon-500/[0.06]' : 'border-white/[0.06] bg-ink-800/60'} px-3 py-2`}>
      <div className="display-mono">{label}</div>
      <div className={`mt-0.5 font-display text-2xl font-semibold text-${tone}`}>{Math.round(value)}</div>
    </div>
  );
}
