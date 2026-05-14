import type { ProductSpec, SpecKind, SpecNode } from './types';
import { nextId } from './ids';

export interface CreateNodeInput {
  kind: SpecKind;
  title: string;
  body?: string;
  parentIds?: string[];
  author?: string;
  links?: Partial<SpecNode['links']>;
}

export interface UpdateNodeInput {
  title?: string;
  body?: string;
  parentIds?: string[];
  links?: Partial<SpecNode['links']>;
  reason?: string;
  author?: string;
}

/** Build a fresh node with version=1, status=DRAFT. */
export function createNode(spec: ProductSpec, input: CreateNodeInput, now = Date.now()): SpecNode {
  const existingIds = spec.nodes.map((n) => n.id);
  const id = nextId(input.kind, existingIds);
  return {
    id,
    startupId: spec.startupId,
    kind: input.kind,
    version: 1,
    status: 'DRAFT',
    title: input.title.trim(),
    body: (input.body ?? '').trim(),
    parentIds: input.parentIds ?? [],
    links: {
      tests: input.links?.tests ?? [],
      ucs: input.links?.ucs ?? [],
      frs: input.links?.frs ?? [],
      scenarios: input.links?.scenarios ?? [],
    },
    author: input.author,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * FR-GEN-070/071 — update a node by creating a new version.
 * The previous version is preserved with status=REPLACED so history is auditable.
 */
export function updateNode(
  spec: ProductSpec,
  nodeId: string,
  patch: UpdateNodeInput,
  now = Date.now(),
): { ok: true; spec: ProductSpec; newId: string } | { ok: false; reason: string } {
  const current = spec.nodes.find((n) => n.id === nodeId);
  if (!current) return { ok: false, reason: 'NODE_NOT_FOUND' };
  if (current.status === 'REPLACED' || current.status === 'OBSOLETE') {
    return { ok: false, reason: 'NODE_NOT_EDITABLE' };
  }

  const changedFields: string[] = [];
  const next: SpecNode = {
    ...current,
    title: patch.title !== undefined ? patch.title.trim() : current.title,
    body: patch.body !== undefined ? patch.body.trim() : current.body,
    parentIds: patch.parentIds !== undefined ? patch.parentIds : current.parentIds,
    links: {
      tests: patch.links?.tests ?? current.links.tests,
      ucs: patch.links?.ucs ?? current.links.ucs,
      frs: patch.links?.frs ?? current.links.frs,
      scenarios: patch.links?.scenarios ?? current.links.scenarios,
    },
    version: current.version + 1,
    status: 'UPDATED',
    prevVersionId: current.id + '@v' + current.version,
    changedFields,
    reason: patch.reason,
    author: patch.author ?? current.author,
    updatedAt: now,
  };

  if (patch.title !== undefined && patch.title.trim() !== current.title) changedFields.push('title');
  if (patch.body !== undefined && patch.body.trim() !== current.body) changedFields.push('body');
  if (patch.parentIds !== undefined &&
    JSON.stringify(patch.parentIds) !== JSON.stringify(current.parentIds)) {
    changedFields.push('parentIds');
  }
  if (patch.links) {
    (['tests', 'ucs', 'frs', 'scenarios'] as const).forEach((k) => {
      if (patch.links![k] && JSON.stringify(patch.links![k]) !== JSON.stringify(current.links[k])) {
        changedFields.push(`links.${k}`);
      }
    });
  }
  next.changedFields = changedFields;

  // Stash previous version under a synthetic id so it remains in history.
  const previousArchived: SpecNode = {
    ...current,
    id: current.id + '@v' + current.version,
    status: 'REPLACED',
    updatedAt: now,
  };

  const nodes = spec.nodes
    .map((n) => (n.id === current.id ? next : n))
    .concat([previousArchived]);

  return { ok: true, spec: { ...spec, nodes }, newId: next.id };
}

export function deleteNode(spec: ProductSpec, nodeId: string, now = Date.now()): ProductSpec {
  // Deletion is soft — mark current as OBSOLETE so history is preserved.
  const nodes = spec.nodes.map((n) =>
    n.id === nodeId && n.status !== 'REPLACED'
      ? { ...n, status: 'OBSOLETE' as const, updatedAt: now }
      : n,
  );
  return { ...spec, nodes };
}

export function activeNodes(spec: ProductSpec): SpecNode[] {
  return spec.nodes.filter((n) => n.status !== 'REPLACED' && n.status !== 'OBSOLETE');
}

export function historyFor(spec: ProductSpec, nodeId: string): SpecNode[] {
  const root = spec.nodes.find((n) => n.id === nodeId);
  if (!root) return [];
  return spec.nodes
    .filter((n) => n.id === nodeId || n.id.startsWith(nodeId + '@v'))
    .sort((a, b) => a.version - b.version);
}

export function nodesByKind(spec: ProductSpec, kind: SpecKind): SpecNode[] {
  return activeNodes(spec).filter((n) => n.kind === kind);
}
