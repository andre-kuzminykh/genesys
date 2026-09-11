import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppStoreProvider } from '@/ui/AppStore';
import { ThemeProvider } from '@/ui/Theme';
import { Leaderboard } from '../Leaderboard';

const FORECAST_KEY = 'genesys:forecast:v1';

function serverForecast(startupId: string, startupName: string) {
  const months = ['2026-05', '2026-06', '2026-07'];
  return {
    runAt: Date.now(),
    months,
    startups: [{
      startupId,
      startupName,
      monthly: months.map((month, i) => ({ month, users: 1000 * (i + 1), revenueUSD: 5000 * (i + 1) })),
      endUsers: 3000,
      totalRevenueUSD: 30000,
      userReview: { personaIds: ['impatient'], score: 71, notes: 'panel notes', upvoteBump: 3, perPersona: [] },
      marketReview: { score: 64, notes: 'market notes', trends: [] },
      recommendation: 'ship the integration',
      events: months.map((month) => ({ month, event: 'something happened' })),
    }],
    winner: { startupId, startupName, reasoning: 'strongest combination of pull and retention' },
    userSummary: 'panel summary',
    marketSummary: 'market summary',
    overallSummary: 'overall summary',
  };
}

function installFetchMock(forecastResponse: { ok: boolean; status: number; body: unknown }) {
  globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
    const u = String(url);
    if (u === '/api/forecast') {
      return {
        ok: forecastResponse.ok,
        status: forecastResponse.status,
        json: async () => forecastResponse.body,
      } as Response;
    }
    if (u === '/api/state') {
      return { ok: true, status: 200, json: async () => ({ upvotes: {}, investments: [] }) } as Response;
    }
    return { ok: false, status: 404, json: async () => ({ error: 'NO_ROUTE' }) } as Response;
  }) as unknown as typeof fetch;
}

function renderLeaderboard() {
  return render(
    <ThemeProvider>
      <AppStoreProvider>
        <MemoryRouter initialEntries={['/leaderboard']}>
          <Leaderboard />
        </MemoryRouter>
      </AppStoreProvider>
    </ThemeProvider>,
  );
}

describe('TEST-FR-FORECAST-003-C — Leaderboard hydrates from GET /api/forecast', () => {
  beforeEach(() => { localStorage.clear(); });

  it('pulls the stored server forecast when the browser has no cached run', async () => {
    // S-artrise is in the seed cohort, so the hydrated forecast passes the
    // "still references existing startups" guard in the pre-warm effect.
    installFetchMock({ ok: true, status: 200, body: serverForecast('S-artrise', 'ArtRise') });
    renderLeaderboard();

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/forecast', expect.anything());
    });
    // The winner reasoning from the server payload reaches the screen.
    await waitFor(() => {
      expect(screen.getByText(/strongest combination of pull and retention/i)).toBeInTheDocument();
    });
    // And it is written through to the local cache so a reload is instant.
    expect(localStorage.getItem(FORECAST_KEY)).toContain('S-artrise');
  });

  it('stays empty and does not throw when the server has no forecast (404)', async () => {
    installFetchMock({ ok: false, status: 404, body: { ok: false, error: 'NO_FORECAST' } });
    renderLeaderboard();

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/forecast', expect.anything());
    });
    expect(localStorage.getItem(FORECAST_KEY)).toBeNull();
  });

  it('does not overwrite a forecast the browser already has cached', async () => {
    localStorage.setItem(FORECAST_KEY, JSON.stringify(serverForecast('S-stylify', 'Stylify')));
    installFetchMock({ ok: true, status: 200, body: serverForecast('S-artrise', 'ArtRise') });
    renderLeaderboard();

    // Give the mount effects a turn; the local run should short-circuit the fetch.
    await new Promise((r) => setTimeout(r, 50));
    const calls = (globalThis.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls;
    expect(calls.some((c) => String(c[0]) === '/api/forecast')).toBe(false);
    expect(localStorage.getItem(FORECAST_KEY)).toContain('S-stylify');
  });
});
