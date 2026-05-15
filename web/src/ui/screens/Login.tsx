import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../AppStore';
import { Bento } from '../components/Bento';
import { Chip } from '../components/Chip';
import { Avatar } from '../components/Avatar';
import { Wordmark } from '../components/Wordmark';
import { GithubIcon, LockIcon, RocketIcon, ShieldIcon } from '../design/Icon';

export function Login() {
  const { login, state } = useStore();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const [handle, setHandle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const activeBatch = state.batches.find((b) => b.id === state.activeBatchId);
  const suggested = activeBatch?.allowlist ?? [];

  const submit = (h?: string) => {
    const value = (h ?? handle).trim();
    if (!value) {
      setError('Enter a GitHub handle.');
      return;
    }
    const r = login(value);
    if (!r.ok) {
      setError('This GitHub handle is not on the GENESYS-001 allowlist. Ask the admin to add it.');
      nav('/denied', { state: { handle: value } });
      return;
    }
    // After login: route the user to repo picker if they have no startups yet.
    const lowered = value.trim().toLowerCase();
    const mine = state.startups.filter((s) => s.ownerHandle === lowered);
    if (mine.length === 0) {
      nav('/onboarding/repo');
      return;
    }
    nav(loc.state?.from && loc.state.from !== '/login' ? loc.state.from : '/app');
  };

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 -z-10 grid-bg [mask-image:radial-gradient(900px_600px_at_50%_-20%,black,transparent_70%)]" />
      <div className="absolute -top-40 left-1/2 -z-10 h-[600px] w-[1200px] -translate-x-1/2 rounded-full bg-radial-neon blur-3xl opacity-90" />

      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-10 px-6 py-10 md:grid-cols-2">
        <div>
          <Link to="/" aria-label="Genesys home" className="mb-7 inline-block">
            <Wordmark size="md" />
          </Link>
          <Chip tone="yellow" icon={<RocketIcon size={12} />}>GENESYS-001 · May Cohort</Chip>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            One door in.
            <br />
            <span className="text-neon-400">GitHub only.</span>
          </h1>
          <p className="mt-5 max-w-md text-white/60">
            Genesys Studio uses GitHub as the single source of identity. For this demo cohort,
            only allowlisted handles can enter. Spec, repo, simulation and leaderboard all live
            behind one trust boundary.
          </p>

          <Bento className="mt-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldIcon className="text-sky-400" />
                <div className="font-display text-base">Allowlist preview</div>
              </div>
              <Chip tone="sky">batch: GENESYS-001</Chip>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {suggested.map((h) => (
                <button
                  key={h}
                  onClick={() => { setHandle(h); submit(h); }}
                  className="group flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-sm hover:border-neon-500/40 hover:bg-neon-500/[0.06]"
                  title="Click to login as this handle"
                >
                  <Avatar seed={h} size={22} />
                  <span className="font-mono text-xs">@{h}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-white/40">
              Demo shortcut — in production this view is hidden. Try `alice` (founder) or
              `admin` (admin console).
            </p>
          </Bento>
        </div>

        <div className="md:pl-10">
          <Bento padding="p-8" tone="yellow" className="glow-yellow">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-neon-500 text-ink-950 shadow-neon">
                <GithubIcon size={22} />
              </div>
              <div>
                <div className="font-display text-xl font-semibold">Sign in with GitHub</div>
                <div className="text-sm text-white/60">No password. No magic links. Just your repo identity.</div>
              </div>
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); submit(); }}
              className="mt-7 space-y-3"
            >
              <label className="label" htmlFor="handle">GitHub handle</label>
              <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-ink-800/60 px-3 py-2.5 focus-within:border-neon-500/60">
                <span className="text-white/40">@</span>
                <input
                  id="handle"
                  value={handle}
                  onChange={(e) => { setHandle(e.target.value); setError(null); }}
                  placeholder="your-github-handle"
                  className="flex-1 bg-transparent text-base outline-none placeholder:text-white/30"
                  autoFocus
                  autoComplete="off"
                />
                <LockIcon size={14} className="text-white/30" />
              </div>
              {error ? (
                <div className="rounded-xl border border-signal-red/40 bg-signal-red/10 px-3 py-2 text-sm text-signal-red">
                  {error}
                </div>
              ) : null}
              <button type="submit" className="neon-button mt-2 w-full text-base">
                <GithubIcon /> Continue
              </button>
              <div className="display-mono pt-2 text-center">
                MVP uses mocked GitHub auth · real OAuth in V1
              </div>
            </form>
          </Bento>
        </div>
      </div>
    </div>
  );
}
