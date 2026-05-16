import { useState } from 'react';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<Size, { font: number; cursorW: number; cursorH: number; cursorBottom: number; pl: number }> = {
  sm: { font: 18, cursorW: 6,  cursorH: 2, cursorBottom: 2,  pl: 12 },
  md: { font: 26, cursorW: 8,  cursorH: 3, cursorBottom: 3,  pl: 16 },
  lg: { font: 42, cursorW: 12, cursorH: 4, cursorBottom: 5,  pl: 22 },
  xl: { font: 96, cursorW: 18, cursorH: 5, cursorBottom: 10, pl: 32 },
};

/**
 * Brand wordmark: blinking neon "_" cursor positioned absolutely in front of
 * the wordmark (image when /wordmark.png is present, CSS-rendered Outfit 900
 * fallback otherwise).
 *
 * Absolute-positioning the cursor avoids the inline-flex baseline issue we hit
 * when the wordmark image and the cursor have very different intrinsic heights.
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
  const targetHeight = Math.round(s.font * 1.15);

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
      {imgOk ? (
        <img
          src="/wordmark.png"
          alt="Genesys"
          onError={() => setImgOk(false)}
          style={{ height: targetHeight, width: 'auto', display: 'block' }}
        />
      ) : (
        <span
          className="block text-softblue"
          style={{ fontSize: s.font, fontWeight: 900, letterSpacing: '-0.05em' }}
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
