import { type ReactNode } from 'react';

type Tone = 'default' | 'yellow' | 'sky' | 'violet';

const toneRing: Record<Tone, string> = {
  default: 'border-white/[0.06]',
  yellow: 'border-neon-500/30',
  sky: 'border-sky-500/30',
  violet: 'border-signal-violet/30',
};

export function Bento({
  children,
  className = '',
  tone = 'default',
  padding = 'p-5',
}: {
  children: ReactNode;
  className?: string;
  tone?: Tone;
  padding?: string;
}) {
  return (
    <div
      className={`bento ${padding} ${toneRing[tone]} ${className}`}
    >
      {children}
    </div>
  );
}

export function BentoHeader({
  eyebrow,
  title,
  right,
}: {
  eyebrow?: string;
  title: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        {eyebrow ? <div className="display-mono mb-2">{eyebrow}</div> : null}
        <h3 className="font-display text-lg font-medium tracking-tight text-white">{title}</h3>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}
