import type { Architecture, ProductSpec, SpecNode } from '@/domain/types';
import { activeNodes } from '@/domain/spec';

function safeId(s: string): string {
  return s.replace(/[^A-Za-z0-9_]/g, '_');
}

/** FR-GEN-080 — ERD from entities[]. */
export function erdFromArch(arch: Architecture): string {
  const lines: string[] = ['erDiagram'];
  for (const e of arch.entities) {
    const fieldsBlock = e.fields.map((f) => `  string ${safeId(f)}`).join('\n');
    lines.push(`${safeId(e.name)} {`);
    if (fieldsBlock) lines.push(fieldsBlock);
    lines.push(`}`);
  }
  for (const e of arch.entities) {
    for (const r of e.relations) {
      const op =
        r.type === '1-1' ? '||--||' :
        r.type === '1-N' ? '||--o{' :
        '}o--o{';
      lines.push(`${safeId(e.name)} ${op} ${safeId(r.to)} : "${r.label ?? ''}"`);
    }
  }
  return lines.join('\n');
}

/** FR-GEN-081 — layered diagram from components[]. */
export function layersFromArch(arch: Architecture): string {
  const grouped = new Map<string, typeof arch.components>();
  for (const c of arch.components) {
    if (!grouped.has(c.layer)) grouped.set(c.layer, []);
    grouped.get(c.layer)!.push(c);
  }
  const order = ['client', 'service', 'ai', 'data', 'infra'];
  const lines = ['flowchart TB'];
  for (const layer of order) {
    const arr = grouped.get(layer);
    if (!arr) continue;
    lines.push(`  subgraph ${layer.toUpperCase()}["${layer.toUpperCase()} LAYER"]`);
    for (const c of arr) {
      lines.push(`    ${safeId(c.id)}["${c.name}"]`);
    }
    lines.push(`  end`);
  }
  for (const e of arch.dataFlow) {
    const label = e.label ? `|${e.label}|` : '';
    lines.push(`  ${safeId(e.from)} -->${label} ${safeId(e.to)}`);
  }
  return lines.join('\n');
}

/** Data Flow Diagram from `dataFlow[]`. */
export function dataFlowFromArch(arch: Architecture): string {
  const lines = ['flowchart LR'];
  for (const c of arch.components) {
    lines.push(`  ${safeId(c.id)}["${c.name}\\n(${c.layer})"]`);
  }
  for (const e of arch.dataFlow) {
    const label = e.label ? `|${e.label}|` : '';
    lines.push(`  ${safeId(e.from)} -->${label} ${safeId(e.to)}`);
  }
  return lines.join('\n');
}

/** Spec tree as a mindmap-ish flowchart (Feature → Story → UC → Scenario → FR → Test). */
export function specGraph(spec: ProductSpec): string {
  const nodes = activeNodes(spec);
  const lines = ['flowchart LR'];
  const ordered: SpecNode[] = [
    ...nodes.filter((n) => n.kind === 'FEATURE'),
    ...nodes.filter((n) => n.kind === 'STORY'),
    ...nodes.filter((n) => n.kind === 'USE_CASE'),
    ...nodes.filter((n) => n.kind === 'SCENARIO'),
    ...nodes.filter((n) => n.kind === 'FR'),
    ...nodes.filter((n) => n.kind === 'NFR'),
    ...nodes.filter((n) => n.kind === 'TEST'),
  ];
  for (const n of ordered) {
    const label = n.id.replace(/-/g, '_');
    const txt = `${n.id}\\n${n.title.slice(0, 40)}`;
    lines.push(`  ${label}["${txt}"]`);
  }
  // Connect: each non-feature node connects upward via parentIds, and FRs to their linked tests.
  for (const n of ordered) {
    for (const pid of n.parentIds) {
      lines.push(`  ${pid.replace(/-/g, '_')} --> ${n.id.replace(/-/g, '_')}`);
    }
    if (n.kind === 'FR') {
      for (const t of n.links.tests) {
        lines.push(`  ${n.id.replace(/-/g, '_')} -. test .-> ${t.replace(/-/g, '_')}`);
      }
    }
  }
  return lines.join('\n');
}
