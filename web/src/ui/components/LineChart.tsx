type Series = {
  id: string;
  label: string;
  color: string;
  points: number[]; // y values, length == labels.length
};

type Props = {
  labels: string[];
  series: Series[];
  height?: number;
  yLabel?: string;
  formatY?: (v: number) => string;
  /** highlight a specific series (others fade) */
  focusId?: string | null;
  onFocus?: (id: string | null) => void;
};

const PAD_L = 56;
const PAD_R = 16;
const PAD_T = 14;
const PAD_B = 30;

function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const order = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / order;
  if (m <= 1) return order;
  if (m <= 2) return 2 * order;
  if (m <= 5) return 5 * order;
  return 10 * order;
}

export function LineChart({ labels, series, height = 260, yLabel, formatY, focusId, onFocus }: Props) {
  const W = 760;
  const H = height;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const max = niceCeil(Math.max(1, ...series.flatMap((s) => s.points)));
  const xs = labels.map((_, i) => PAD_L + (innerW * i) / Math.max(1, labels.length - 1));
  const yOf = (v: number) => PAD_T + innerH - (v / max) * innerH;

  const yTicks = 4;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) => (max * i) / yTicks);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full h-auto" role="img" aria-label="line chart">
      {/* y grid */}
      {tickValues.map((v, i) => {
        const y = yOf(v);
        return (
          <g key={i}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="2 4" />
            <text x={PAD_L - 8} y={y + 4} textAnchor="end" fontSize="10" fill="rgba(160,168,198,0.9)" fontFamily="JetBrains Mono">
              {formatY ? formatY(v) : Math.round(v).toLocaleString()}
            </text>
          </g>
        );
      })}

      {/* x labels */}
      {labels.map((l, i) => (
        <text key={i} x={xs[i]} y={H - 8} textAnchor="middle" fontSize="10" fill="rgba(160,168,198,0.85)" fontFamily="JetBrains Mono">
          {l.slice(2).replace('-', '/')}
        </text>
      ))}

      {/* y label */}
      {yLabel ? (
        <text x={6} y={PAD_T + 6} fontSize="9" fill="rgba(160,168,198,0.85)" fontFamily="JetBrains Mono">{yLabel}</text>
      ) : null}

      {/* series */}
      {series.map((s) => {
        const isOn = !focusId || focusId === s.id;
        const op = isOn ? 1 : 0.18;
        const path = s.points
          .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xs[i]} ${yOf(v)}`)
          .join(' ');
        return (
          <g key={s.id} opacity={op}>
            <path d={path} stroke={s.color} strokeWidth={isOn ? 2.5 : 1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            {s.points.map((v, i) => (
              <circle
                key={i}
                cx={xs[i]}
                cy={yOf(v)}
                r={isOn ? 2.5 : 1.5}
                fill={s.color}
                onMouseEnter={() => onFocus?.(s.id)}
                onMouseLeave={() => onFocus?.(null)}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export function ChartLegend({
  series,
  focusId,
  onFocus,
}: {
  series: { id: string; label: string; color: string }[];
  focusId?: string | null;
  onFocus?: (id: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {series.map((s) => {
        const dim = focusId && focusId !== s.id;
        return (
          <button
            key={s.id}
            onMouseEnter={() => onFocus?.(s.id)}
            onMouseLeave={() => onFocus?.(null)}
            className={`inline-flex items-center gap-1.5 rounded-full border border-surfaceLight px-2.5 py-1 text-xs transition ${dim ? 'opacity-40' : ''}`}
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <span className="font-mono">{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}
