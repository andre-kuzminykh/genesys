/**
 * Borderless magic-wand button — used on every field that can be auto-filled
 * by the Build wizard's LLM assist. Renders only the sparkle glyph (no
 * background, no border, no chrome). Spins while busy.
 */

interface Props {
  onClick: () => void;
  busy?: boolean;
  title?: string;
  size?: number;
  className?: string;
}

export function MagicWand({ onClick, busy, title = 'Suggest with AI', size = 18, className = '' }: Props) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      disabled={busy}
      aria-label={title}
      title={title}
      className={`inline-flex items-center justify-center text-textsec transition hover:text-neon-500 disabled:opacity-50 ${className}`}
    >
      {busy ? (
        <span
          aria-hidden
          className="inline-block animate-spin rounded-full border-2 border-current border-t-transparent"
          style={{ width: size, height: size }}
        />
      ) : (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M3 21l9-9M12.2 6.2L11 5" />
        </svg>
      )}
    </button>
  );
}
