import type { Startup } from './types';

/** Normalize a user-typed hashtag — lowercase, trim, collapse whitespace to `-`, strip leading `#`. */
export function normalizeTag(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^#+/, '')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Normalize an array, dedupe, drop empties. */
export function normalizeTags(input: readonly string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    const t = normalizeTag(raw);
    if (!t) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/** FR-GEN-111 — AND filter: startup must contain every selected tag. */
export function filterByTags<T extends { hashtags: string[] }>(items: T[], selected: readonly string[]): T[] {
  const tags = normalizeTags(selected);
  if (tags.length === 0) return items;
  return items.filter((s) => tags.every((t) => s.hashtags.includes(t)));
}

/** FR-GEN-112 — popular tags sorted by frequency desc, then alpha. */
export function popularTags(items: readonly Startup[], limit = 20): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const s of items) {
    for (const t of s.hashtags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => (b.count - a.count) || a.tag.localeCompare(b.tag))
    .slice(0, limit);
}

export function toggleTag(selected: readonly string[], tag: string): string[] {
  const t = normalizeTag(tag);
  if (!t) return [...selected];
  return selected.includes(t) ? selected.filter((x) => x !== t) : [...selected, t];
}
