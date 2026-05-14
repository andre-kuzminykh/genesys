type Props = {
  value: number; // 0..100
  label?: string;
  size?: number; // px
  thickness?: number;
  tone?: 'yellow' | 'sky' | 'green' | 'violet';
  sublabel?: string;
};

const COLOR: Record<NonNullable<Props['tone']>, string> = {
  yellow: '#F9F26B',
  sky: '#7AB6FF',
  green: '#5EE6A8',
  violet: '#B698FF',
};

export function ScoreRing({ value, label, sublabel, size = 120, thickness = 10, tone = 'yellow' }: Props) {
  const v = Math.max(0, Math.min(100, value));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const dash = (v / 100) * c;
  const stroke = COLOR[tone];

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={thickness}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={stroke}
            strokeWidth={thickness}
            fill="none"
            strokeLinecap="round"
            style={{
              strokeDasharray: c,
              strokeDashoffset: c - dash,
              transition: 'stroke-dashoffset 600ms ease',
              filter: `drop-shadow(0 0 8px ${stroke}66)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-display text-2xl font-semibold text-white">{Math.round(v)}</div>
          {sublabel ? <div className="display-mono">{sublabel}</div> : null}
        </div>
      </div>
      {label ? <div className="text-sm text-white/60">{label}</div> : null}
    </div>
  );
}
