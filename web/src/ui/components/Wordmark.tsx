type Size = 'sm' | 'md' | 'lg' | 'xl';

// Rendered height in CSS px per size. width auto-scales from the image's
// intrinsic aspect ratio.
const HEIGHT: Record<Size, number> = {
  sm: 22,
  md: 32,
  lg: 56,
  xl: 128,
};

// Hosted brand asset. Drop a local copy at web/public/wordmark.png and
// switch the src to "/wordmark.png" to remove the external dependency.
const WORDMARK_URL =
  'https://i.ibb.co/nq3ppQVz/Chat-GPT-Image-May-16-2026-02-21-52-AM.png';

/**
 * Brand wordmark — a single raster picture. No programmatic text, no
 * absolute-positioned cursor. The asset is expected to contain the full
 * "_ genesys" lock-up already.
 *
 * The `withCursor` and `blink` props are kept for call-site compatibility
 * but are no-ops now that the cursor is baked into the artwork.
 */
export function Wordmark({
  size = 'md',
  className = '',
}: {
  size?: Size;
  className?: string;
  /** @deprecated cursor is baked into the artwork */
  blink?: boolean;
  /** @deprecated cursor is baked into the artwork */
  withCursor?: boolean;
}) {
  const h = HEIGHT[size];
  return (
    <img
      src={WORDMARK_URL}
      alt="Genesys"
      height={h}
      className={`inline-block align-middle ${className}`}
      style={{ height: h, width: 'auto', display: 'block' }}
      draggable={false}
    />
  );
}

/** Compact mark — just the neon cursor, for narrow chrome / favicons. */
export function WordmarkMark({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-block rounded-sm bg-neon-500 animate-cursorBlink ${className}`}
      style={{ width: size, height: Math.max(2, Math.round(size * 0.22)), boxShadow: '0 0 12px rgba(127,255,0,0.5)' }}
      aria-hidden
    />
  );
}
