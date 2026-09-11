/** FR-GEN-001 / FR-GEN-002 — allowlist gate (also NFR-GEN-008: enforced in domain). */
export function canLogin(handle: string, allowlist: string[]): boolean {
  if (!handle) return false;
  const h = handle.trim().toLowerCase();
  if (!h) return false;
  return allowlist.map((x) => x.trim().toLowerCase()).includes(h);
}

export function addToAllowlist(allowlist: string[], handle: string): string[] {
  const h = handle.trim().toLowerCase();
  if (!h) return allowlist;
  if (allowlist.includes(h)) return allowlist;
  return [...allowlist, h];
}

export function removeFromAllowlist(allowlist: string[], handle: string): string[] {
  const h = handle.trim().toLowerCase();
  return allowlist.filter((x) => x !== h);
}
