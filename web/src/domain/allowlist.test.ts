import { describe, it, expect } from 'vitest';
import { addToAllowlist, canLogin, removeFromAllowlist } from './allowlist';

describe('TEST-GEN-001 / TEST-GEN-002 — allowlist gate', () => {
  it('permits allowlisted handle (case-insensitive)', () => {
    expect(canLogin('alice', ['alice', 'bob'])).toBe(true);
    expect(canLogin('Alice', ['alice', 'bob'])).toBe(true);
    expect(canLogin('  alice  ', ['alice', 'bob'])).toBe(true);
  });

  it('denies handle not on the allowlist', () => {
    expect(canLogin('carol', ['alice', 'bob'])).toBe(false);
    expect(canLogin('', ['alice'])).toBe(false);
  });
});

describe('TEST-GEN-003 — allowlist CRUD', () => {
  it('adds without duplicates and lowercases', () => {
    const out = addToAllowlist(['alice'], 'Bob');
    expect(out).toEqual(['alice', 'bob']);
    expect(addToAllowlist(out, 'bob')).toEqual(['alice', 'bob']);
  });

  it('removes handle', () => {
    expect(removeFromAllowlist(['alice', 'bob'], 'Alice')).toEqual(['bob']);
  });
});
