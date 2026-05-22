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
    <div className="fixed inset-x-0 bottom-4 z-40 px-4">
      <div
        role="dialog"
        aria-label="Cookie notice"
        className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-surfaceLight bg-surface px-4 py-3 shadow-2xl backdrop-blur-md"
      >
        <p className="flex-1 text-xs leading-snug text-textsec">
          We use localStorage to keep your GitHub session, wallet and votes. No tracking, no ads.
        </p>
        <button
          type="button"
          onClick={accept}
          className="shrink-0 neon-button !px-4 !py-1.5 text-sm"
        >
          OK
        </button>
      </div>
    </div>
  );
}
