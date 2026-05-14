import { describe, it, expect } from 'vitest';
import type { ProductSpec } from './types';
import { createNode } from './spec';
import { modeStatuses } from './modes';

function blank(): ProductSpec {
  return { startupId: 'S1', nodes: [], architecture: { entities: [], components: [], dataFlow: [] } };
}

describe('TEST-GEN-090 / TEST-GEN-091 — mode tracker', () => {
  it('locks all modes on empty spec', () => {
    const s = modeStatuses(blank());
    const m1 = s.find((m) => m.mode === 'MODE-1')!;
    expect(m1.ready).toBe(false);
    expect(m1.reason).toMatch(/feature/i);
  });

  it('MODE-1 becomes ready with features + stories', () => {
    let spec = blank();
    spec = { ...spec, nodes: [createNode(spec, { kind: 'FEATURE', title: 'A' }, 1)] };
    spec = { ...spec, nodes: [...spec.nodes, createNode(spec, { kind: 'STORY', title: 'S' }, 2)] };
    const s = modeStatuses(spec);
    expect(s.find((m) => m.mode === 'MODE-1')!.ready).toBe(true);
  });

  it('MODE-2 needs use cases, scenarios and FRs', () => {
    let spec = blank();
    spec = { ...spec, nodes: [createNode(spec, { kind: 'USE_CASE', title: 'U' }, 1)] };
    expect(modeStatuses(spec).find((m) => m.mode === 'MODE-2')!.ready).toBe(false);
    spec = { ...spec, nodes: [...spec.nodes, createNode(spec, { kind: 'SCENARIO', title: 'B' }, 2)] };
    spec = { ...spec, nodes: [...spec.nodes, createNode(spec, { kind: 'FR', title: 'F' }, 3)] };
    expect(modeStatuses(spec).find((m) => m.mode === 'MODE-2')!.ready).toBe(true);
  });
});
