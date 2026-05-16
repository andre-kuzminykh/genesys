type Size = 'sm' | 'md' | 'lg' | 'xl';

// font: type size for the lettering · cursorW/H: dimensions of the neon block ·
// gap: space between cursor and the first letter · descender: distance from
// the bottom of the line box to the typographic baseline (≈ font * 0.22 in
// Outfit Black; tuned visually).
const SIZES: Record<Size, { font: number; cursorW: number; cursorH: number; gap: number; descender: number }> = {
  sm: { font: 18, cursorW: 6,  cursorH: 2, gap: 4,  descender: 4  },
  md: { font: 26, cursorW: 8,  cursorH: 3, gap: 5,  descender: 6  },
  lg: { font: 42, cursorW: 12, cursorH: 4, gap: 8,  descender: 9  },
  xl: { font: 96, cursorW: 18, cursorH: 5, gap: 14, descender: 21 },
};

/**
 * Brand wordmark: blinking neon "_" cursor + lowercase "genesys" lettering.
 *
 * Layout: a single inline-block whose height equals the font-size (line-height
 * is forced to 1). The cursor is absolute-positioned from the bottom edge by
 * `descender` px, which lands it exactly on the typographic baseline of the
 * letters; descenders of "g/y" hang naturally below the cursor.
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
      className={`relative inline-block font-brand lowercase text-softblue ${className}`}
      style={{
        paddingLeft: withCursor ? s.cursorW + s.gap : 0,
        fontSize: s.font,
        lineHeight: 1,
        fontWeight: 900,
        letterSpacing: '-0.05em',
      }}
      aria-label="Genesys"
    >
      {withCursor ? (
        <span
          className={`absolute rounded-sm bg-neon-500 ${blink ? 'animate-cursorBlink' : ''}`}
          style={{
            left: 0,
            bottom: s.descender,
            width: s.cursorW,
            height: s.cursorH,
            boxShadow: '0 0 14px rgba(127,255,0,0.55)',
          }}
          aria-hidden
        />
      ) : null}
      genesys
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
