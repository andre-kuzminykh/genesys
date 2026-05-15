import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { looksLikePAT, verifyToken, listRepos, pathExists, scanRepoLive, GhError } from './github';

const realFetch = globalThis.fetch;

function jsonRes(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('TEST-GEN-200 — looksLikePAT', () => {
  it('matches the common PAT prefixes', () => {
    expect(looksLikePAT('ghp_abcdef')).toBe(true);
    expect(looksLikePAT('github_pat_11ABCDEF')).toBe(true);
    expect(looksLikePAT('gho_x')).toBe(true);
    expect(looksLikePAT('ghs_x')).toBe(true);
  });
  it('rejects plain handles', () => {
    expect(looksLikePAT('alice')).toBe(false);
    expect(looksLikePAT('andre-kuzminykh')).toBe(false);
    expect(looksLikePAT('')).toBe(false);
  });
});

describe('TEST-GEN-201 — verifyToken success + failure', () => {
  beforeEach(() => { vi.spyOn(globalThis, 'fetch'); });
  afterEach(() => { globalThis.fetch = realFetch; });

  it('returns the user on 200', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce(jsonRes(200, { login: 'andre-kuzminykh', name: 'Andre', avatar_url: 'https://x.png' }));
    const u = await verifyToken('ghp_x');
    expect(u.login).toBe('andre-kuzminykh');
    const call = (globalThis.fetch as any).mock.calls[0];
    expect(call[0]).toBe('https://api.github.com/user');
    expect(call[1].headers.Authorization).toBe('token ghp_x');
  });

  it('throws GhError on 401', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce(jsonRes(401, { message: 'Bad credentials' }));
    await expect(verifyToken('ghp_bad')).rejects.toBeInstanceOf(GhError);
  });
});

describe('TEST-GEN-202 — listRepos + pathExists + scanRepoLive', () => {
  beforeEach(() => { vi.spyOn(globalThis, 'fetch'); });
  afterEach(() => { globalThis.fetch = realFetch; });

  it('lists repos with pushed sort + per_page', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce(jsonRes(200, [
      { full_name: 'andre/foo', language: 'TypeScript', stargazers_count: 5, pushed_at: new Date().toISOString(), default_branch: 'main', private: false },
    ]));
    const repos = await listRepos('ghp_x', 10);
    expect(repos).toHaveLength(1);
    const call = (globalThis.fetch as any).mock.calls[0];
    expect(call[0]).toContain('sort=pushed');
    expect(call[0]).toContain('per_page=10');
  });

  it('pathExists is true on 200, false on 404', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce(new Response('{}', { status: 200 }));
    expect(await pathExists('ghp_x', 'a/b', 'genesys/spec')).toBe(true);
    (globalThis.fetch as any).mockResolvedValueOnce(new Response('Not Found', { status: 404 }));
    expect(await pathExists('ghp_x', 'a/b', 'genesys/spec')).toBe(false);
  });

  it('scanRepoLive sets hasSpec/hasTests by parallel probes', async () => {
    // 5 SPEC paths + 5 TEST paths = 10 calls. Mock the first as 200, rest 404.
    const responses = Array.from({ length: 10 }, (_, i) =>
      i === 0 || i === 5
        ? new Response('{}', { status: 200 })   // genesys/spec and genesys/tests exist
        : new Response('nope', { status: 404 }),
    );
    let i = 0;
    (globalThis.fetch as any).mockImplementation(async () => responses[i++]!);
    const out = await scanRepoLive('ghp_x', {
      full_name: 'a/b', language: 'TS', stargazers_count: 1, pushed_at: new Date().toISOString(), default_branch: 'main', private: false,
    });
    expect(out.hasSpec).toBe(true);
    expect(out.hasTests).toBe(true);
  });
});
