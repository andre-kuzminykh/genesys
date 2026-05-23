import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppStoreProvider } from '@/ui/AppStore';
import { ThemeProvider } from '@/ui/Theme';
import { ServerStoreProvider, useServer } from '@/ui/ServerStore';

const STORAGE_KEY = 'genesys:v0.9';
const STATE_EMPTY = { ok: true, status: 200, json: async () => ({ upvotes: {}, investments: [] }) };

type RouteMap = {
  [url: string]: { [method: string]: () => Promise<Partial<Response>> };
};

function installFetchMock(routes: RouteMap) {
  globalThis.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const u = String(url);
    const m = (init?.method ?? 'GET').toUpperCase();
    const handler = routes[u]?.[m] ?? (async () => ({ ok: false, status: 404, json: async () => ({ error: 'NO_ROUTE' }) }));
    return (await handler()) as Response;
  }) as unknown as typeof fetch;
}

function plantSessionAndRender(handle: string | null) {
  const Probe = () => { useServer(); return null; };
  const Tree = () => (
    <ThemeProvider>
      <AppStoreProvider>
        <ServerStoreProvider>
          <MemoryRouter><Probe /></MemoryRouter>
        </ServerStoreProvider>
      </AppStoreProvider>
    </ThemeProvider>
  );
  // Seed AppStore localStorage with the current schema, then patch session.
  render(<Tree />).unmount();
  if (handle) {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    stored.session = { handle, loggedInAt: Date.now(), accessToken: 'gh-token' };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }
  // Real mount that the test interacts with.
  let server!: ReturnType<typeof useServer>;
  const ProbeReal = () => { server = useServer(); return null; };
  const FinalTree = () => (
    <ThemeProvider>
      <AppStoreProvider>
        <ServerStoreProvider>
          <MemoryRouter><ProbeReal /></MemoryRouter>
        </ServerStoreProvider>
      </AppStoreProvider>
    </ThemeProvider>
  );
  render(<FinalTree />);
  return { get server() { return server; } };
}

describe('TEST-FR-UPVOTE-005-C — ServerStore.toggleUpvote optimistic flip + rollback', () => {
  beforeEach(() => { localStorage.clear(); });

  it('NO_TOKEN outcome when there is no session', async () => {
    installFetchMock({ '/api/state': { GET: async () => STATE_EMPTY } });
    const handle = plantSessionAndRender(null);
    await waitFor(() => expect(handle.server.loading).toBe(false));

    let outcome;
    await act(async () => { outcome = await handle.server.toggleUpvote('S-artrise'); });
    expect(outcome!.ok).toBe(false);
    if (!outcome!.ok) expect(outcome!.code).toBe('NO_TOKEN');
    expect(handle.server.upvoteCount('S-artrise')).toBe(0);
  });

  it('flips locally first and reconciles with the server response', async () => {
    installFetchMock({
      '/api/state':  { GET:  async () => STATE_EMPTY },
      '/api/upvote': { POST: async () => ({ ok: true, status: 200, json: async () => ({ ok: true, voted: true, count: 1, login: 'mashan555', startupId: 'S-artrise' }) }) },
    });
    const handle = plantSessionAndRender('mashan555');
    await waitFor(() => expect(handle.server.loading).toBe(false));

    await act(async () => { await handle.server.toggleUpvote('S-artrise'); });
    expect(handle.server.hasVoted('S-artrise')).toBe(true);
    expect(handle.server.upvoteCount('S-artrise')).toBe(1);
  });

  it('rolls the optimistic flip back when the server rejects with 403', async () => {
    installFetchMock({
      '/api/state':  { GET:  async () => STATE_EMPTY },
      '/api/upvote': { POST: async () => ({ ok: false, status: 403, json: async () => ({ error: 'NOT_IN_ALLOWLIST' }) }) },
    });
    const handle = plantSessionAndRender('mashan555');
    await waitFor(() => expect(handle.server.loading).toBe(false));

    let outcome;
    await act(async () => { outcome = await handle.server.toggleUpvote('S-artrise'); });
    expect(outcome!.ok).toBe(false);
    if (!outcome!.ok) expect(outcome!.code).toBe('NOT_IN_ALLOWLIST');
    expect(handle.server.hasVoted('S-artrise')).toBe(false);
    expect(handle.server.upvoteCount('S-artrise')).toBe(0);
  });
});
