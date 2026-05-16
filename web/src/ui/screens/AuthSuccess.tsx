import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../AppStore';
import { Wordmark } from '../components/Wordmark';
import { SparkleIcon } from '../design/Icon';

export function AuthSuccess() {
  const { loginWithToken } = useStore();
  const nav = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get('token');
    if (!token) {
      setError('No token in callback URL. Try signing in again.');
      return;
    }
    // wipe the token from the fragment ASAP so the back button doesn't show it
    history.replaceState(null, '', '/auth/success');
    (async () => {
      const r = await loginWithToken(token);
      if (!r.ok) {
        if (r.reason === 'NOT_ON_ALLOWLIST') nav('/denied');
        else setError(r.message ?? 'GitHub rejected the token.');
        return;
      }
      nav('/onboarding/repo');
    })();
  }, [loginWithToken, nav]);

  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="text-center">
        <Wordmark size="xl" />
        <div className="mt-8 flex items-center justify-center gap-2 text-textsec">
          <span className="inline-flex h-2 w-2 rounded-full bg-signal-green animate-pulseGlow" />
          <SparkleIcon className="text-neon-500" />
          <span>Signing you in with GitHub…</span>
        </div>
        {error ? (
          <div className="mx-auto mt-6 max-w-md rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
