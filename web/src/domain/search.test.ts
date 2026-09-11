import { describe, it, expect } from 'vitest';
import { searchStartups } from './search';

const s = (n: string, p: string, d?: string, tags: string[] = []) => ({
  name: n, pitch: p, description: d, hashtags: tags,
});

describe('TEST-GEN-120 / TEST-GEN-121 — search', () => {
  const items = [
    s('Aurora', 'spec-first studio', 'turns idea into traceable spec', ['ai', 'devtools']),
    s('Nebula', 'agentic ops', 'support agents', ['agents', 'sales']),
    s('Pulse', 'LLM evals', 'production observability', ['llm-evals', 'data']),
  ];

  it('returns input when query is empty', () => {
    expect(searchStartups(items, '   ')).toEqual(items);
  });

  it('matches on name', () => {
    expect(searchStartups(items, 'auro')).toHaveLength(1);
  });
  it('matches on pitch', () => {
    expect(searchStartups(items, 'evals')).toHaveLength(1);
  });
  it('matches on description', () => {
    expect(searchStartups(items, 'traceable')).toHaveLength(1);
  });
  it('matches on hashtag', () => {
    expect(searchStartups(items, 'agents').map((x) => x.name)).toEqual(['Nebula']);
  });
  it('is case-insensitive', () => {
    expect(searchStartups(items, 'PULSE')).toHaveLength(1);
  });
});
