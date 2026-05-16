type Size = 'sm' | 'md' | 'lg' | 'xl';

// Rendered height in CSS px per size. The SVG keeps a fixed 4:1 aspect ratio
// (100×25 viewBox), so width = height * 4.
const HEIGHT: Record<Size, number> = {
  sm: 18,
  md: 26,
  lg: 42,
  xl: 96,
};

/**
 * Brand wordmark rendered as an inline SVG image: a neon cursor block sitting
 * on the typographic baseline of the lowercase "genesys" lettering.
 *
 * Inline SVG (not <img src="*.svg">) is used on purpose — the document's
 * Outfit Black @font-face is inherited by inline SVG, while an external SVG
 * loaded as an image would not have access to those fonts and would degrade
 * to a system sans-serif.
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
  const h = HEIGHT[size];
  return (
    <svg
      role="img"
      aria-label="Genesys"
      width={h * 4}
      height={h}
      viewBox="0 0 100 25"
      preserveAspectRatio="xMinYMid meet"
      className={`inline-block align-middle ${className}`}
    >
      {withCursor ? (
        <rect
          x={0}
          y={18}
          width={5}
          height={2}
          rx={0.5}
          fill="#7FFF00"
          className={blink ? 'animate-cursorBlink' : ''}
        />
      ) : null}
      <text
        x={8}
        y={20}
        fontFamily="Outfit, Inter, system-ui, sans-serif"
        fontWeight={900}
        fontSize={22}
        letterSpacing="-1"
        fill="#82A0FF"
      >
        genesys
      </text>
    </svg>
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
