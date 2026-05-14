import type { PersonaResult, PersonaId, ProductSpec, Startup } from '@/domain/types';

export interface SpecDraftNode {
  kind: 'FEATURE' | 'STORY' | 'USE_CASE' | 'SCENARIO' | 'FR' | 'NFR' | 'TEST';
  title: string;
  body: string;
  links?: { tests?: string[]; ucs?: string[]; frs?: string[]; scenarios?: string[] };
}

export interface SpecDraft {
  nodes: SpecDraftNode[];
}

export interface InterviewInput {
  idea: string;
  category: string;
  targetUser?: string;
  problem?: string;
  solution?: string;
  monetization?: string;
}

export interface AiAnalystPort {
  interview(input: InterviewInput): SpecDraft;
}

export interface SimulationInput {
  startup: Startup;
  spec: ProductSpec;
  personas: PersonaId[];
}

export type SimulationOutcome =
  | { ok: true; results: PersonaResult[] }
  | { ok: false; reason: 'SPEC_TOO_THIN' };

export interface PersonaSimulatorPort {
  simulate(input: SimulationInput): SimulationOutcome;
}
