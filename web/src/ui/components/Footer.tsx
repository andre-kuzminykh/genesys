/**
 * Site-wide footer — appears at the bottom of every public screen.
 *
 * Social hrefs are currently placeholders (`#`). Drop your real URLs into
 * SOCIALS below when you have them.
 */

const SOCIALS: Array<{ label: string; href: string; icon: JSX.Element }> = [
  { label: 'Telegram',  href: '#', icon: <TelegramIcon /> },
  { label: 'Website',   href: '#', icon: <GlobeIcon /> },
  { label: 'YouTube',   href: '#', icon: <YouTubeIcon /> },
  { label: 'LinkedIn',  href: '#', icon: <LinkedInIcon /> },
];

export function Footer() {
  return (
    <footer className="mt-12 border-t border-surfaceLight bg-base">
      <div className="mx-auto grid max-w-5xl grid-cols-[auto_1fr_auto] items-center gap-4 px-6 py-5">
        <div className="flex items-center gap-3">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              title={s.label}
              className="inline-flex items-center justify-center p-1 text-textsec transition hover:text-neon-500"
            >
              {s.icon}
            </a>
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 font-mono text-[11px] uppercase tracking-wider text-textsec">
          <a href="/terms" className="hover:text-neon-500">Terms</a>
          <a href="/privacy" className="hover:text-neon-500">Privacy</a>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-wider text-textsec">
          © {new Date().getFullYear()} Andre AI Technologies. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

// --- icon glyphs ---

function TelegramIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M21.5 3.5 2.5 11l5.6 1.9L18.4 6.7l-7.9 7.7v3.9l3.1-2.7 4.5 3.2L21.5 3.5z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx={12} cy={12} r={9} />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.1 5 12 5 12 5s-6.1 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.9 2 12 2 12s0 3.1.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.9 19 12 19 12 19s6.1 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.7.4-4.8.4-4.8s0-3.1-.4-4.8zM10 15V9l5 3-5 3z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5.001 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.04 0 4.78 2.66 4.78 6.12V21H17.6v-5.5c0-1.31-.03-3-1.83-3-1.83 0-2.1 1.43-2.1 2.9V21H9z" />
    </svg>
  );
}
