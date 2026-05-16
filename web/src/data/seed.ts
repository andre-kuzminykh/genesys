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
    { handle: 'andre-kuzminykh',  name: 'Andre Kuzminykh',  role: 'admin',   avatarSeed: 'andre-kuzminykh' },
    { handle: 'artem-grigorash',  name: 'Artem Grigorash',  role: 'founder', avatarSeed: 'artem-grigorash' },
    { handle: 'artem3605',        name: 'Artem (3605)',     role: 'founder', avatarSeed: 'artem3605' },
    { handle: 'darkmechanikum',   name: 'Dark Mechanikum',  role: 'founder', avatarSeed: 'darkmechanikum' },
    { handle: 'denksworkspace',   name: 'Denks',            role: 'founder', avatarSeed: 'denksworkspace' },
    { handle: 'hspyroblast',      name: 'HSPyroblast',      role: 'founder', avatarSeed: 'hspyroblast' },
    { handle: 'kamaliyaal',       name: 'Kamaliya',         role: 'founder', avatarSeed: 'kamaliyaal' },
    { handle: 'kreativshikkk',    name: 'Kreativshikkk',    role: 'founder', avatarSeed: 'kreativshikkk' },
    { handle: 'mashan555',        name: 'Mashan',           role: 'founder', avatarSeed: 'mashan555' },
    { handle: 'maxlevitsky',      name: 'Max Levitsky',     role: 'founder', avatarSeed: 'maxlevitsky' },
    { handle: 'mitya139',         name: 'Mitya',            role: 'founder', avatarSeed: 'mitya139' },
    { handle: 'petrenkosofya',    name: 'Sofya Petrenko',   role: 'founder', avatarSeed: 'petrenkosofya' },
    { handle: 'rusyaew',          name: 'Rusyaew',          role: 'founder', avatarSeed: 'rusyaew' },
    { handle: 'somethingnew179',  name: 'Something New',    role: 'founder', avatarSeed: 'somethingnew179' },
    { handle: 'weethet',          name: 'WeetHet',          role: 'founder', avatarSeed: 'weethet' },
  ];

  const batch = {
    id: 'B1',
    name: 'GENESYS-001 · May Cohort',
    allowlist: [
      'andre-kuzminykh',
      'artem-grigorash', 'artem3605', 'darkmechanikum', 'denksworkspace',
      'hspyroblast', 'kamaliyaal', 'kreativshikkk', 'mashan555',
      'maxlevitsky', 'mitya139', 'petrenkosofya', 'rusyaew',
      'somethingnew179', 'weethet',
    ],
    creditsPerInvestor: 100000,
    selfInvestPolicy: 'FORBIDDEN' as const,
    weights: DEFAULT_WEIGHTS,
    createdAt: Date.now(),
  };

  const day = 86400000;
  const startups: Startup[] = [
    {
      id: 'S-artrise', batchId: 'B1', ownerHandle: 'artem-grigorash', name: 'ArtRise',
      category: 'Image',
      hashtags: ['image-gen', 'design', 'brand-kit', 'b2c', 'creators'],
      pitch: 'AI art studio that turns rough sketches into finished illustrations.',
      description: `ArtRise lets creators upload a quick sketch (paper or digital) and ship a clean, brand-coherent illustration in minutes. Style packs (line-art, flat, painterly, pixel) drive the look; safety filters block IP-violating styles.

Daily creators get a feed of remix prompts; pro creators bring their own moodboard and lock the model into their visual identity.

Targets indie illustrators, social-media artists, and small studios that need 5-10 finished pieces a week without burning 5-10 hours each.`,
      landingUrl: 'https://github.com/Artem-Grigorash/ArtRise', repo: 'Artem-Grigorash/ArtRise',
      published: true, createdAt: Date.now() - day * 7,
      techExecution: 72, marketPotential: 68, pitchScore: 64, currentMode: 'MODE-3',
    },
    {
      id: 'S-shelfly', batchId: 'B1', ownerHandle: 'artem3605', name: 'Shelfly',
      category: 'Productivity',
      hashtags: ['inventory', 'ocr', 'ai-vision', 'b2c', 'home'],
      pitch: 'Snap a shelf, get a catalogued inventory.',
      description: `Shelfly turns one photo of a bookshelf, pantry, or storage room into a searchable inventory. Vision model identifies titles, brands and expiry dates; the user accepts/edits before sync.

Built for collectors (books, vinyl, board games), pantry-trackers who hate IFTTT-style chores, and small e-commerce sellers who run their stockroom from a phone.`,
      landingUrl: 'https://github.com/artem3605/Shelfly', repo: 'artem3605/Shelfly',
      published: true, createdAt: Date.now() - day * 5,
      techExecution: 60, marketPotential: 58, pitchScore: 55, currentMode: 'MODE-2',
    },
    {
      id: 'S-ailab', batchId: 'B1', ownerHandle: 'darkmechanikum', name: 'AI Lab HW',
      category: 'Education',
      hashtags: ['education', 'stem', 'ai-tutor', 'k12', 'lab'],
      pitch: 'AI lab assistant for STEM students.',
      description: `AI Lab HW reads the student's assignment, walks them through the lab procedure step by step (without giving the answer), and renders quick simulations for the predicted outcome.

Covers physics, chemistry and intro CS. Teachers can pre-approve a problem set and watch where students get stuck class-wide.`,
      landingUrl: 'https://github.com/DarkMechanikum/AILABHW', repo: 'DarkMechanikum/AILABHW',
      published: true, createdAt: Date.now() - day * 8,
      techExecution: 66, marketPotential: 64, pitchScore: 58, currentMode: 'MODE-3',
    },
    {
      id: 'S-bte', batchId: 'B1', ownerHandle: 'denksworkspace', name: 'Beat the Engine',
      category: 'Education',
      hashtags: ['chess', 'ai-coach', 'training', 'b2c', 'esports'],
      pitch: 'Drill the openings you keep losing — until you beat the engine.',
      description: `Beat the Engine spots the lines you blunder repeatedly, builds a tailored spaced-repetition opening tree, and plays you in a downscaled engine that targets exactly the level above yours.

Once you win three games on the line, the tree promotes harder branches. Built for the 1200-2000 Elo bracket where opening prep moves the needle the most.`,
      landingUrl: 'https://github.com/denksworkspace/beat-the-engine', repo: 'denksworkspace/beat-the-engine',
      published: true, createdAt: Date.now() - day * 4,
      techExecution: 70, marketPotential: 55, pitchScore: 60, currentMode: 'MODE-3',
    },
    {
      id: 'S-albion', batchId: 'B1', ownerHandle: 'hspyroblast', name: 'Albion Advisor',
      category: 'Gaming',
      hashtags: ['mmo', 'esports', 'advisor', 'b2c', 'market'],
      pitch: 'Live market + build advisor for Albion Online.',
      description: `Albion Advisor reads cross-server market prices in real time, computes profit margins on the most-traded crafted items, and recommends the routes a player should take given their tier and silver budget.

Build tab pulls top meta builds for the current patch with patch-note explanations and suggested counters. The killboard module flags ganking hotspots near your transport routes.`,
      landingUrl: 'https://github.com/HSPyroblast/Albion_advisor', repo: 'HSPyroblast/Albion_advisor',
      published: true, createdAt: Date.now() - day * 6,
      techExecution: 62, marketPotential: 50, pitchScore: 58, currentMode: 'MODE-2',
    },
    {
      id: 'S-calenmind', batchId: 'B1', ownerHandle: 'kamaliyaal', name: 'CalenMind',
      category: 'Productivity',
      hashtags: ['calendar', 'ai-agents', 'scheduling', 'b2c', 'wellbeing'],
      pitch: 'A calendar that schedules around your energy, not the other way round.',
      description: `CalenMind learns your daily energy curve (deep-work, social, recovery) from a tiny daily check-in and an optional wearable, then automatically slots meetings, errands, and focus blocks into the right time of day.

Conflicts are resolved with one tap: keep, reschedule, decline. The weekly review shows you where the calendar ate your peak hours.`,
      landingUrl: 'https://github.com/KamaliyaAl/CalenMind', repo: 'KamaliyaAl/CalenMind',
      published: true, createdAt: Date.now() - day * 3,
      techExecution: 64, marketPotential: 70, pitchScore: 62, currentMode: 'MODE-3',
    },
    {
      id: 'S-invalerts', batchId: 'B1', ownerHandle: 'kreativshikkk', name: 'InvestmentsAlert',
      category: 'Finance',
      hashtags: ['fintech', 'alerts', 'retail', 'b2c', 'trading'],
      pitch: 'Deduplicated smart alerts when your watchlist actually moves.',
      description: `InvestmentsAlert filters out the routine 0.3% noise and only pings you when a holding crosses an important technical / news / earnings threshold. Each alert ships with a 30-second context note: what moved, why, and what people on the same trade are doing.

Pro tier integrates with broker accounts to suggest position sizing within the user's pre-declared risk.`,
      landingUrl: 'https://github.com/Kreativshikkk/InvestmentsAlert', repo: 'Kreativshikkk/InvestmentsAlert',
      published: true, createdAt: Date.now() - day * 2,
      techExecution: 68, marketPotential: 72, pitchScore: 64, currentMode: 'MODE-3',
    },
    {
      id: 'S-stylify', batchId: 'B1', ownerHandle: 'mashan555', name: 'Stylify',
      category: 'Design',
      hashtags: ['fashion', 'ai-stylist', 'b2c', 'wardrobe'],
      pitch: 'An AI stylist that builds outfits from photos of your closet.',
      description: `Snap your wardrobe once. Stylify catalogues every item, then dresses you for any occasion — work, gym, date, travel — combining only pieces you actually own.

Weekly capsule planner outputs 7 outfits for the week ahead given the weather forecast and your calendar. Shopping suggestions only fire when a missing piece would unlock 5+ outfits.`,
      landingUrl: 'https://github.com/mashan555/Stylify', repo: 'mashan555/Stylify',
      published: true, createdAt: Date.now() - day * 9,
      techExecution: 58, marketPotential: 65, pitchScore: 55, currentMode: 'MODE-2',
    },
    {
      id: 'S-clutchup', batchId: 'B1', ownerHandle: 'maxlevitsky', name: 'Clutch Up',
      category: 'Gaming',
      hashtags: ['esports', 'coach', 'real-time', 'b2c'],
      pitch: 'Real-time decision coach for competitive players.',
      description: `Clutch Up watches your game in real time (with consent), and overlays a discreet HUD with concrete micro-decisions: when to rotate, when to play passive, what to ping. Post-match it generates a 90-second video review of your 3 biggest decision errors.

Initial titles: Valorant, CS2, Dota 2. Pro mode unlocks coach-grade analytics dashboards.`,
      landingUrl: 'https://github.com/MaxLevitsky/clutch_up', repo: 'MaxLevitsky/clutch_up',
      published: true, createdAt: Date.now() - day * 5,
      techExecution: 70, marketPotential: 60, pitchScore: 64, currentMode: 'MODE-3',
    },
    {
      id: 'S-arb', batchId: 'B1', ownerHandle: 'mitya139', name: 'Arbitrage Bot',
      category: 'Finance',
      hashtags: ['crypto', 'arbitrage', 'telegram', 'b2c', 'defi'],
      pitch: 'Telegram bot that surfaces DEX arbitrage in real time.',
      description: `Arbitrage Bot scans top DEX pools across L2s, simulates the round-trip with gas, and only pings the user when the after-cost spread clears a configurable threshold.

Pro tier auto-executes via the user's wallet with deterministic limit-loss rules. Public free tier shows monitored pairs but not the live spread.`,
      landingUrl: 'https://github.com/Mitya139/ai_lab_prediction_arbitrage_tg_bot', repo: 'Mitya139/ai_lab_prediction_arbitrage_tg_bot',
      published: true, createdAt: Date.now() - day * 6,
      techExecution: 64, marketPotential: 62, pitchScore: 58, currentMode: 'MODE-2',
    },
    {
      id: 'S-creators', batchId: 'B1', ownerHandle: 'petrenkosofya', name: 'Creators Platform',
      category: 'Marketing',
      hashtags: ['creator-economy', 'b2b', 'content', 'monetization'],
      pitch: 'All-in-one platform for content creators to monetise their audience.',
      description: `Creators Platform stitches a creator's funnel together: link-in-bio, gated content, paid subscriptions, sponsorship marketplace, and analytics — all in one workspace.

Brand-deal matching surfaces sponsors that look like a creator's audience persona (rather than chasing largest follower count). Pay-out goes through the user's existing Stripe or self-custodial wallet.`,
      landingUrl: 'https://github.com/petrenkosofya/creators-platform', repo: 'petrenkosofya/creators-platform',
      published: true, createdAt: Date.now() - day * 4,
      techExecution: 66, marketPotential: 74, pitchScore: 64, currentMode: 'MODE-3',
    },
    {
      id: 'S-ztbrowser', batchId: 'B1', ownerHandle: 'rusyaew', name: 'ZT Browser',
      category: 'Security',
      hashtags: ['privacy', 'zero-trust', 'browser', 'b2c', 'b2b'],
      pitch: 'Privacy-first browser with zero-trust networking baked in.',
      description: `ZT Browser ships with a built-in policy engine that splits traffic by domain into trust zones; each zone routes through a different egress and storage profile (cookies, localStorage, fingerprint).

Pro tier targets enterprise: a central policy server pushes the trust profile, and per-tab compliance is reported to a SIEM.`,
      landingUrl: 'https://github.com/rusyaew/ztinfra-ztbrowser-private-features-development', repo: 'rusyaew/ztinfra-ztbrowser-private-features-development',
      published: true, createdAt: Date.now() - day * 8,
      techExecution: 76, marketPotential: 60, pitchScore: 62, currentMode: 'MODE-4',
    },
    {
      id: 'S-tglearn', batchId: 'B1', ownerHandle: 'somethingnew179', name: 'TG Learn',
      category: 'Education',
      hashtags: ['education', 'language-learning', 'telegram', 'b2c'],
      pitch: 'Telegram-native flashcards that adapt to your study pattern.',
      description: `TG Learn lives inside the chat: every morning it sends 5 cards optimised by your error history; you reply with the answer, the bot scores it, and resurfaces the hard cards the next day.

Initial decks: Spanish, French, German, English idioms. Pro plan lets you import Anki decks and study with audio cards.`,
      landingUrl: 'https://github.com/somethingnew179/yet-another-tg-learning-app', repo: 'somethingnew179/yet-another-tg-learning-app',
      published: true, createdAt: Date.now() - day * 5,
      techExecution: 60, marketPotential: 56, pitchScore: 54, currentMode: 'MODE-2',
    },
    {
      id: 'S-p2pedit', batchId: 'B1', ownerHandle: 'weethet', name: 'P2PEdit',
      category: 'Coding',
      hashtags: ['p2p', 'devtools', 'collaboration', 'b2b', 'self-hosted'],
      pitch: 'Real-time peer-to-peer collaborative editor — zero backend required.',
      description: `P2PEdit lets two or more developers edit the same file with CRDT-style conflict-free updates, transported directly over WebRTC. No server, no signup, no leaks of source to a SaaS.

Built for security-paranoid teams (gov, defence, fintech) where any backend is a vetting hurdle. Optional self-hosted relay for NAT-traversal in corp networks.`,
      landingUrl: 'https://github.com/WeetHet/P2PEdit', repo: 'WeetHet/P2PEdit',
      published: true, createdAt: Date.now() - day * 7,
      techExecution: 74, marketPotential: 56, pitchScore: 60, currentMode: 'MODE-3',
    },
  ];

  const specs: ProductSpec[] = startups.map((s) => buildSpec(s.id, s.pitch, s.category, s.ownerHandle));

  const investments: Investment[] = []; // Each cohort participant starts with a clean wallet.

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
