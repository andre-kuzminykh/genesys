import type { SpecKind } from './types';

const PREFIX: Record<SpecKind, string> = {
  FEATURE: 'FEAT',
  STORY: 'STORY',
  FLOW: 'FLOW',
  USE_CASE: 'UC',
  SCENARIO: 'SCN',
  FR: 'FR',
  NFR: 'NFR',
  TEST: 'TEST',
  TASK: 'TASK',
};

const NS = 'GEN';

export function specKindPrefix(kind: SpecKind): string {
  return PREFIX[kind];
}

export function buildSpecId(kind: SpecKind, n: number): string {
  return `${PREFIX[kind]}-${NS}-${String(n).padStart(3, '0')}`;
}

export function parseSpecId(id: string): { prefix: string; ns: string; n: number } | null {
  const m = /^([A-Z]+)-([A-Z]+)-(\d{3,})$/.exec(id);
  if (!m) return null;
  return { prefix: m[1]!, ns: m[2]!, n: Number(m[3]) };
}

/** Find the next numeric suffix for a given kind across the provided IDs. */
export function nextId(kind: SpecKind, existingIds: string[]): string {
  const prefix = PREFIX[kind];
  let max = 0;
  for (const id of existingIds) {
    const parsed = parseSpecId(id);
    if (parsed && parsed.prefix === prefix) {
      if (parsed.n > max) max = parsed.n;
    }
  }
  return buildSpecId(kind, max + 1);
}
