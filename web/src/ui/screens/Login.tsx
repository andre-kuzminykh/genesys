import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../AppStore';
import { Bento } from '../components/Bento';
import { Chip } from '../components/Chip';
import { Avatar } from '../components/Avatar';
import { Wordmark } from '../components/Wordmark';
import { GithubIcon, LockIcon, ShieldIcon } from '../design/Icon';

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
      setError('This GitHub handle is not on the allowlist. Ask the admin to add it.');
      nav('/denied', { state: { handle: value } });
      return;
    }
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
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-10 px-6 py-10 md:grid-cols-2">
        <div>
          <Link to="/" aria-label="Genesys home" className="mb-7 inline-block">
            <Wordmark size="md" />
          </Link>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            One door in.
            <br />
            <span className="text-neon-500">GitHub only.</span>
          </h1>
          <p className="mt-5 max-w-md text-textsec">
            Genesys Studio uses GitHub as the single source of identity. For this demo cohort,
            only allowlisted handles can enter. Spec, repo, simulation and leaderboard all live
            behind one trust boundary.
          </p>

          <Bento className="mt-8" padding="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldIcon className="text-softblue" />
                <div className="font-display text-base font-bold">Allowlist preview</div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {suggested.map((h) => (
                <button
                  key={h}
                  onClick={() => { setHandle(h); submit(h); }}
                  className="group flex items-center gap-2 rounded-2xl border border-surfaceLight bg-base px-2.5 py-1.5 text-sm transition hover:border-neon-500/40 hover:bg-neon-500/[0.06]"
                  title="Click to login as this handle"
                >
                  <Avatar seed={h} size={22} />
                  <span className="font-mono text-xs">@{h}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-textsec">
              Demo shortcut — in production this view is hidden. Try <code className="font-mono">alice</code> (founder) or
              <code className="font-mono"> admin</code> (admin console).
            </p>
          </Bento>
        </div>

        <div className="md:pl-10">
          <Bento padding="p-8" className="glow-yellow">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-neon-500 text-ink shadow-neon">
                <GithubIcon size={22} />
              </div>
              <div>
                <div className="font-display text-xl font-extrabold">Sign in with GitHub</div>
                <div className="text-sm text-textsec">No password. No magic links. Just your repo identity.</div>
              </div>
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); submit(); }}
              className="mt-7 space-y-3"
            >
              <label className="label" htmlFor="handle">GitHub handle</label>
              <div className="flex items-center gap-2 rounded-2xl border border-surfaceLight bg-base px-3 py-2.5 focus-within:border-neon-500/60">
                <span className="text-textsec">@</span>
                <input
                  id="handle"
                  value={handle}
                  onChange={(e) => { setHandle(e.target.value); setError(null); }}
                  placeholder="your-github-handle"
                  className="flex-1 bg-transparent text-base outline-none placeholder:text-textsec"
                  autoFocus
                  autoComplete="off"
                />
                <LockIcon size={14} className="text-textsec" />
              </div>
              {error ? (
                <div className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
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
