// Domain types — framework-agnostic. No React imports here.

export type ArtifactStatus =
  | 'DRAFT'
  | 'REVIEW_READY'
  | 'APPROVED'
  | 'UPDATED'
  | 'DEPRECATED'
  | 'REPLACED'
  | 'OBSOLETE'
  | 'BLOCKED'
  | 'PARTIAL'
  | 'FINAL';

export type Mode =
  | 'MODE-1' // PRD
  | 'MODE-2' // BRS
  | 'MODE-3' // Architecture
  | 'MODE-4' // Test Strategy
  | 'MODE-5' // Project Plan
  | 'MODE-6' // TDD Implementation
  | 'MODE-7' // Dashboard
  | 'MODE-8'; // Brownfield CR

export type Role = 'admin' | 'founder' | 'student';

export interface User {
  handle: string; // github handle, lowercased
  name: string;
  role: Role;
  avatarSeed?: string;
}

export type SelfInvestPolicy = 'ALLOWED' | 'LIMITED' | 'FORBIDDEN';

export interface ScoringWeights {
  specCompleteness: number;
  testPassRate: number;
  techExecution: number;
  personaSatisfaction: number;
  investorDemand: number;
  marketPotential: number;
  pitchScore: number;
}

export interface Batch {
  id: string;
  name: string;
  allowlist: string[]; // github handles, lowercased
  creditsPerInvestor: number;
  selfInvestPolicy: SelfInvestPolicy;
  weights: ScoringWeights;
  createdAt: number;
}

export type SpecKind =
  | 'FEATURE'
  | 'STORY'
  | 'FLOW'
  | 'USE_CASE'
  | 'SCENARIO'
  | 'FR'
  | 'NFR'
  | 'TEST'
  | 'TASK';

export interface SpecNode {
  id: string; // e.g. FEAT-GEN-001
  startupId: string;
  kind: SpecKind;
  version: number; // 1,2,3...
  status: ArtifactStatus;
  title: string;
  body: string;
  parentIds: string[]; // links upward in the hierarchy
  links: {
    tests: string[];
    ucs: string[];
    frs: string[];
    scenarios: string[];
  };
  prevVersionId?: string;
  changedFields?: string[];
  reason?: string;
  author?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Entity {
  id: string;
  name: string;
  fields: string[];
  relations: { to: string; type: '1-1' | '1-N' | 'N-N'; label?: string }[];
}

export interface Component {
  id: string;
  name: string;
  layer: 'client' | 'service' | 'ai' | 'data' | 'infra';
}

export interface DataFlowEdge {
  from: string; // component id
  to: string;
  label?: string;
}

export interface Architecture {
  entities: Entity[];
  components: Component[];
  dataFlow: DataFlowEdge[];
}

export interface Startup {
  id: string;
  batchId: string;
  ownerHandle: string;
  name: string;
  pitch: string; // one-line
  category: string;
  description?: string;
  landingUrl?: string;
  repo?: string; // owner/repo
  published: boolean;
  createdAt: number;
  // Auxiliary metrics that are not derivable purely from spec:
  techExecution: number; // 0..100
  marketPotential: number; // 0..100
  pitchScore: number; // 0..100
  currentMode: Mode;
}

export interface ProductSpec {
  startupId: string;
  nodes: SpecNode[];
  architecture: Architecture;
}

export interface Investment {
  id: string;
  batchId: string;
  investorHandle: string;
  startupId: string;
  amount: number;
  createdAt: number;
}

export type PersonaId =
  | 'impatient'
  | 'technical'
  | 'budget_sensitive'
  | 'enterprise_buyer'
  | 'student'
  | 'founder'
  | 'skeptical_investor'
  | 'power_user'
  | 'confused_first_time';

export interface PersonaResult {
  personaId: PersonaId;
  score: number; // 0..100
  notes: string;
}

export interface SimulationRun {
  id: string;
  startupId: string;
  personas: PersonaId[];
  results: PersonaResult[];
  createdAt: number;
}

export interface Score {
  startupId: string;
  specCompleteness: number;
  traceCoverage: number;
  testPassRate: number;
  personaSatisfaction: number;
  investorDemand: number; // normalized 0..100 within batch
  marketPotential: number;
  pitchScore: number;
  techExecution: number;
  readiness: number;
}

export interface Session {
  handle: string;
  loggedInAt: number;
}

export interface AppState {
  session: Session | null;
  users: User[];
  batches: Batch[];
  startups: Startup[];
  specs: ProductSpec[];
  investments: Investment[];
  simulations: SimulationRun[];
  activeBatchId: string;
}
