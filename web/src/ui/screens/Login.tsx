import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../AppStore';
import { Bento } from '../components/Bento';
import { Wordmark } from '../components/Wordmark';
import { GithubIcon, LockIcon } from '../design/Icon';
import { looksLikePAT } from '@/domain/github';

export function Login() {
  const { login, loginWithToken } = useStore();
  const nav = useNavigate();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (!v) { setError('Enter a GitHub token or, for the demo, a handle.'); return; }
    setError(null);

    if (looksLikePAT(v)) {
      setBusy(true);
      try {
        const r = await loginWithToken(v);
        setBusy(false);
        if (!r.ok) {
          if (r.reason === 'NOT_ON_ALLOWLIST') {
            nav('/denied');
            return;
          }
          if (r.reason === 'BAD_TOKEN') {
            setError('GitHub rejected this token. Re-check or regenerate it on github.com/settings/tokens.');
            return;
          }
          setError('Network error contacting GitHub. ' + (r.message ?? ''));
          return;
        }
        nav('/onboarding/repo');
        return;
      } catch (err: any) {
        setBusy(false);
        setError(String(err?.message ?? err));
        return;
      }
    }

    // Demo handle fallback (no token = mock identity, only allowlisted handles).
    const r = login(v);
    if (!r.ok) {
      setError('This handle is not on the allowlist.');
      nav('/denied', { state: { handle: v } });
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
                <div className="text-sm text-textsec">Paste your Personal Access Token (PAT).</div>
              </div>
            </div>

            <a href="/auth/github" className="neon-button mt-6 w-full text-base">
              <GithubIcon /> Continue with GitHub
            </a>
            <div className="display-mono text-center">redirects to github.com · returns signed-in</div>

            <div className="my-5 flex items-center gap-3 text-xs text-textsec">
              <span className="h-px flex-1 bg-surfaceLight" />
              <span>or paste a token / demo handle</span>
              <span className="h-px flex-1 bg-surfaceLight" />
            </div>

            <form onSubmit={submit} className="space-y-3">
              <label className="label" htmlFor="ghtoken">GitHub token or handle</label>
              <div className="flex items-center gap-2 rounded-2xl border border-surfaceLight bg-base px-3 py-2.5 focus-within:border-neon-500/60">
                <span className="text-textsec">@</span>
                <input
                  id="ghtoken"
                  value={value}
                  onChange={(e) => { setValue(e.target.value); setError(null); }}
                  placeholder="ghp_… or github_pat_… or a handle"
                  className="flex-1 bg-transparent outline-none placeholder:text-textsec"
                  autoComplete="off"
                  spellCheck={false}
                />
                <LockIcon size={14} className="text-textsec" />
              </div>

              {error ? (
                <div className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                  {error}
                </div>
              ) : null}

              <button type="submit" disabled={busy} className="ghost-button mt-2 w-full disabled:opacity-60">
                {busy ? 'Verifying…' : 'Continue'}
              </button>

              <details className="text-xs text-textsec">
                <summary className="cursor-pointer hover:text-white">How to get a token</summary>
                <ol className="mt-2 list-decimal space-y-1 pl-5">
                  <li>Open <a className="text-neon-500 underline" href="https://github.com/settings/tokens" target="_blank" rel="noreferrer">github.com/settings/tokens</a></li>
                  <li>Generate new token (classic). Note: <em>Genesys demo</em>. Scope: <code className="font-mono">repo</code> (private) or <code className="font-mono">public_repo</code> (public only).</li>
                  <li>Copy the token (starts with <code className="font-mono">ghp_</code>) and paste it here.</li>
                </ol>
              </details>

              <details className="text-xs text-textsec">
                <summary className="cursor-pointer hover:text-white">Demo without a token</summary>
                <p className="mt-2">
                  Type a seeded handle in the field above instead of a token —
                  <code className="font-mono"> alice</code>, <code className="font-mono">admin</code>,
                  <code className="font-mono"> andre-kuzminykh</code>… The flow stays the same but the
                  repo list comes from mocked data.
                </p>
              </details>
            </form>
          </Bento>
        </div>
      </div>
    </div>
  );
}
