type Size = 'sm' | 'md' | 'lg' | 'xl';

// Picture height in CSS px + cursor dimensions per size. The cursor sits
// to the LEFT of the image and aligns with the image's bottom edge, lifted
// by `cursorMb` so it lands near the typographic baseline of the lettering
// inside the artwork.
const SIZES: Record<Size, { h: number; cursorW: number; cursorH: number; cursorMb: number; gap: number }> = {
  sm: { h: 22,  cursorW: 5,  cursorH: 2, cursorMb: 3,  gap: 4 },
  md: { h: 32,  cursorW: 7,  cursorH: 2, cursorMb: 5,  gap: 6 },
  lg: { h: 56,  cursorW: 12, cursorH: 3, cursorMb: 9,  gap: 10 },
  xl: { h: 128, cursorW: 26, cursorH: 6, cursorMb: 20, gap: 20 },
};

// Hosted brand asset. Drop a local copy at web/public/wordmark.png and
// switch the src to "/wordmark.png" to remove the external dependency.
const WORDMARK_URL =
  'https://i.ibb.co/nq3ppQVz/Chat-GPT-Image-May-16-2026-02-21-52-AM.png';

/**
 * Brand wordmark — a raster picture of the "genesys" lettering with a
 * blinking neon cursor rendered next to it in CSS.
 *
 * The cursor is a separate element (not baked into the artwork) so the
 * blink animation can drive it. The artwork is bottom-aligned with the
 * cursor via `align-items: flex-end`; the cursor gets a small bottom
 * margin so it lands on the typographic baseline of the lettering.
 */
export function Wordmark({
  size = 'md',
  className = '',
  blink = true,
  withCursor = true,
}: {
  size?: Size;
  className?: string;
  blink?: boolean;
  withCursor?: boolean;
}) {
  const s = SIZES[size];
  return (
    <span
      className={`inline-flex items-end align-middle ${className}`}
      style={{ gap: withCursor ? s.gap : 0 }}
      aria-label="Genesys"
    >
      {withCursor ? (
        <span
          aria-hidden
          className={`block rounded-sm bg-neon-500 ${blink ? 'animate-cursorBlink' : ''}`}
          style={{
            width: s.cursorW,
            height: s.cursorH,
            marginBottom: s.cursorMb,
            boxShadow: '0 0 14px rgba(127,255,0,0.55)',
          }}
        />
      ) : null}
      <img
        src={WORDMARK_URL}
        alt="Genesys"
        height={s.h}
        style={{ height: s.h, width: 'auto', display: 'block' }}
        draggable={false}
      />
    </span>
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
