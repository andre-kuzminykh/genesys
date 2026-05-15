type Size = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<Size, { font: number; gap: number; cursorW: number; cursorH: number; cursorMb: number }> = {
  sm: { font: 18, gap: 8,  cursorW: 12, cursorH: 3, cursorMb: 4 },
  md: { font: 26, gap: 10, cursorW: 18, cursorH: 4, cursorMb: 5 },
  lg: { font: 42, gap: 14, cursorW: 28, cursorH: 6, cursorMb: 8 },
  xl: { font: 72, gap: 22, cursorW: 46, cursorH: 9, cursorMb: 14 },
};

/**
 * Brand wordmark — neon "_" cursor + soft-blue lowercase "genesys".
 * The cursor blinks like a terminal prompt.
 */
export function Wordmark({
  size = 'md',
  className = '',
  blink = true,
}: {
  size?: Size;
  className?: string;
  blink?: boolean;
}) {
  const s = SIZES[size];
  return (
    <div
      className={`inline-flex items-end font-brand lowercase leading-none ${className}`}
      style={{ fontSize: s.font, gap: s.gap }}
      aria-label="Genesys"
    >
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
      <span
        className="text-softblue"
        style={{ letterSpacing: '0.02em' }}
      >
        genesys
      </span>
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
