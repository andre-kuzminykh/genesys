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
        className="mx-auto max-w-5xl rounded-2xl border border-surfaceLight bg-surface p-5 shadow-2xl backdrop-blur-md"
      >
        <p className="text-center text-sm leading-relaxed text-textsec">
          We use a single cookie-equivalent (localStorage) to keep your GitHub
          session, your wallet and your votes between visits. No tracking, no ads.
        </p>
        <button
          type="button"
          onClick={accept}
          className="neon-button mt-4 w-full !py-3 text-lg"
        >
          OK
        </button>
      </div>
    </div>
  );
}
