import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../AppStore';
import { Bento } from '../components/Bento';
import { Wordmark } from '../components/Wordmark';
import { GithubIcon, LockIcon } from '../design/Icon';

export function Login() {
  const { login } = useStore();
  const nav = useNavigate();
  const [handle, setHandle] = useState('');
  const [error, setError] = useState<string | null>(null);

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
    // For the demo we always route to the repo picker after auth.
    nav('/onboarding/repo');
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
                  className="flex-1 bg-transparent outline-none placeholder:text-textsec"
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
              <button type="submit" className="neon-button mt-2 w-full">
                <GithubIcon /> Continue
              </button>
            </form>
          </Bento>
        </div>
      </div>
    </div>
  );
}
