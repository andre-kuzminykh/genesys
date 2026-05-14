import type { Mode, ProductSpec } from './types';
import { nodesByKind } from './spec';

export interface ModeStatus {
  mode: Mode;
  label: string;
  description: string;
  ready: boolean;
  reason?: string;
}

const LABELS: Record<Mode, { label: string; description: string }> = {
  'MODE-1': { label: 'PRD', description: 'Product Requirements Draft' },
  'MODE-2': { label: 'BRS', description: 'Business Requirements: use cases, BDD, FR/NFR' },
  'MODE-3': { label: 'Architecture', description: 'Solution Architecture, ERD, layers, data flow' },
  'MODE-4': { label: 'Test Strategy', description: 'Test coverage, BDD-to-tests, quality gates' },
  'MODE-5': { label: 'Plan', description: 'Project Delivery Plan, backlog' },
  'MODE-6': { label: 'TDD Build', description: 'Test-Driven Development implementation' },
  'MODE-7': { label: 'Dashboard', description: 'Product Operating Dashboard' },
  'MODE-8': { label: 'Brownfield CR', description: 'Controlled change request on an existing system' },
};

/** FR-GEN-090 / FR-GEN-091 — return current mode availability for the founder. */
export function modeStatuses(spec: ProductSpec | undefined): ModeStatus[] {
  const has = (k: Parameters<typeof nodesByKind>[1]): number => (spec ? nodesByKind(spec, k).length : 0);

  const hasFeatures = has('FEATURE') > 0;
  const hasStories = has('STORY') > 0;
  const hasUseCases = has('USE_CASE') > 0;
  const hasScenarios = has('SCENARIO') > 0;
  const hasFRs = has('FR') > 0;
  const hasNFRs = has('NFR') > 0;
  const hasTests = has('TEST') > 0;

  const out: ModeStatus[] = [
    {
      mode: 'MODE-1',
      ...LABELS['MODE-1'],
      ready: hasFeatures && hasStories,
      reason: !hasFeatures ? 'Need ≥1 feature' : !hasStories ? 'Need ≥1 user story' : undefined,
    },
    {
      mode: 'MODE-2',
      ...LABELS['MODE-2'],
      ready: hasUseCases && hasScenarios && hasFRs,
      reason: !hasUseCases ? 'Need ≥1 use case' : !hasScenarios ? 'Need ≥1 BDD scenario' : !hasFRs ? 'Need ≥1 functional requirement' : undefined,
    },
    {
      mode: 'MODE-3',
      ...LABELS['MODE-3'],
      ready: hasUseCases && hasFRs,
      reason: !hasUseCases ? 'Need ≥1 use case' : !hasFRs ? 'Need ≥1 FR before architecture' : undefined,
    },
    {
      mode: 'MODE-4',
      ...LABELS['MODE-4'],
      ready: hasFRs && hasNFRs && hasTests,
      reason: !hasFRs ? 'Need FRs' : !hasNFRs ? 'Need NFRs' : !hasTests ? 'Need ≥1 test' : undefined,
    },
    {
      mode: 'MODE-5',
      ...LABELS['MODE-5'],
      ready: hasFeatures && hasFRs && hasTests,
      reason: 'Plan requires features, FRs and tests',
    },
    {
      mode: 'MODE-6',
      ...LABELS['MODE-6'],
      ready: hasFRs && hasTests,
      reason: 'TDD build requires tests first',
    },
    { mode: 'MODE-7', ...LABELS['MODE-7'], ready: hasFeatures && hasFRs },
    { mode: 'MODE-8', ...LABELS['MODE-8'], ready: !!spec && spec.nodes.length > 0, reason: 'Brownfield needs an existing spec' },
  ];
  return out;
}
