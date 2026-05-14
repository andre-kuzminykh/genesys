import type { AppState, ProductSpec, Startup, User, Investment, SimulationRun } from '@/domain/types';
import { DEFAULT_WEIGHTS } from '@/domain/scoring';
import { MockAiAnalyst } from '@/ai/analyst';
import { MockPersonaSimulator } from '@/ai/personas';
import { createNode } from '@/domain/spec';

const ANALYST = new MockAiAnalyst();
const SIM = new MockPersonaSimulator();

function buildSpec(startupId: string, idea: string, category: string, ownerHandle: string): ProductSpec {
  const draft = ANALYST.interview({ idea, category });
  let spec: ProductSpec = { startupId, nodes: [], architecture: { entities: [], components: [], dataFlow: [] } };
  let t = 0;
  for (const n of draft.nodes) {
    spec = {
      ...spec,
      nodes: [
        ...spec.nodes,
        createNode(spec, { kind: n.kind, title: n.title, body: n.body, author: ownerHandle }, ++t),
      ],
    };
  }
  // Link each FR to first TEST so traceability isn't all MISSING in the demo.
  const firstTest = spec.nodes.find((n) => n.kind === 'TEST');
  if (firstTest) {
    spec = {
      ...spec,
      nodes: spec.nodes.map((n) =>
        n.kind === 'FR'
          ? { ...n, links: { ...n.links, tests: [firstTest.id] } }
          : n,
      ),
    };
  }
  // Seed some architecture
  spec.architecture = {
    entities: [
      { id: 'User', name: 'User', fields: ['handle', 'name', 'role'], relations: [{ to: 'Startup', type: '1-N', label: 'owns' }] },
      { id: 'Startup', name: 'Startup', fields: ['name', 'pitch', 'category', 'repo'], relations: [{ to: 'ProductSpec', type: '1-1', label: 'has' }, { to: 'Investment', type: '1-N', label: 'receives' }] },
      { id: 'ProductSpec', name: 'ProductSpec', fields: ['nodes'], relations: [{ to: 'SpecNode', type: '1-N', label: 'nodes' }] },
      { id: 'SpecNode', name: 'SpecNode', fields: ['id', 'kind', 'status'], relations: [] },
      { id: 'Investment', name: 'Investment', fields: ['amount', 'createdAt'], relations: [] },
      { id: 'Batch', name: 'Batch', fields: ['allowlist', 'weights', 'creditsPerInvestor'], relations: [{ to: 'Startup', type: '1-N', label: 'contains' }] },
    ],
    components: [
      { id: 'ui-screens', name: 'Screens', layer: 'client' },
      { id: 'ui-components', name: 'Components', layer: 'client' },
      { id: 'domain', name: 'Domain rules', layer: 'service' },
      { id: 'analyst', name: 'AI Analyst', layer: 'ai' },
      { id: 'simulator', name: 'Persona Simulator', layer: 'ai' },
      { id: 'store', name: 'Local Store', layer: 'data' },
      { id: 'vite', name: 'Vite + Vitest', layer: 'infra' },
    ],
    dataFlow: [
      { from: 'ui-screens', to: 'domain', label: 'action' },
      { from: 'domain', to: 'store', label: 'persist' },
      { from: 'domain', to: 'analyst', label: 'interview' },
      { from: 'domain', to: 'simulator', label: 'simulate' },
      { from: 'store', to: 'ui-screens', label: 'selectors' },
    ],
  };
  return spec;
}

