import { describe, it, expect } from 'vitest';
import { MockAiAnalyst } from './analyst';

describe('TEST-GEN-006 — Mock AI Analyst minimum counts', () => {
  it('produces ≥3 features / stories / UCs / scenarios / FRs and ≥1 NFR', () => {
    const a = new MockAiAnalyst();
    const out = a.interview({ idea: 'Aurora is a spec-first studio', category: 'devtools' });
    const count = (k: string) => out.nodes.filter((n) => n.kind === k).length;
    expect(count('FEATURE')).toBeGreaterThanOrEqual(3);
    expect(count('STORY')).toBeGreaterThanOrEqual(3);
    expect(count('USE_CASE')).toBeGreaterThanOrEqual(3);
    expect(count('SCENARIO')).toBeGreaterThanOrEqual(3);
    expect(count('FR')).toBeGreaterThanOrEqual(3);
    expect(count('NFR')).toBeGreaterThanOrEqual(1);
    expect(count('TEST')).toBeGreaterThanOrEqual(3);
  });

  it('is deterministic — same inputs yield identical drafts', () => {
    const a = new MockAiAnalyst();
    const a1 = a.interview({ idea: 'Same', category: 'devtools' });
    const a2 = a.interview({ idea: 'Same', category: 'devtools' });
    expect(a1).toEqual(a2);
  });
});
