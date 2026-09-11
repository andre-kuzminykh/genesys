import { describe, it, expect } from 'vitest';
import { seedState } from './seed';

describe('TEST-GEN-163 — allowlist contains andre-kuzminykh', () => {
  it('the seeded batch allowlists the real user', () => {
    const s = seedState();
    const batch = s.batches.find((b) => b.id === s.activeBatchId)!;
    expect(batch.allowlist).toContain('andre-kuzminykh');
  });
});

describe('seed shape sanity', () => {
  it('every published startup has hashtags and a description', () => {
    const s = seedState();
    for (const x of s.startups.filter((s) => s.published)) {
      expect(x.hashtags.length).toBeGreaterThan(0);
      expect((x.description ?? '').length).toBeGreaterThan(120);
    }
  });
});
