import { describe, it, expect } from 'vitest';
import { MockPersonaSimulator } from './personas';
import { MockAiAnalyst } from './analyst';
import type { ProductSpec, Startup } from '@/domain/types';
import { createNode } from '@/domain/spec';

function blankSpec(): ProductSpec {
  return { startupId: 'S1', nodes: [], architecture: { entities: [], components: [], dataFlow: [] } };
}

function richSpec(): ProductSpec {
  // Build a spec with 3+ of each kind, NFR ≥1.
  let spec = blankSpec();
  const draft = new MockAiAnalyst().interview({ idea: 'Aurora', category: 'devtools' });
  let t = 1;
  for (const n of draft.nodes) {
    spec = { ...spec, nodes: [...spec.nodes, createNode(spec, { kind: n.kind, title: n.title, body: n.body }, t++)] };
  }
  return spec;
}

function startup(overrides: Partial<Startup> = {}): Startup {
  return {
    id: 'S1', batchId: 'B1', ownerHandle: 'alice',
    name: 'Aurora', pitch: 'p', category: 'devtools',
    hashtags: ['devtools'],
    published: true, createdAt: 0,
    techExecution: 60, marketPotential: 50, pitchScore: 40,
    currentMode: 'MODE-1',
    ...overrides,
  };
}

describe('TEST-GEN-041 — simulation refuses on thin spec', () => {
  it('returns SPEC_TOO_THIN with empty spec', () => {
    const r = new MockPersonaSimulator().simulate({ startup: startup(), spec: blankSpec(), personas: ['impatient'] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('SPEC_TOO_THIN');
  });
});

describe('TEST-GEN-040 — simulation deterministic + rich spec raises satisfaction', () => {
  it('same inputs yield same scores', () => {
    const sim = new MockPersonaSimulator();
    const a = sim.simulate({ startup: startup(), spec: richSpec(), personas: ['impatient', 'skeptical_investor', 'power_user'] });
    const b = sim.simulate({ startup: startup(), spec: richSpec(), personas: ['impatient', 'skeptical_investor', 'power_user'] });
    expect(a).toEqual(b);
  });

  it('rich spec scores higher than thin spec', () => {
    const sim = new MockPersonaSimulator();
    const rich = sim.simulate({ startup: startup(), spec: richSpec(), personas: ['impatient', 'technical', 'power_user'] });
    expect(rich.ok).toBe(true);
    if (rich.ok) {
      const mean = rich.results.reduce((a, r) => a + r.score, 0) / rich.results.length;
      expect(mean).toBeGreaterThan(40);
    }
  });
});
