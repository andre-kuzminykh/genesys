import type { ArtifactStatus } from '@/domain/types';
import type { ReactNode } from 'react';

type Tone = 'neutral' | 'yellow' | 'sky' | 'green' | 'red' | 'amber' | 'violet';

const TONE: Record<Tone, string> = {
  neutral: 'chip-neutral',
  yellow: 'chip-yellow',
  sky: 'chip-sky',
  green: 'chip-green',
  red: 'chip-red',
  amber: 'chip-amber',
  violet: 'chip-violet',
};

export function Chip({
  tone = 'neutral',
  children,
  icon,
  className = '',
}: {
  tone?: Tone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <span className={`chip ${TONE[tone]} ${className}`}>
      {icon}
      <span>{children}</span>
    </span>
  );
}

export function StatusChip({ status }: { status: ArtifactStatus }) {
  const map: Record<ArtifactStatus, { tone: Tone; label: string }> = {
    DRAFT: { tone: 'neutral', label: 'DRAFT' },
    REVIEW_READY: { tone: 'sky', label: 'REVIEW' },
    APPROVED: { tone: 'green', label: 'APPROVED' },
    UPDATED: { tone: 'yellow', label: 'UPDATED' },
    DEPRECATED: { tone: 'amber', label: 'DEPRECATED' },
    REPLACED: { tone: 'violet', label: 'REPLACED' },
    OBSOLETE: { tone: 'red', label: 'OBSOLETE' },
    BLOCKED: { tone: 'red', label: 'BLOCKED' },
    PARTIAL: { tone: 'amber', label: 'PARTIAL' },
    FINAL: { tone: 'green', label: 'FINAL' },
  };
  const v = map[status];
  return <Chip tone={v.tone}>{v.label}</Chip>;
}
