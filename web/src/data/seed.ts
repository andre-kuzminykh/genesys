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
    { handle: 'andreykuzminykh-hub', name: 'Andrey Kuzminykh', role: 'founder', avatarSeed: 'andreykuzminykh-hub' },
    { handle: 'andre-dataistos', name: 'Andre Dataistos', role: 'founder', avatarSeed: 'andre-dataistos' },
    { handle: 'ruguosob',         name: 'Ruguosob',         role: 'founder', avatarSeed: 'ruguosob' },
    { handle: 'tm-a-t',           name: 'tm-a-t',           role: 'founder', avatarSeed: 'tm-a-t' },
    { handle: 'imartemy1524',     name: 'imartemy1524',     role: 'founder', avatarSeed: 'imartemy1524' },
    { handle: 'yuumiya',          name: 'Yuumiya',          role: 'founder', avatarSeed: 'yuumiya' },
    { handle: 'vobolgus',         name: 'vobolgus',         role: 'founder', avatarSeed: 'vobolgus' },
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
      'andreykuzminykh-hub',
      'andre-dataistos',
      'ruguosob',
      'tm-a-t',
      'imartemy1524',
      'yuumiya',
      'vobolgus',
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
      category: 'Marketplace',
      hashtags: ['art', 'marketplace', 'auctions', 'kotlin', 'b2c'],
      pitch: 'Web platform for emerging artists and collectors with daily launches and auctions.',
      description: `Kotlin/JVM web platform for emerging artists and collectors. It supports artwork drafts, daily launch submissions, ranked discovery feed, auctions/bidding, winner checkout, and a Streamlit internal operations dashboard.`,
      landingUrl: 'https://github.com/Artem-Grigorash/ArtRise', repo: 'Artem-Grigorash/ArtRise',
      coverImage: '/covers/S-artrise.jpg',
      published: true, createdAt: Date.now() - day * 7,
      techExecution: 72, marketPotential: 68, pitchScore: 64, currentMode: 'MODE-3',
    },
    {
      id: 'S-shelfly', batchId: 'B1', ownerHandle: 'artem3605', name: 'Shelfly',
      category: 'Marketplace',
      hashtags: ['inventory', 'marketplace', 'secondhand', 'fullstack', 'b2c'],
      pitch: 'Catalog your stuff, list what you no longer need.',
      description: `Full-stack web application where users catalog personal items as private inventory and turn tracked items into secondhand marketplace listings. Built with Next.js, FastAPI, and PostgreSQL, including purchase-request flows, public profiles, and collections.`,
      landingUrl: 'https://github.com/artem3605/Shelfly', repo: 'artem3605/Shelfly',
      coverImage: '/covers/S-shelfly.jpg',
      published: true, createdAt: Date.now() - day * 5,
      techExecution: 60, marketPotential: 58, pitchScore: 55, currentMode: 'MODE-2',
    },
    {
      id: 'S-ailab', batchId: 'B1', ownerHandle: 'darkmechanikum', name: 'AI Lab HW',
      category: 'Productivity',
      hashtags: ['anti-procrastination', 'telegram', 'focus', 'productivity', 'b2c'],
      pitch: 'Telegram bot that turns a vague task into one immediate micro-step.',
      description: `Telegram bot MVP for anti-procrastination: converts a free-text task into one immediate micro-step, runs short focus sessions with check-in callbacks, evaluates inactivity recovery, and tracks streaks/analytics. Built as a FastAPI service with PostgreSQL, SQLAlchemy, Alembic, and an aiogram 3 bot, packaged via Docker Compose.`,
      landingUrl: 'https://github.com/DarkMechanikum/AILABHW', repo: 'DarkMechanikum/AILABHW',
      coverImage: '/covers/S-ailab.jpg',
      published: true, createdAt: Date.now() - day * 8,
      techExecution: 66, marketPotential: 64, pitchScore: 58, currentMode: 'MODE-3',
    },
    {
      id: 'S-bte', batchId: 'B1', ownerHandle: 'denksworkspace', name: 'Beat the Engine',
      category: 'Education',
      hashtags: ['chess', 'ai-coach', 'training', 'webapp', 'b2c'],
      pitch: 'AI-assisted chess training: draft moves, commit, get engine analysis + reflection.',
      description: `AI-assisted chess training web app. Players draft candidate moves, commit one, and receive engine analysis plus structured AI reflection. Built with FastAPI API, separate engine/reflection workers, React/Vite frontend, Postgres, and Redis.`,
      landingUrl: 'https://github.com/denksworkspace/beat-the-engine', repo: 'denksworkspace/beat-the-engine',
      coverImage: '/covers/S-bte.jpg',
      published: true, createdAt: Date.now() - day * 4,
      techExecution: 70, marketPotential: 55, pitchScore: 60, currentMode: 'MODE-3',
    },
    {
      id: 'S-albion', batchId: 'B1', ownerHandle: 'hspyroblast', name: 'Albion Advisor',
      category: 'Gaming',
      hashtags: ['mmo', 'market', 'cli', 'arbitrage', 'b2c'],
      pitch: 'CLI tool for Albion Online crafting profit and transport arbitrage.',
      description: `Python CLI tool albion-scanner for Albion Online market analysis. It builds a local SQLite catalog, fetches live prices and 30-day sales from Albion Online Data Project API, and ranks crafting profitability and transport arbitrage.`,
      landingUrl: 'https://github.com/HSPyroblast/Albion_advisor', repo: 'HSPyroblast/Albion_advisor',
      coverImage: '/covers/S-albion.jpg',
      published: true, createdAt: Date.now() - day * 6,
      techExecution: 62, marketPotential: 50, pitchScore: 58, currentMode: 'MODE-2',
    },
    {
      id: 'S-calenmind', batchId: 'B1', ownerHandle: 'kamaliyaal', name: 'CalenMind',
      category: 'Productivity',
      hashtags: ['calendar', 'ai-agents', 'multimodal', 'telegram', 'b2c'],
      pitch: 'Multimodal scheduling agent: photos, voice and text into Google Calendar.',
      description: `Multimodal scheduling agent: Telegram bot plus FastAPI backend that converts photos of syllabi/timetables, voice notes, and text into Google Calendar events using Claude/Groq Whisper.`,
      landingUrl: 'https://github.com/KamaliyaAl/CalenMind', repo: 'KamaliyaAl/CalenMind',
      coverImage: '/covers/S-calenmind.jpg',
      published: true, createdAt: Date.now() - day * 3,
      techExecution: 64, marketPotential: 70, pitchScore: 62, currentMode: 'MODE-3',
    },
    {
      id: 'S-invalerts', batchId: 'B1', ownerHandle: 'kreativshikkk', name: 'InvestmentsAlert',
      category: 'Finance',
      hashtags: ['fintech', 'alerts', 'telegram', 'news', 'b2c'],
      pitch: 'Telegram alerts that match news headlines to the holdings in your portfolio.',
      description: `Telegram bot for tracking stock, ETF, and crypto holdings. It polls news from Finnhub/Tiingo, matches headlines to user holdings, and sends deduplicated alerts with sentiment labels using FastAPI, PostgreSQL/TimescaleDB, Redis, and an asyncio poller.`,
      landingUrl: 'https://github.com/Kreativshikkk/InvestmentsAlert', repo: 'Kreativshikkk/InvestmentsAlert',
      coverImage: '/covers/S-invalerts.jpg',
      published: true, createdAt: Date.now() - day * 2,
      techExecution: 68, marketPotential: 72, pitchScore: 64, currentMode: 'MODE-3',
    },
    {
      id: 'S-stylify', batchId: 'B1', ownerHandle: 'mashan555', name: 'Stylify',
      category: 'Design',
      hashtags: ['fashion', 'wardrobe', 'telegram', 'ai-stylist', 'b2c'],
      pitch: 'Telegram-based virtual wardrobe assistant.',
      description: `Telegram-based virtual wardrobe assistant. Users upload clothing photos, categorize items, and receive outfit suggestions based on event type and weather. Built as FastAPI backend, aiogram bot, Streamlit dashboard, and SQLite storage.`,
      landingUrl: 'https://github.com/mashan555/Stylify', repo: 'mashan555/Stylify',
      coverImage: '/covers/S-stylify.jpg',
      published: true, createdAt: Date.now() - day * 9,
      techExecution: 58, marketPotential: 65, pitchScore: 55, currentMode: 'MODE-2',
    },
    {
      id: 'S-clutchup', batchId: 'B1', ownerHandle: 'maxlevitsky', name: 'Clutch Up',
      category: 'Gaming',
      hashtags: ['tournaments', 'esports', 'community', 'platform', 'b2c'],
      pitch: 'Beginner-friendly competitive gaming platform with rank-based tournaments.',
      description: `Beginner-friendly competitive gaming platform. It supports rank-based tournament discovery/registration, team creation with invite links and roster lock, player progression, badges, and a Streamlit internal dashboard. Built with FastAPI, React/TypeScript, and SQLite.`,
      landingUrl: 'https://github.com/MaxLevitsky/clutch_up', repo: 'MaxLevitsky/clutch_up',
      coverImage: '/covers/S-clutchup.jpg',
      published: true, createdAt: Date.now() - day * 5,
      techExecution: 70, marketPotential: 60, pitchScore: 64, currentMode: 'MODE-3',
    },
    {
      id: 'S-arb', batchId: 'B1', ownerHandle: 'mitya139', name: 'Arbitrage Bot',
      category: 'Finance',
      hashtags: ['prediction-markets', 'arbitrage', 'telegram', 'polymarket', 'b2c'],
      pitch: 'Cross-market arbitrage alerts on Polymarket and Kalshi quotes.',
      description: `Telegram bot plus Python backend for prediction-market arbitrage. It ingests Polymarket and Kalshi quotes, normalizes them, and pushes deduplicated, fee- and depth-aware cross-market arbitrage alerts with configurable filters.`,
      landingUrl: 'https://github.com/Mitya139/ai_lab_prediction_arbitrage_tg_bot', repo: 'Mitya139/ai_lab_prediction_arbitrage_tg_bot',
      coverImage: '/covers/S-arb.jpg',
      published: true, createdAt: Date.now() - day * 6,
      techExecution: 64, marketPotential: 62, pitchScore: 58, currentMode: 'MODE-2',
    },
    {
      id: 'S-creators', batchId: 'B1', ownerHandle: 'petrenkosofya', name: 'Creators Platform',
      category: 'Marketplace',
      hashtags: ['handmade', 'discovery', 'local', 'marketplace', 'b2c'],
      pitch: 'Pinterest-style discovery marketplace for local handmade creators.',
      description: `Pinterest-style discovery marketplace for local handmade creators. Creators publish product cards; buyers browse visual feeds, filter by city/category, and save favorites. Built with FastAPI, Next.js, PostgreSQL, Redis, and MinIO.`,
      landingUrl: 'https://github.com/petrenkosofya/creators-platform', repo: 'petrenkosofya/creators-platform',
      coverImage: '/covers/S-creators.jpg',
      published: true, createdAt: Date.now() - day * 4,
      techExecution: 66, marketPotential: 74, pitchScore: 64, currentMode: 'MODE-3',
    },
    {
      id: 'S-ztbrowser', batchId: 'B1', ownerHandle: 'rusyaew', name: 'ZT Browser',
      category: 'Security',
      hashtags: ['enclave', 'attestation', 'devtools', 'extension', 'b2b'],
      pitch: 'Browser extension that verifies enclave attestation in-page.',
      description: `ZTBrowser developer trust platform. A Chrome extension verifies AWS Nitro/CoCo enclave attestation in-browser, backed by a facts-node provenance service, AWS deployment tooling, Rust parent proxy, and demo services.`,
      landingUrl: 'https://github.com/rusyaew/ztinfra-ztbrowser-private-features-development', repo: 'rusyaew/ztinfra-ztbrowser-private-features-development',
      coverImage: '/covers/S-ztbrowser.jpg',
      published: true, createdAt: Date.now() - day * 8,
      techExecution: 76, marketPotential: 60, pitchScore: 62, currentMode: 'MODE-4',
    },
    {
      id: 'S-tglearn', batchId: 'B1', ownerHandle: 'somethingnew179', name: 'TG Learn',
      category: 'Education',
      hashtags: ['language-learning', 'telegram', 'video', 'subtitles', 'b2c'],
      pitch: 'Telegram language-learning bot that turns subtitled video into mini-lessons.',
      description: `Telegram language-learning bot for English/Japanese. It imports subtitled video episodes, generates personalized mini-lessons and exercises from subtitle analysis, and tracks daily reviews/progress through FastAPI backend modules.`,
      landingUrl: 'https://github.com/somethingnew179/yet-another-tg-learning-app', repo: 'somethingnew179/yet-another-tg-learning-app',
      coverImage: '/covers/S-tglearn.jpg',
      published: true, createdAt: Date.now() - day * 5,
      techExecution: 60, marketPotential: 56, pitchScore: 54, currentMode: 'MODE-2',
    },
    {
      id: 'S-p2pedit', batchId: 'B1', ownerHandle: 'weethet', name: 'P2PEdit',
      category: 'Coding',
      hashtags: ['p2p', 'collaboration', 'webrtc', 'crdt', 'e2ee'],
      pitch: 'Local-first peer-to-peer collaborative Markdown editor with E2E encryption.',
      description: `Local-first peer-to-peer collaborative Markdown editor. Browsers sync documents through WebRTC and Yjs CRDTs, with AES-256-GCM and PBKDF2-based end-to-end encryption; a minimal Node.js WebSocket server is used only for signaling.`,
      landingUrl: 'https://github.com/WeetHet/P2PEdit', repo: 'WeetHet/P2PEdit',
      coverImage: '/covers/S-tglearn.jpg',
      published: true, createdAt: Date.now() - day * 7,
      techExecution: 74, marketPotential: 56, pitchScore: 60, currentMode: 'MODE-3',
    },
    {
      id: 'S-tonloans', batchId: 'B1', ownerHandle: 'andre-kuzminykh', name: 'TON NFT Loans',
      category: 'Finance',
      hashtags: ['ton', 'nft', 'lending', 'defi', 'web3'],
      pitch: 'NFT-collateral loan smart contracts on TON.',
      description: `TON NFT-collateral loan smart-contract project with frontend, Sandbox contract tests, public demo evidence, and GitHub repository; focused on NFT-backed borrowing/lending flows on TON.`,
      landingUrl: 'https://github.com/andre-kuzminykh/ton-nft-loan-contracts', repo: 'andre-kuzminykh/ton-nft-loan-contracts',
      coverImage: '/covers/S-tonloans.jpg',
      published: true, createdAt: Date.now() - day * 6,
      techExecution: 70, marketPotential: 58, pitchScore: 60, currentMode: 'MODE-3',
    },
    {
      id: 'S-fridgefriend', batchId: 'B1', ownerHandle: 'andre-kuzminykh', name: 'FridgeFriend',
      category: 'Productivity',
      hashtags: ['food', 'mobile', 'ai-vision', 'home', 'b2c'],
      pitch: 'AI fridge assistant: inventory, expiry, recipes, shopping lists.',
      description: `Full-stack AI food/fridge management application with FastAPI backend, Flutter mobile client, Streamlit dashboard, Docker stack, CI/CD, and Terraform infrastructure; focused on fridge inventory, expiry prediction, recipe/meal planning, shopping lists, notifications, and operational dashboards.`,
      landingUrl: 'https://github.com/andre-kuzminykh/fridgefriend', repo: 'andre-kuzminykh/fridgefriend',
      coverImage: '/covers/S-fridgefriend.jpg',
      published: true, createdAt: Date.now() - day * 4,
      techExecution: 68, marketPotential: 66, pitchScore: 60, currentMode: 'MODE-3',
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
