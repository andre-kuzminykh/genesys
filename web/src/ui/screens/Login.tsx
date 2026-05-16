import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../AppStore';
import { Bento } from '../components/Bento';
import { Wordmark } from '../components/Wordmark';
import { GithubIcon } from '../design/Icon';

export function Login() {
  const { loginWithToken } = useStore();
  const nav = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [busyToken, setBusyToken] = useState(false);

  // Hidden escape hatch: if the OAuth backend isn't configured (CLIENT_ID/SECRET
  // missing on the VM), the cohort can still sign in by pasting a PAT. The form
  // is folded behind a small "?" button so it doesn't pollute the main flow.
  const submitToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setBusyToken(true);
    setError(null);
    const r = await loginWithToken(tokenInput.trim());
    setBusyToken(false);
    if (!r.ok) {
      if (r.reason === 'NOT_ON_ALLOWLIST') { nav('/denied'); return; }
      setError(r.reason === 'BAD_TOKEN' ? 'GitHub rejected this token.' : 'Network error contacting GitHub.');
      return;
    }
    nav('/onboarding/repo');
  };

  return (
    <div className="relative min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-10 px-6 py-10 md:grid-cols-2">
        <div>
          <Link to="/" aria-label="Genesys home" className="mb-7 inline-block">
            <Wordmark size="lg" />
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
                <div className="text-sm text-textsec">No password. No magic links.</div>
              </div>
            </div>

            <a href="/auth/github" className="neon-button mt-7 w-full text-base">
              <GithubIcon /> Continue with GitHub
            </a>

            {error ? (
              <div className="mt-3 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </div>
            ) : null}

            <details className="mt-4 text-xs text-textsec">
              <summary className="cursor-pointer hover:text-white">?</summary>
              <div className="mt-3 space-y-3">
                <p className="font-display text-sm font-bold text-white">Backup: paste a Personal Access Token</p>
                <ol className="list-decimal space-y-1 pl-5">
                  <li>Open <a className="text-neon-500 underline" href="https://github.com/settings/tokens" target="_blank" rel="noreferrer">github.com/settings/tokens</a></li>
                  <li>Generate new token (classic). Note: <em>Genesys demo</em>. Scope: <code className="font-mono">repo</code> for private repos or <code className="font-mono">public_repo</code> for public only.</li>
                  <li>Copy the token (starts with <code className="font-mono">ghp_</code>) and paste it below.</li>
                </ol>
                <form onSubmit={submitToken} className="flex items-center gap-2 rounded-2xl border border-surfaceLight bg-base px-3 py-2.5">
                  <input
                    value={tokenInput}
                    onChange={(e) => { setTokenInput(e.target.value); setError(null); }}
                    placeholder="ghp_… or github_pat_…"
                    className="flex-1 bg-transparent outline-none placeholder:text-textsec font-mono text-xs"
                    spellCheck={false}
                    autoComplete="off"
                  />
                  <button type="submit" disabled={busyToken || !tokenInput.trim()} className="rounded-full bg-surface px-3 py-1 text-xs font-bold disabled:opacity-50">
                    {busyToken ? '…' : 'Sign in'}
                  </button>
                </form>
              </div>
            </details>
          </Bento>
        </div>
      </div>
    </div>
  );
}
