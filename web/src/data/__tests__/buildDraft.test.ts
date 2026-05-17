import { describe, it, expect, beforeEach } from 'vitest';
import { EMPTY_DRAFT, loadDraft, saveDraft, randomId } from '../buildDraft';

const KEY = 'genesys:build-draft:v1';

describe('TEST-FR-BUILD-003-D — loadDraft is defensive', () => {
  beforeEach(() => localStorage.clear());

  it('returns the empty draft when localStorage is empty', () => {
    expect(loadDraft()).toEqual(EMPTY_DRAFT);
  });

  it('returns the empty draft when the stored value is corrupt JSON', () => {
    localStorage.setItem(KEY, '{not valid json');
    expect(loadDraft()).toEqual(EMPTY_DRAFT);
  });

  it('normalises partial / malformed shapes without throwing', () => {
    localStorage.setItem(KEY, JSON.stringify({
      product: { user: 'who', metrics: 'oops not an array' },
      features: 'oops not an array',
      workingFeatureId: 42,
      updatedAt: 'long ago',
    }));
    const d = loadDraft();
    expect(d.product.user).toBe('who');
    expect(d.product.problem).toBe('');
    expect(d.product.metrics).toEqual(['']);
    expect(d.features).toEqual([]);
    expect(d.workingFeatureId).toBeNull();
    expect(d.updatedAt).toBe(0);
  });
});

describe('TEST-FR-BUILD-004-D — saveDraft round-trips + stamps updatedAt', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips every field through localStorage and stamps updatedAt', () => {
    const before = Date.now();
    const draft = {
      product: { user: 'A', problem: 'B', solution: 'C', metrics: ['m1', 'm2'], coverImage: '' },
      features: [
        { id: randomId(), name: 'F1', oneliner: 'one', priority: 'must' as const },
        { id: randomId(), name: 'F2', oneliner: 'two', priority: 'should' as const },
      ],
      workingFeatureId: null,
      updatedAt: 0,
    };
    saveDraft(draft);
    const reloaded = loadDraft();
    expect(reloaded.product).toEqual(draft.product);
    expect(reloaded.features).toEqual(draft.features);
    expect(reloaded.workingFeatureId).toBeNull();
    expect(reloaded.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it('normalises an unknown priority value to "should"', () => {
    localStorage.setItem(KEY, JSON.stringify({
      product: { user: 'u', problem: 'p', solution: 's', metrics: ['x'] },
      features: [{ id: 'a', name: 'X', oneliner: '', priority: 'random-junk' }],
    }));
    const d = loadDraft();
    expect(d.features[0]!.priority).toBe('should');
  });
});
