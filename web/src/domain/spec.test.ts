import { describe, it, expect } from 'vitest';
import type { ProductSpec } from './types';
import { activeNodes, createNode, deleteNode, historyFor, updateNode } from './spec';

const blank: ProductSpec = {
  startupId: 'S1',
  nodes: [],
  architecture: { entities: [], components: [], dataFlow: [] },
};

describe('TEST-GEN-011 / TEST-GEN-070..072 — spec CRUD + versioning', () => {
  it('creates nodes with stable, monotonic IDs', () => {
    const f1 = createNode(blank, { kind: 'FEATURE', title: 'A' }, 1);
    const spec1: ProductSpec = { ...blank, nodes: [f1] };
    const f2 = createNode(spec1, { kind: 'FEATURE', title: 'B' }, 2);
    expect(f1.id).toBe('FEAT-GEN-001');
    expect(f2.id).toBe('FEAT-GEN-002');
    expect(f1.version).toBe(1);
    expect(f1.status).toBe('DRAFT');
  });

  it('updates create a new version and archive the previous as REPLACED', () => {
    const f1 = createNode(blank, { kind: 'FEATURE', title: 'A' }, 1);
    const spec: ProductSpec = { ...blank, nodes: [f1] };
    const r = updateNode(spec, f1.id, { title: 'A renamed', reason: 'clarify' }, 2);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const next = r.spec.nodes.find((n) => n.id === 'FEAT-GEN-001')!;
      expect(next.version).toBe(2);
      expect(next.title).toBe('A renamed');
      expect(next.status).toBe('UPDATED');
      expect(next.changedFields).toContain('title');
      expect(next.reason).toBe('clarify');
      const archived = r.spec.nodes.find((n) => n.id === 'FEAT-GEN-001@v1');
      expect(archived).toBeTruthy();
      expect(archived!.status).toBe('REPLACED');
    }
  });

  it('history sorted ascending by version', () => {
    let spec = { ...blank, nodes: [createNode(blank, { kind: 'FEATURE', title: 'A' }, 1)] };
    spec = (updateNode(spec, 'FEAT-GEN-001', { title: 'A2' }, 2) as { ok: true; spec: ProductSpec }).spec;
    spec = (updateNode(spec, 'FEAT-GEN-001', { title: 'A3' }, 3) as { ok: true; spec: ProductSpec }).spec;
    const h = historyFor(spec, 'FEAT-GEN-001');
    expect(h.map((n) => n.version)).toEqual([1, 2, 3]);
    expect(h.map((n) => n.title)).toEqual(['A', 'A2', 'A3']);
  });

  it('delete marks node OBSOLETE and hides from active list', () => {
    const f1 = createNode(blank, { kind: 'FEATURE', title: 'A' }, 1);
    const spec: ProductSpec = { ...blank, nodes: [f1] };
    const after = deleteNode(spec, f1.id, 2);
    expect(activeNodes(after)).toHaveLength(0);
    expect(after.nodes.find((n) => n.id === f1.id)!.status).toBe('OBSOLETE');
  });

  it('rejects edits on REPLACED nodes', () => {
    let spec = { ...blank, nodes: [createNode(blank, { kind: 'FEATURE', title: 'A' }, 1)] };
    spec = (updateNode(spec, 'FEAT-GEN-001', { title: 'A2' }, 2) as { ok: true; spec: ProductSpec }).spec;
    const r = updateNode(spec, 'FEAT-GEN-001@v1', { title: 'noop' }, 3);
    expect(r.ok).toBe(false);
  });
});
