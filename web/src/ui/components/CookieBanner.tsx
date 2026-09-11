import { useEffect, useState } from 'react';

const STORAGE_KEY = 'genesys:cookie-acked:v1';

/**
 * One-time cookie / privacy notice. Spans the full footer width, sits at the
 * bottom of the viewport, and goes away forever once the visitor clicks OK.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const acked = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : '1';
      if (!acked) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function accept() {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch { /* ignore */ }
    setVisible(false);
  }

  if (!visible) return null;
  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className="fixed bottom-4 left-4 right-4 z-40 mx-auto flex max-w-xs items-center gap-2 rounded-2xl border border-surfaceLight bg-surface px-3 py-2 shadow-2xl backdrop-blur-md md:left-auto md:right-4 md:mx-0"
    >
      <p className="flex-1 text-[11px] leading-snug text-textsec">
        We use localStorage for your session, wallet and votes. No tracking.
      </p>
      <button
        type="button"
        onClick={accept}
        className="shrink-0 rounded-full bg-neon-500 px-3 py-1 text-xs font-bold text-ink shadow-neon transition hover:bg-neon-400"
      >
        OK
      </button>
    </div>
  );
}
