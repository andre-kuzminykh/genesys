function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const PALETTE = [
  ['#D5FF00', '#82A0FF'],
  ['#82A0FF', '#B698FF'],
  ['#FFB05A', '#5EE6A8'],
  ['#FF4B4B', '#D5FF00'],
  ['#5EE6A8', '#82A0FF'],
  ['#B698FF', '#E3FF33'],
];

export function Avatar({ seed, size = 36 }: { seed: string; size?: number }) {
  const h = hashCode(seed || '?');
  const pair = PALETTE[h % PALETTE.length]!;
  const initials = (seed.slice(0, 2) || '?').toUpperCase();
  return (
    <div
      className="grid place-items-center rounded-2xl font-display text-ink-950 font-semibold shrink-0"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${pair[0]} 0%, ${pair[1]} 100%)`,
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset',
        fontSize: Math.round(size * 0.36),
      }}
    >
      {initials}
    </div>
  );
}
