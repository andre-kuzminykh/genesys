import { useEffect, useState } from 'react';

const STORAGE_KEY = 'genesys:cookie-acked:v1';

/**
 * One-time cookie / privacy notice. Sits in the bottom-left corner until the
 * visitor clicks OK; after that the choice persists in localStorage and the
 * banner stays gone for that browser.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const acked = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : '1';
      if (!acked) setVisible(true);
    } catch {
      // localStorage blocked — show the banner conservatively.
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
      className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-2xl rounded-2xl border border-surfaceLight bg-surface px-5 py-4 shadow-2xl backdrop-blur-md md:left-6 md:right-auto md:max-w-md"
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 text-sm leading-relaxed text-textsec">
          We use a single cookie-equivalent (localStorage) to keep your GitHub
          session, your wallet and your votes between visits. No tracking, no
          ads. See <a href="/privacy" className="text-neon-500 hover:underline">Privacy</a> + <a href="/terms" className="text-neon-500 hover:underline">Terms</a>.
        </div>
        <button
          type="button"
          onClick={accept}
          className="neon-button !px-5 !py-2 text-sm"
        >
          OK
        </button>
      </div>
    </div>
  );
}
