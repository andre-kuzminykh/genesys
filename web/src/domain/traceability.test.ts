import { describe, it, expect } from 'vitest';
import type { ProductSpec } from './types';
import { createNode, updateNode } from './spec';
import { buildTraceability, specCompleteness, tracePercent } from './traceability';

function blank(): ProductSpec {
  return { startupId: 'S1', nodes: [], architecture: { entities: [], components: [], dataFlow: [] } };
}

describe('TEST-GEN-013 — traceability', () => {
  it('marks FR as MISSING when no test linked', () => {
    let spec = blank();
    spec = { ...spec, nodes: [...spec.nodes, createNode(spec, { kind: 'FR', title: 'FR1' }, 1)] };
    const cov = buildTraceability(spec);
    expect(cov).toHaveLength(1);
    expect(cov[0]!.status).toBe('MISSING');
  });

  it('marks FR as COVERED when at least one test is linked', () => {
    let spec = blank();
    const fr = createNode(spec, { kind: 'FR', title: 'FR1' }, 1);
    spec = { ...spec, nodes: [fr] };
    const r = updateNode(spec, fr.id, { links: { tests: ['TEST-GEN-001'] } }, 2);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const cov = buildTraceability(r.spec);
      expect(cov[0]!.status).toBe('COVERED');
      expect(cov[0]!.tests).toEqual(['TEST-GEN-001']);
    }
  });

  it('tracePercent reflects covered/total', () => {
    let spec = blank();
    const fr1 = createNode(spec, { kind: 'FR', title: 'a' }, 1);
    spec = { ...spec, nodes: [fr1] };
    const fr2 = createNode(spec, { kind: 'FR', title: 'b' }, 2);
    spec = { ...spec, nodes: [...spec.nodes, fr2] };
    const r = updateNode(spec, fr1.id, { links: { tests: ['TEST-GEN-001'] } }, 3);
    if (r.ok) expect(tracePercent(r.spec)).toBe(50);
  });
});

describe('TEST-GEN-021 — spec completeness', () => {
  it('is 0 on empty spec', () => {
    expect(specCompleteness(blank())).toBe(0);
  });

  it('hits 100 when 3 of each required kind (NFR≥1) exist', () => {
    let spec = blank();
    const counts: Array<[Parameters<typeof createNode>[1]['kind'], number]> = [
      ['FEATURE', 3], ['STORY', 3], ['USE_CASE', 3], ['SCENARIO', 3], ['FR', 3], ['NFR', 1], ['TEST', 3],
    ];
    let t = 1;
    for (const [kind, n] of counts) {
      for (let i = 0; i < n; i++) {
        const node = createNode(spec, { kind, title: kind + ' ' + i }, t++);
        spec = { ...spec, nodes: [...spec.nodes, node] };
      }
    }
    expect(specCompleteness(spec)).toBe(100);
  });
});
