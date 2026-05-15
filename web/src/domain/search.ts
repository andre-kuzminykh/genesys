import type { Startup } from './types';

/** FR-GEN-120 / FR-GEN-121 — case-insensitive substring across name/pitch/description/hashtags. */
export function searchStartups<T extends Pick<Startup, 'name' | 'pitch' | 'description' | 'hashtags'>>(
  items: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((s) => {
    if (s.name.toLowerCase().includes(q)) return true;
    if (s.pitch.toLowerCase().includes(q)) return true;
    if (s.description && s.description.toLowerCase().includes(q)) return true;
    for (const t of s.hashtags) if (t.includes(q)) return true;
    return false;
  });
}
