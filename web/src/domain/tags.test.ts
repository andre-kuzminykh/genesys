import { describe, it, expect } from 'vitest';
import { filterByTags, normalizeTag, normalizeTags, popularTags, toggleTag } from './tags';

const startup = (id: string, hashtags: string[]) => ({
  id, batchId: 'B1', ownerHandle: 'x', name: id, pitch: '', category: '',
  hashtags, published: true, createdAt: 0,
  techExecution: 0, marketPotential: 0, pitchScore: 0, currentMode: 'MODE-1' as const,
});

describe('TEST-GEN-110 — hashtag normalization', () => {
  it('lowercases, strips #, kebab-cases', () => {
    expect(normalizeTag(' #AI Image ')).toBe('ai-image');
    expect(normalizeTag('##LLM_evals!!')).toBe('llm-evals');
    expect(normalizeTag('   ')).toBe('');
  });
  it('dedupes and drops empties', () => {
    expect(normalizeTags(['#AI', 'ai', '#image', '', 'image'])).toEqual(['ai', 'image']);
  });
});

describe('TEST-GEN-111 — AND filter', () => {
  const items = [
    startup('a', ['image', 'b2b']),
    startup('b', ['image', 'b2c']),
    startup('c', ['audio', 'b2b']),
  ];
  it('returns intersection (superset semantics)', () => {
    expect(filterByTags(items, ['image']).map((x) => x.id)).toEqual(['a', 'b']);
    expect(filterByTags(items, ['image', 'b2b']).map((x) => x.id)).toEqual(['a']);
    expect(filterByTags(items, ['image', 'b2b', 'audio'])).toEqual([]);
  });
  it('empty selection returns input', () => {
    expect(filterByTags(items, [])).toEqual(items);
  });
});

describe('TEST-GEN-112 — popularTags sorted by frequency', () => {
  const items = [
    startup('a', ['image', 'b2b']),
    startup('b', ['image', 'b2c']),
    startup('c', ['image']),
    startup('d', ['audio', 'b2b']),
  ];
  it('sorts by count desc, alpha tie-break', () => {
    const out = popularTags(items, 10);
    expect(out[0]).toEqual({ tag: 'image', count: 3 });
    expect(out[1]).toEqual({ tag: 'b2b', count: 2 });
    expect(out[2]).toEqual({ tag: 'audio', count: 1 });
    expect(out[3]).toEqual({ tag: 'b2c', count: 1 });
  });
});

describe('toggleTag', () => {
  it('adds if missing, removes if present', () => {
    expect(toggleTag(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleTag(['a', 'b'], 'A')).toEqual(['b']);
  });
});
