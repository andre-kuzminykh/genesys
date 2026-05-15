import { describe, it, expect } from 'vitest';
import { scanRepo, type MockRepo } from './repoScan';

const base: MockRepo = {
  fullName: 'alice/sample',
  language: 'TypeScript',
  stars: 0,
  pushedDaysAgo: 1,
  hasSpec: false,
  hasTests: false,
};

describe('TEST-GEN-140 — scanRepo classification', () => {
  it('found when both spec and tests present', () => {
    const r = scanRepo({ ...base, hasSpec: true, hasTests: true });
    expect(r.kind).toBe('found');
    if (r.kind === 'found') {
      expect(r.specPath).toBe('/genesys/spec');
      expect(r.testsPath).toBe('/genesys/tests');
      expect(r.nodeCountHint).toBeGreaterThanOrEqual(20);
      expect(r.nodeCountHint).toBeLessThanOrEqual(80);
    }
  });
  it('partial when only spec', () => {
    const r = scanRepo({ ...base, hasSpec: true, hasTests: false });
    expect(r.kind).toBe('partial');
    if (r.kind === 'partial') {
      expect(r.specPath).toBe('/genesys/spec');
      expect(r.testsPath).toBeNull();
    }
  });
  it('partial when only tests', () => {
    const r = scanRepo({ ...base, hasSpec: false, hasTests: true });
    expect(r.kind).toBe('partial');
  });
  it('missing otherwise', () => {
    const r = scanRepo({ ...base, hasSpec: false, hasTests: false });
    expect(r.kind).toBe('missing');
  });
  it('is deterministic — same input yields same nodeCount estimate', () => {
    const a = scanRepo({ ...base, hasSpec: true, hasTests: true });
    const b = scanRepo({ ...base, hasSpec: true, hasTests: true });
    expect(a).toEqual(b);
  });
});
