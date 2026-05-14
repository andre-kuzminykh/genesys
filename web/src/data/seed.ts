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
    { handle: 'eva', name: 'Eva Park', role: 'founder', avatarSeed: 'eva' },
    { handle: 'frank', name: 'Frank Okoye', role: 'founder', avatarSeed: 'frank' },
    { handle: 'grace', name: 'Grace Sato', role: 'founder', avatarSeed: 'grace' },
    { handle: 'henry', name: 'Henry Adler', role: 'founder', avatarSeed: 'henry' },
    { handle: 'ivy', name: 'Ivy Tran', role: 'founder', avatarSeed: 'ivy' },
    { handle: 'jack', name: 'Jack Romero', role: 'founder', avatarSeed: 'jack' },
  ];

  const batch = {
    id: 'B1',
    name: 'GENESYS-001 · May Cohort',
    allowlist: ['admin', 'alice', 'bob', 'carol', 'dmitry', 'eva', 'frank', 'grace', 'henry', 'ivy', 'jack'],
    creditsPerInvestor: 1000,
    selfInvestPolicy: 'FORBIDDEN' as const,
    weights: DEFAULT_WEIGHTS,
    createdAt: Date.now(),
  };

  const day = 86400000;
  const startups: Startup[] = [
    { id: 'S-aurora',  batchId: 'B1', ownerHandle: 'alice',  name: 'Aurora',  category: 'Coding',       pitch: 'Spec-first startup OS for AI-native founders.',         description: 'Aurora turns a raw idea into a versioned, traceable product specification, then keeps it synchronized with your GitHub repo and tests. AI Analyst interviews you, generates Features / Stories / Use Cases / BDD / FR / NFR / Tests with stable IDs. Every change is a new version with a visible diff.', landingUrl: 'https://aurora.studio',   repo: 'genesys-org/aurora',  published: true,  createdAt: Date.now() - day * 6, techExecution: 78, marketPotential: 70, pitchScore: 66, currentMode: 'MODE-3' },
    { id: 'S-nebula',  batchId: 'B1', ownerHandle: 'bob',    name: 'Nebula',  category: 'Sales',        pitch: 'Agentic customer ops for D2C brands.',                  description: 'Nebula deploys autonomous agents that triage inbound questions, draft replies in your brand voice, and escalate edge cases to humans with full context. Designed for Shopify-scale D2C teams that need to keep CSAT high without growing the support headcount linearly.', landingUrl: 'https://nebula.app',      repo: 'genesys-org/nebula',  published: true,  createdAt: Date.now() - day * 5, techExecution: 60, marketPotential: 65, pitchScore: 58, currentMode: 'MODE-2' },
    { id: 'S-pulse',   batchId: 'B1', ownerHandle: 'carol',  name: 'Pulse',   category: 'Data',         pitch: 'Real-time AI evals for production LLM apps.',           description: 'Pulse runs continuous, deterministic evaluations against your live LLM traffic. Catches hallucination spikes, schema drift and refusal regressions before users do. Plays nicely with OpenAI, Anthropic, and your in-house models.', landingUrl: 'https://pulse.dev',       repo: 'genesys-org/pulse',   published: true,  createdAt: Date.now() - day * 4, techExecution: 82, marketPotential: 72, pitchScore: 70, currentMode: 'MODE-4' },
    { id: 'S-orbit',   batchId: 'B1', ownerHandle: 'dmitry', name: 'Orbit',   category: 'Productivity', pitch: 'AI co-pilot for hardware founders.',                    description: 'Orbit is a private workspace that turns scattered BOMs, datasheets and supplier emails into a structured project graph. Lets a single hardware founder coordinate the work of a 20-person team.', landingUrl: 'https://orbit.engineering',                              published: false, createdAt: Date.now() - day * 2, techExecution: 45, marketPotential: 55, pitchScore: 40, currentMode: 'MODE-1' },

    { id: 'S-lumen',   batchId: 'B1', ownerHandle: 'eva',    name: 'Lumen',   category: 'Image',        pitch: 'Generative product mockups in seconds.',                description: 'Lumen turns a one-line brief into a pack of brand-consistent product mockups: hero shots, lifestyle scenes and ad creatives. Trained on your own brand kit, not the internet.', landingUrl: 'https://lumen.studio',    repo: 'genesys-org/lumen',   published: true,  createdAt: Date.now() - day * 7, techExecution: 70, marketPotential: 68, pitchScore: 64, currentMode: 'MODE-3' },
    { id: 'S-echo',    batchId: 'B1', ownerHandle: 'frank',  name: 'Echo',    category: 'Audio',        pitch: 'Studio-quality AI voice for podcasters.',               description: 'Echo restores a 10-minute interview into broadcast-grade audio: cleans background noise, evens loudness, removes filler words, and can re-render your voice in 24 languages with consent.', landingUrl: 'https://echo.fm',          repo: 'genesys-org/echo',    published: true,  createdAt: Date.now() - day * 9, techExecution: 64, marketPotential: 60, pitchScore: 55, currentMode: 'MODE-2' },
    { id: 'S-vector',  batchId: 'B1', ownerHandle: 'grace',  name: 'Vector',  category: 'Research',     pitch: 'AI literature review for academic teams.',              description: 'Vector ingests a question, finds the relevant papers across PubMed / ArXiv / OpenAlex, and writes a grounded literature review with inline citations and a confidence per claim.', landingUrl: 'https://vector.research', repo: 'genesys-org/vector',  published: true,  createdAt: Date.now() - day * 3, techExecution: 72, marketPotential: 60, pitchScore: 62, currentMode: 'MODE-3' },
    { id: 'S-brisk',   batchId: 'B1', ownerHandle: 'henry',  name: 'Brisk',   category: 'Marketing',    pitch: 'Personalized campaign drafts for 1M users.',            description: 'Brisk segments your customer base, drafts per-segment email/push campaigns, and predicts uplift before send. The growth team approves; Brisk schedules.', landingUrl: 'https://brisk.ai',         repo: 'genesys-org/brisk',   published: true,  createdAt: Date.now() - day * 1, techExecution: 58, marketPotential: 75, pitchScore: 60, currentMode: 'MODE-2' },
    { id: 'S-quill',   batchId: 'B1', ownerHandle: 'ivy',    name: 'Quill',   category: 'Writing',      pitch: 'Long-form drafts grounded in your sources.',            description: 'Quill writes blog posts, internal memos and whitepapers grounded in the documents you upload. Inline citations, change tracking, and a "fact-check" pass that flags unsupported claims.', landingUrl: 'https://quill.dev',       repo: 'genesys-org/quill',   published: true,  createdAt: Date.now() - day * 8, techExecution: 56, marketPotential: 58, pitchScore: 55, currentMode: 'MODE-2' },
    { id: 'S-ember',   batchId: 'B1', ownerHandle: 'jack',   name: 'Ember',   category: 'Education',    pitch: '1-on-1 AI tutor for K-12 STEM.',                        description: 'Ember diagnoses the student\'s actual gap using a short interactive interview, then drives a Socratic conversation that never spoils the answer. Parents see a weekly report of mastered skills.', landingUrl: 'https://ember.school',    repo: 'genesys-org/ember',   published: true,  createdAt: Date.now() - day * 10, techExecution: 62, marketPotential: 70, pitchScore: 58, currentMode: 'MODE-3' },
  ];

  const specs: ProductSpec[] = startups.map((s) => buildSpec(s.id, s.pitch, s.category, s.ownerHandle));

  const hour = 3600000;
  const investments: Investment[] = [
    { id: 'I1', batchId: 'B1', investorHandle: 'bob',    startupId: 'S-aurora', amount: 250, createdAt: Date.now() - hour * 7 },
    { id: 'I2', batchId: 'B1', investorHandle: 'carol',  startupId: 'S-aurora', amount: 150, createdAt: Date.now() - hour * 6 },
    { id: 'I3', batchId: 'B1', investorHandle: 'alice',  startupId: 'S-pulse',  amount: 300, createdAt: Date.now() - hour * 5 },
    { id: 'I4', batchId: 'B1', investorHandle: 'dmitry', startupId: 'S-nebula', amount: 100, createdAt: Date.now() - hour * 4 },
    { id: 'I5', batchId: 'B1', investorHandle: 'bob',    startupId: 'S-pulse',  amount: 120, createdAt: Date.now() - hour * 3 },
    { id: 'I6', batchId: 'B1', investorHandle: 'eva',    startupId: 'S-brisk',  amount: 200, createdAt: Date.now() - hour * 5 },
    { id: 'I7', batchId: 'B1', investorHandle: 'henry',  startupId: 'S-lumen',  amount: 180, createdAt: Date.now() - hour * 4 },
    { id: 'I8', batchId: 'B1', investorHandle: 'grace',  startupId: 'S-ember',  amount: 220, createdAt: Date.now() - hour * 2 },
    { id: 'I9', batchId: 'B1', investorHandle: 'frank',  startupId: 'S-vector', amount: 140, createdAt: Date.now() - hour * 1 },
    { id: 'I10', batchId: 'B1', investorHandle: 'ivy',   startupId: 'S-echo',   amount: 160, createdAt: Date.now() - hour * 8 },
    { id: 'I11', batchId: 'B1', investorHandle: 'jack',  startupId: 'S-quill',  amount: 90, createdAt: Date.now() - hour * 6 },
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
