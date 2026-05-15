import { useState } from 'react';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<Size, { font: number; gap: number; cursorW: number; cursorH: number; cursorMb: number }> = {
  sm: { font: 18, gap: 8,  cursorW: 10, cursorH: 3, cursorMb: 4 },
  md: { font: 26, gap: 10, cursorW: 14, cursorH: 4, cursorMb: 5 },
  lg: { font: 42, gap: 14, cursorW: 22, cursorH: 5, cursorMb: 8 },
  xl: { font: 72, gap: 22, cursorW: 38, cursorH: 8, cursorMb: 14 },
};

/**
 * Brand wordmark.
 *
 * Layout: blinking neon "_" cursor → wordmark (image or CSS fallback).
 * Prefer /wordmark.png; if it 404s, falls back to a CSS-rendered Outfit 900 word.
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

  const Cursor = withCursor ? (
    <span
      className={`block rounded-sm bg-neon-500 ${blink ? 'animate-cursorBlink' : ''}`}
      style={{
        width: s.cursorW,
        height: s.cursorH,
        marginBottom: s.cursorMb,
        boxShadow: '0 0 16px rgba(127,255,0,0.55)',
      }}
      aria-hidden
    />
  ) : null;

  return (
    <div
      className={`inline-flex items-end font-brand lowercase leading-none ${className}`}
      style={{ gap: s.gap, fontSize: s.font }}
      aria-label="Genesys"
    >
      {Cursor}
      {imgOk ? (
        <img
          src="/wordmark.png"
          alt="Genesys"
          onError={() => setImgOk(false)}
          style={{ height: targetHeight, width: 'auto', display: 'block' }}
        />
      ) : (
        <span
          className="text-softblue"
          style={{ fontWeight: 900, letterSpacing: '-0.05em' }}
        >
          genesys
        </span>
      )}
    </div>
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
