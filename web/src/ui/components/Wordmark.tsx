import { useState } from 'react';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<Size, { font: number; cursorW: number; cursorH: number; gap: number }> = {
  sm: { font: 18, cursorW: 6,  cursorH: 2, gap: 5 },
  md: { font: 26, cursorW: 8,  cursorH: 3, gap: 6 },
  lg: { font: 42, cursorW: 12, cursorH: 4, gap: 8 },
  xl: { font: 96, cursorW: 18, cursorH: 5, gap: 14 },
};

/**
 * Brand wordmark: blinking neon "_" cursor next to "genesys" lettering.
 *
 * Layout uses inline-flex with align-items: baseline so the cursor's bottom
 * sits on the typographic baseline of the lowercase letters (descenders of
 * "g/y" hang below the cursor, which is exactly the underscore aesthetic).
 *
 * Renders /wordmark.png if present, otherwise falls back to a CSS-rendered
 * Outfit 900 lowercase wordmark.
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
  const [imgOk, setImgOk] = useState(true);

  return (
    <span
      className={`inline-flex items-baseline font-brand lowercase leading-none ${className}`}
      style={{ gap: withCursor ? s.gap : 0 }}
      aria-label="Genesys"
    >
      {withCursor ? (
        <span
          className={`inline-block rounded-sm bg-neon-500 ${blink ? 'animate-cursorBlink' : ''}`}
          style={{
            width: s.cursorW,
            height: s.cursorH,
            boxShadow: '0 0 14px rgba(127,255,0,0.55)',
          }}
          aria-hidden
        />
      ) : null}
      {imgOk ? (
        <img
          src="/wordmark.png"
          alt="Genesys"
          onError={() => setImgOk(false)}
          style={{ height: s.font, width: 'auto', display: 'block' }}
        />
      ) : (
        <span
          className="text-softblue"
          style={{ fontSize: s.font, fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1 }}
        >
          genesys
        </span>
      )}
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
