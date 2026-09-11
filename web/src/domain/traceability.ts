import type { ProductSpec } from './types';
import { activeNodes, nodesByKind } from './spec';

export interface Coverage {
  frId: string;
  frTitle: string;
  tests: string[];
  ucs: string[];
  status: 'COVERED' | 'MISSING';
}

/** FR-GEN-013 — Build a coverage list per FR. A FR is COVERED iff it has ≥1 test linked. */
export function buildTraceability(spec: ProductSpec): Coverage[] {
  const frs = nodesByKind(spec, 'FR');
  return frs.map((fr) => ({
    frId: fr.id,
    frTitle: fr.title,
    tests: fr.links.tests,
    ucs: fr.links.ucs,
    status: fr.links.tests.length > 0 ? 'COVERED' : 'MISSING',
  }));
}

export function tracePercent(spec: ProductSpec): number {
  const cov = buildTraceability(spec);
  if (cov.length === 0) return 0;
  const covered = cov.filter((c) => c.status === 'COVERED').length;
  return Math.round((covered / cov.length) * 1000) / 10; // one decimal
}

/** Required mandatory node kinds to consider a spec "complete enough". */
export const REQUIRED_KINDS = ['FEATURE', 'STORY', 'USE_CASE', 'SCENARIO', 'FR', 'NFR', 'TEST'] as const;

export function specCompleteness(spec: ProductSpec): number {
  const counts = REQUIRED_KINDS.map((k) => nodesByKind(spec, k).length);
  // Heuristic: full credit when ≥3 of each required kind exist (≥1 for NFR).
  const required = REQUIRED_KINDS.map((k) => (k === 'NFR' ? 1 : 3));
  let filled = 0;
  let total = 0;
  counts.forEach((c, i) => {
    total += required[i]!;
    filled += Math.min(c, required[i]!);
  });
  if (total === 0) return 0;
  return Math.round((filled / total) * 1000) / 10;
}

export function testPassRate(spec: ProductSpec): number {
  // In MVP every TEST node carries status. A node with status=APPROVED or FINAL is considered passing.
  const tests = nodesByKind(spec, 'TEST');
  if (tests.length === 0) return 0;
  const passing = tests.filter((t) => t.status === 'APPROVED' || t.status === 'FINAL').length;
  return Math.round((passing / tests.length) * 1000) / 10;
}

export function summary(spec: ProductSpec): {
  totalActive: number;
  byKind: Record<string, number>;
  specCompleteness: number;
  tracePercent: number;
  testPassRate: number;
} {
  const byKind: Record<string, number> = {};
  for (const n of activeNodes(spec)) {
    byKind[n.kind] = (byKind[n.kind] ?? 0) + 1;
  }
  return {
    totalActive: activeNodes(spec).length,
    byKind,
    specCompleteness: specCompleteness(spec),
    tracePercent: tracePercent(spec),
    testPassRate: testPassRate(spec),
  };
}