export function seedState(): AppState {
  const users: User[] = [
    { handle: 'admin', name: 'Demo Admin', role: 'admin', avatarSeed: 'admin' },
    { handle: 'alice', name: 'Alice Chen', role: 'founder', avatarSeed: 'alice' },
    { handle: 'bob', name: 'Bob Rivera', role: 'founder', avatarSeed: 'bob' },
    { handle: 'carol', name: 'Carol Müller', role: 'founder', avatarSeed: 'carol' },
    { handle: 'dmitry', name: 'Dmitry K.', role: 'founder', avatarSeed: 'dmitry' },
  ];

  const batch = {
    id: 'B1',
    name: 'GENESIS-001 · May Cohort',
    allowlist: ['admin', 'alice', 'bob', 'carol', 'dmitry'],
    creditsPerInvestor: 1000,
    selfInvestPolicy: 'FORBIDDEN' as const,
    weights: DEFAULT_WEIGHTS,
    createdAt: Date.now(),
  };

  const startups: Startup[] = [
    { id: 'S-aurora', batchId: 'B1', ownerHandle: 'alice', name: 'Aurora', pitch: 'Spec-first startup OS for AI-native founders.', category: 'devtools', repo: 'genesis-org/aurora', published: true, createdAt: Date.now() - 86400000 * 6, techExecution: 78, marketPotential: 70, pitchScore: 66, currentMode: 'MODE-3' },
    { id: 'S-nebula', batchId: 'B1', ownerHandle: 'bob', name: 'Nebula', pitch: 'Agentic customer ops for D2C brands.', category: 'ops', repo: 'genesis-org/nebula', published: true, createdAt: Date.now() - 86400000 * 5, techExecution: 60, marketPotential: 65, pitchScore: 58, currentMode: 'MODE-2' },
    { id: 'S-pulse', batchId: 'B1', ownerHandle: 'carol', name: 'Pulse', pitch: 'Real-time AI evals for production LLM apps.', category: 'ai-quality', repo: 'genesis-org/pulse', published: true, createdAt: Date.now() - 86400000 * 4, techExecution: 82, marketPotential: 72, pitchScore: 70, currentMode: 'MODE-4' },
    { id: 'S-orbit', batchId: 'B1', ownerHandle: 'dmitry', name: 'Orbit', pitch: 'AI co-pilot for hardware founders.', category: 'hardware', published: false, createdAt: Date.now() - 86400000 * 2, techExecution: 45, marketPotential: 55, pitchScore: 40, currentMode: 'MODE-1' },
  ];

  const specs: ProductSpec[] = startups.map((s) => buildSpec(s.id, s.pitch, s.category, s.ownerHandle));

  const investments: Investment[] = [
    { id: 'I1', batchId: 'B1', investorHandle: 'bob', startupId: 'S-aurora', amount: 250, createdAt: Date.now() - 3600000 * 5 },
    { id: 'I2', batchId: 'B1', investorHandle: 'carol', startupId: 'S-aurora', amount: 150, createdAt: Date.now() - 3600000 * 4 },
    { id: 'I3', batchId: 'B1', investorHandle: 'alice', startupId: 'S-pulse', amount: 300, createdAt: Date.now() - 3600000 * 3 },
    { id: 'I4', batchId: 'B1', investorHandle: 'dmitry', startupId: 'S-nebula', amount: 100, createdAt: Date.now() - 3600000 * 2 },
    { id: 'I5', batchId: 'B1', investorHandle: 'bob', startupId: 'S-pulse', amount: 120, createdAt: Date.now() - 3600000 * 1 },
  ];

  // Pre-bake one simulation per published startup so the dashboard isn't empty.
  const simulations: SimulationRun[] = [];
  for (const s of startups.filter((x) => x.published)) {
    const spec = specs.find((p) => p.startupId === s.id)!;
    const out = SIM.simulate({ startup: s, spec, personas: ['impatient', 'technical', 'skeptical_investor', 'power_user', 'student'] });
    if (out.ok) {
      simulations.push({
        id: 'SIM-' + s.id,
        startupId: s.id,
        personas: ['impatient', 'technical', 'skeptical_investor', 'power_user', 'student'],
        results: out.results,
        createdAt: Date.now(),
      });
    }
  }

  return {
    session: null,
    users,
    batches: [batch],
    startups,
    specs,
    investments,
    simulations,
    activeBatchId: 'B1',
  };
}
