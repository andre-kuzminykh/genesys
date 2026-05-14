import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from './AppStore';
import { Avatar } from './components/Avatar';
import {
  ChartIcon,
  CoinIcon,
  GithubIcon,
  RocketIcon,
  RouteIcon,
  ShieldIcon,
  ShopIcon,
  TrophyIcon,
} from './design/Icon';
import { useMemo } from 'react';
import { remainingCredits } from '@/domain/investments';

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
          isActive
            ? 'bg-white/[0.06] text-white shadow-[inset_0_0_0_1px_rgba(249,242,107,0.25)]'
            : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
        }`
      }
    >
      <span className="text-neon-400">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export function AppLayout() {
  const { state, logout } = useStore();
  const nav = useNavigate();
  const loc = useLocation();
  const session = state.session;

  const user = state.users.find((u) => u.handle === session?.handle);
  const isAdmin = user?.role === 'admin';

  const credits = useMemo(() => {
    if (!session) return 0;
    return remainingCredits(state, state.activeBatchId, session.handle);
  }, [state, session]);

  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr]">
      <aside className="border-r border-white/[0.06] bg-ink-900/40 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="relative">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-neon-500 text-ink-950 font-display font-bold">
              G
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-sky-400 animate-pulseGlow" />
          </div>
          <div>
            <div className="font-display text-sm font-semibold leading-tight">Genesys</div>
            <div className="display-mono">startup&nbsp;studio</div>
          </div>
        </div>

        <div className="px-3">
          <div className="px-2 pt-2 pb-2 label">batch</div>
          <div className="rounded-2xl border border-white/[0.06] bg-ink-800/60 px-3 py-2">
            <div className="text-sm text-white/80">
              {state.batches.find((b) => b.id === state.activeBatchId)?.name}
            </div>
            <div className="display-mono mt-1">b1 · active</div>
          </div>
        </div>

        <nav className="mt-5 flex flex-col gap-1 px-3">
          <div className="label px-2 pb-2">workspace</div>
          <NavItem to="/app" icon={<RocketIcon />} label="My Startups" />
          <NavItem to="/app/marketplace" icon={<ShopIcon />} label="Marketplace" />
          <NavItem to="/app/leaderboard" icon={<TrophyIcon />} label="Leaderboard" />
          <NavItem to="/app/portfolio" icon={<CoinIcon />} label="Portfolio" />
          {isAdmin ? (
            <>
              <div className="label px-2 pb-2 pt-4">admin</div>
              <NavItem to="/admin" icon={<ShieldIcon />} label="Console" />
            </>
          ) : null}
        </nav>

        <div className="absolute bottom-0 w-[260px] border-t border-white/[0.06] bg-ink-900/60 backdrop-blur-xl">
          {session ? (
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar seed={session.handle} size={36} />
                <div className="min-w-0">
                  <div className="truncate text-sm text-white">{user?.name ?? session.handle}</div>
                  <div className="flex items-center gap-1 text-xs text-white/40">
                    <GithubIcon size={12} />
                    <span className="truncate">@{session.handle}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => { logout(); nav('/'); }}
                className="ghost-button !py-1.5 !px-2 text-xs"
                aria-label="Log out"
                title="Log out"
              >
                exit
              </button>
            </div>
          ) : null}
        </div>
      </aside>

      <main className="relative min-h-screen">
        <div className="absolute inset-0 -z-10 grid-bg [mask-image:linear-gradient(180deg,black,transparent_80%)]" />
        <Topbar credits={credits} path={loc.pathname} />
        <div className="px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function Topbar({ credits, path }: { credits: number; path: string }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/[0.06] bg-ink-950/60 px-8 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-sm text-white/50">
        <RouteIcon size={14} className="text-neon-400" />
        <span className="font-mono text-xs text-white/40">{path}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5">
          <CoinIcon size={14} className="text-neon-400" />
          <span className="font-mono text-sm">{credits}</span>
          <span className="text-xs text-white/40">credits</span>
        </div>
        <div className="hidden md:flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5">
          <ChartIcon size={14} className="text-sky-400" />
          <span className="text-xs text-white/50">b1 · live market</span>
        </div>
      </div>
    </header>
  );
}
