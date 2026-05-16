type Size = 'sm' | 'md' | 'lg' | 'xl';

// Cursor sits at the visual baseline of the lowercase "n/e/s" — descenders
// of "g/y" hang below it, matching how a terminal underscore reads.
// Empirically ~22% of font-size in Outfit Black with leading-none.
const SIZES: Record<Size, { font: number; cursorW: number; cursorH: number; cursorBottom: number; pl: number }> = {
  sm: { font: 18, cursorW: 6,  cursorH: 2, cursorBottom: 4,  pl: 11 },
  md: { font: 26, cursorW: 8,  cursorH: 3, cursorBottom: 6,  pl: 14 },
  lg: { font: 42, cursorW: 12, cursorH: 4, cursorBottom: 9,  pl: 20 },
  xl: { font: 96, cursorW: 18, cursorH: 5, cursorBottom: 21, pl: 30 },
};

/**
 * Brand wordmark: blinking neon "_" cursor anchored to the typography baseline
 * of an Outfit 900 "genesys" lowercase wordmark.
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
      className={`relative inline-block font-brand lowercase leading-none ${className}`}
      style={{ paddingLeft: withCursor ? s.pl : 0 }}
      aria-label="Genesys"
    >
      {withCursor ? (
        <span
          className={`absolute left-0 rounded-sm bg-neon-500 ${blink ? 'animate-cursorBlink' : ''}`}
          style={{
            width: s.cursorW,
            height: s.cursorH,
            bottom: s.cursorBottom,
            boxShadow: '0 0 14px rgba(127,255,0,0.55)',
          }}
          aria-hidden
        />
      ) : null}
      <span
        className="block text-softblue"
        style={{ fontSize: s.font, fontWeight: 900, letterSpacing: '-0.05em' }}
      >
        genesys
      </span>
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
