import type { PersonaId, PersonaResult } from '@/domain/types';
import type { PersonaSimulatorPort, SimulationInput, SimulationOutcome } from './ports';
import { specCompleteness, tracePercent, testPassRate } from '@/domain/traceability';

const BIAS: Record<PersonaId, number> = {
  impatient: -5,
  technical: 0,
  budget_sensitive: -3,
  enterprise_buyer: -8,
  student: 5,
  founder: 2,
  skeptical_investor: -10,
  power_user: 5,
  confused_first_time: -7,
};

const NOTE: Record<PersonaId, (s: number) => string> = {
  impatient: (s) => s >= 60 ? 'Fast enough. I would try it again.' : 'Too much friction before first value.',
  technical: (s) => s >= 60 ? 'Architecture feels clean. Good test coverage signal.' : 'Spec/test signal is too thin.',
  budget_sensitive: (s) => s >= 60 ? 'Value/price ratio looks promising.' : 'Hard to justify cost yet.',
  enterprise_buyer: (s) => s >= 60 ? 'Could pilot with a team after security review.' : 'Missing controls and audit trail.',
  student: (s) => s >= 60 ? 'Easy to learn. Useful for class.' : 'Confused by setup.',
  founder: (s) => s >= 60 ? 'I would use this for my own startup.' : 'Not yet at MVP quality.',
  skeptical_investor: (s) => s >= 70 ? 'Numbers and traceability look real.' : 'Where are the validated metrics?',
  power_user: (s) => s >= 60 ? 'Keyboard-first feels right. Will customize.' : 'Lacks depth and shortcuts.',
  confused_first_time: (s) => s >= 60 ? 'I got it after a second.' : 'I am not sure what this does.',
};

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

export class MockPersonaSimulator implements PersonaSimulatorPort {
  simulate(input: SimulationInput): SimulationOutcome {
    const sc = specCompleteness(input.spec);
    if (sc < 10) return { ok: false, reason: 'SPEC_TOO_THIN' };
    const tc = tracePercent(input.spec);
    const tp = testPassRate(input.spec);
    const tech = input.startup.techExecution;

    const base = 0.4 * sc + 0.3 * tc + 0.2 * tp + 0.1 * tech;

    const results: PersonaResult[] = input.personas.map((p) => {
      const score = Math.round(clamp(base + BIAS[p]) * 10) / 10;
      return { personaId: p, score, notes: NOTE[p](score) };
    });
    return { ok: true, results };
  }
}
