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
    {
      id: 'S-aurora', batchId: 'B1', ownerHandle: 'alice', name: 'Aurora',
      category: 'Coding',
      hashtags: ['devtools', 'spec-first', 'ai-ops', 'b2b', 'github', 'tdd'],
      pitch: 'Spec-first startup OS for AI-native founders.',
      description: `Aurora turns a one-line idea into a versioned, traceable product specification — Features, Stories, Use Cases, BDD scenarios, FR/NFR and Test stubs with stable IDs — and keeps it synchronised with your GitHub repository.

An AI Analyst conducts a guided interview, fills the spec hierarchy from your answers, and immediately renders a live Mermaid architecture (layers, ERD, data-flow). Each edit is a new version with a visible diff, reason and author; previous versions never get silently overwritten.

Once the spec exists, Aurora becomes the contract for code. Claude Code / SuperAgent reads /genesys/spec and /genesys/tests, writes implementation that satisfies the tests, and Aurora reads back the health: spec completeness, traceability coverage, persona-satisfaction simulation. Teams ship faster because the spec is machine-readable and stays in lockstep with code.`,
      landingUrl: 'https://aurora.studio', repo: 'genesys-org/aurora',
      published: true, createdAt: Date.now() - day * 6,
      techExecution: 78, marketPotential: 70, pitchScore: 66, currentMode: 'MODE-3',
    },
    {
      id: 'S-nebula', batchId: 'B1', ownerHandle: 'bob', name: 'Nebula',
      category: 'Sales',
      hashtags: ['customer-ops', 'ai-agents', 'shopify', 'd2c', 'automation', 'b2b'],
      pitch: 'Agentic customer ops for D2C brands.',
      description: `Nebula deploys a team of autonomous agents that triage inbound customer questions across email, chat and social DMs, draft replies in your brand voice, and escalate edge cases to humans with full conversation context attached.

Designed for Shopify-scale D2C teams (100k+ orders/month) that need to keep CSAT high without growing the support headcount linearly. Out of the box: order lookups, return policies, restock alerts, sizing help, multilingual support.

The agents learn from every human-approved reply, so the share of fully-automated answers climbs week over week. Nebula ships with safety rails — refund caps, escalation triggers, an audit log of every action — so ops leaders can trust the autonomy.`,
      landingUrl: 'https://nebula.app', repo: 'genesys-org/nebula',
      published: true, createdAt: Date.now() - day * 5,
      techExecution: 60, marketPotential: 65, pitchScore: 58, currentMode: 'MODE-2',
    },
    {
      id: 'S-pulse', batchId: 'B1', ownerHandle: 'carol', name: 'Pulse',
      category: 'Data',
      hashtags: ['llm-evals', 'observability', 'monitoring', 'devtools', 'b2b'],
      pitch: 'Real-time AI evals for production LLM apps.',
      description: `Pulse runs continuous, deterministic evaluations against your live LLM traffic so you catch hallucination spikes, schema-validation drops, refusal regressions and tool-call failures before users do.

Drop the Pulse SDK in your prompt pipeline — Python or TypeScript — and every request is tagged, scored against your eval suite, and surfaced in a real-time dashboard with cohorting by prompt version, model version and customer segment.

When an eval regresses below your threshold, Pulse alerts via Slack/PagerDuty, can auto-roll-back to the last-good prompt, and writes a post-mortem with the diff and the failing examples. Plays nicely with OpenAI, Anthropic, Google and your in-house models.`,
      landingUrl: 'https://pulse.dev', repo: 'genesys-org/pulse',
      published: true, createdAt: Date.now() - day * 4,
      techExecution: 82, marketPotential: 72, pitchScore: 70, currentMode: 'MODE-4',
    },
    {
      id: 'S-orbit', batchId: 'B1', ownerHandle: 'dmitry', name: 'Orbit',
      category: 'Productivity',
      hashtags: ['hardware', 'copilot', 'productivity', 'b2b'],
      pitch: 'AI co-pilot for hardware founders.',
      description: `Orbit is a private workspace that turns scattered BOMs, datasheets, supplier emails and revision threads into a structured project graph. One founder can coordinate a 20-person mechanical / electrical / firmware team without losing the thread.

The co-pilot answers "what changed in revision C?", "which parts are at risk of going EOL?", "what is the price impact if we swap MCU vendor?". Behind the scenes it pulls from your Notion, Google Drive, Slack, and supplier portals.

Currently in MODE-1 — the spec is still being formed. Targeting hardware studios building consumer electronics and robotics.`,
      landingUrl: 'https://orbit.engineering',
      published: false, createdAt: Date.now() - day * 2,
      techExecution: 45, marketPotential: 55, pitchScore: 40, currentMode: 'MODE-1',
    },

    {
      id: 'S-lumen', batchId: 'B1', ownerHandle: 'eva', name: 'Lumen',
      category: 'Image',
      hashtags: ['image-gen', 'design', 'marketing', 'brand-kit', 'b2b'],
      pitch: 'Generative product mockups in seconds.',
      description: `Lumen turns a one-line brief into a coordinated pack of brand-consistent product mockups: hero shots, lifestyle scenes, ad creatives for Meta and TikTok, and packshots for marketplaces — all in your real brand kit, not the internet's average aesthetic.

Upload your fonts, colours, product photos and reference moodboards once. Lumen learns the brand from them and refuses to drift; an automatic safety check rejects any output that violates your style guide.

Used by D2C brands to compress a 2-week shoot into a 20-minute prompt — and by agencies to keep 30 clients on-brand without 30 designers.`,
      landingUrl: 'https://lumen.studio', repo: 'genesys-org/lumen',
      published: true, createdAt: Date.now() - day * 7,
      techExecution: 70, marketPotential: 68, pitchScore: 64, currentMode: 'MODE-3',
    },
    {
      id: 'S-echo', batchId: 'B1', ownerHandle: 'frank', name: 'Echo',
      category: 'Audio',
      hashtags: ['audio', 'voice', 'podcasting', 'ai-voice', 'b2c'],
      pitch: 'Studio-quality AI voice for podcasters.',
      description: `Echo restores a 10-minute raw interview into broadcast-grade audio: cleans background noise, evens loudness across speakers, removes filler words ("um", "like", "you know"), tightens pauses, and ships a master ready for Spotify / Apple Podcasts.

Optional voice clone, fully consent-gated: with the host's explicit permission and a 60-second voice sample, Echo can re-render the show in 24 languages while preserving the speaker's prosody — and watermarks every generated clip so listeners always know it's AI.

Built for indie podcasters who don't have an audio engineer, and for podcast networks that publish 50 shows a week.`,
      landingUrl: 'https://echo.fm', repo: 'genesys-org/echo',
      published: true, createdAt: Date.now() - day * 9,
      techExecution: 64, marketPotential: 60, pitchScore: 55, currentMode: 'MODE-2',
    },
    {
      id: 'S-vector', batchId: 'B1', ownerHandle: 'grace', name: 'Vector',
      category: 'Research',
      hashtags: ['research', 'literature-review', 'academic', 'ai-search', 'b2b'],
      pitch: 'AI literature review for academic teams.',
      description: `Vector ingests a research question, finds the relevant papers across PubMed, ArXiv, OpenAlex and PubMed Central, ranks them by relevance and recency, and produces a grounded literature review with inline citations and a confidence score per claim.

Every claim is traceable back to the exact passage in the source paper. If Vector cannot find supporting evidence, it says so — no hallucinated citations.

Built for academic labs, R&D teams in biotech and pharma, and competitive-intelligence analysts who need a defensible audit trail of "where did this conclusion come from?".`,
      landingUrl: 'https://vector.research', repo: 'genesys-org/vector',
      published: true, createdAt: Date.now() - day * 3,
      techExecution: 72, marketPotential: 60, pitchScore: 62, currentMode: 'MODE-3',
    },
    {
      id: 'S-brisk', batchId: 'B1', ownerHandle: 'henry', name: 'Brisk',
      category: 'Marketing',
      hashtags: ['marketing', 'campaigns', 'personalization', 'growth', 'b2b'],
      pitch: 'Personalized campaign drafts for 1M users.',
      description: `Brisk segments your customer base by behaviour, drafts per-segment email and push campaigns in your brand voice, and predicts uplift before send via a hold-out simulation.

The growth team reviews the drafts and predictions side by side, approves or edits in one click, and Brisk schedules the send across your existing stack (Customer.io, Braze, Klaviyo, Iterable). Post-send, it auto-reads results and proposes the next iteration.

Built for consumer apps with 100k+ active users where 1-segment-fits-all campaigns leak 5–10% of conversion. Pricing is uplift-based: pay only on the incremental revenue Brisk's experiment beats the control.`,
      landingUrl: 'https://brisk.ai', repo: 'genesys-org/brisk',
      published: true, createdAt: Date.now() - day * 1,
      techExecution: 58, marketPotential: 75, pitchScore: 60, currentMode: 'MODE-2',
    },
    {
      id: 'S-quill', batchId: 'B1', ownerHandle: 'ivy', name: 'Quill',
      category: 'Writing',
      hashtags: ['writing', 'long-form', 'rag', 'grounded', 'b2c'],
      pitch: 'Long-form drafts grounded in your sources.',
      description: `Quill writes blog posts, internal memos and whitepapers grounded in the documents you upload — never on the open internet. Drop in PDFs, Notion pages, Google Docs or paste research notes; Quill drafts the long-form output with inline citations to your sources.

A "fact-check" pass flags every unsupported claim before you publish, with the source list each conclusion does (or does not) sit on. Reviewers see a side-by-side diff for every edit.

Used by analyst teams, technical writers and content marketers who need to publish long-form fast but cannot afford a single hallucinated stat.`,
      landingUrl: 'https://quill.dev', repo: 'genesys-org/quill',
      published: true, createdAt: Date.now() - day * 8,
      techExecution: 56, marketPotential: 58, pitchScore: 55, currentMode: 'MODE-2',
    },
    {
      id: 'S-ember', batchId: 'B1', ownerHandle: 'jack', name: 'Ember',
      category: 'Education',
      hashtags: ['education', 'tutor', 'k12', 'stem', 'ai-tutor'],
      pitch: '1-on-1 AI tutor for K-12 STEM.',
      description: `Ember diagnoses the student's actual gap with a short adaptive interview (5–7 questions, ~3 minutes), then drives a Socratic conversation that never spoils the answer — only the next question.

Aligned with US Common Core and UK National Curriculum standards, Ember covers maths, physics, chemistry and biology for grades 4–12. The tutor tracks each skill independently and surfaces a weekly mastery report to the parent, plus a "what to try next" recommendation.

Built for parents who want a personal tutor for under $30/month, and for after-school programs that need a per-student curriculum without per-student headcount.`,
      landingUrl: 'https://ember.school', repo: 'genesys-org/ember',
      published: true, createdAt: Date.now() - day * 10,
      techExecution: 62, marketPotential: 70, pitchScore: 58, currentMode: 'MODE-3',
    },
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
