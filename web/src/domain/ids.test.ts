import { describe, it, expect } from 'vitest';
import { buildSpecId, nextId, parseSpecId } from './ids';

describe('TEST-GEN-010 — ID generator', () => {
  it('builds zero-padded IDs', () => {
    expect(buildSpecId('FEATURE', 1)).toBe('FEAT-GEN-001');
    expect(buildSpecId('FR', 42)).toBe('FR-GEN-042');
    expect(buildSpecId('TEST', 100)).toBe('TEST-GEN-100');
  });

  it('parses well-formed IDs', () => {
    expect(parseSpecId('FEAT-GEN-001')).toEqual({ prefix: 'FEAT', ns: 'GEN', n: 1 });
    expect(parseSpecId('TEST-GEN-099')).toEqual({ prefix: 'TEST', ns: 'GEN', n: 99 });
  });

  it('rejects malformed IDs', () => {
    expect(parseSpecId('feat-001')).toBeNull();
    expect(parseSpecId('FEATURE-GEN-1')).toBeNull(); // wrong prefix
  });

  it('nextId is monotonic per kind', () => {
    const ids = ['FEAT-GEN-001', 'FEAT-GEN-002', 'FR-GEN-005'];
    expect(nextId('FEATURE', ids)).toBe('FEAT-GEN-003');
    expect(nextId('FR', ids)).toBe('FR-GEN-006');
    expect(nextId('TEST', ids)).toBe('TEST-GEN-001');
  });
});
