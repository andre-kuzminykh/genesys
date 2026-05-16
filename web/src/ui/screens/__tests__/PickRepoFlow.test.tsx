import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AppStoreProvider } from '@/ui/AppStore';
import { ThemeProvider } from '@/ui/Theme';
import { PickRepo } from '../PickRepo';

function LocationStub() {
  const loc = useLocation();
  return (
    <pre data-testid="location">{JSON.stringify({ path: loc.pathname, state: loc.state })}</pre>
  );
}

function renderApp(handle: string) {
  // Seed a session for the given handle.
  const stored = JSON.parse(localStorage.getItem('genesys:v0.7') ?? '{}');
  stored.session = { handle, loggedInAt: Date.now() };
  // we may need to load seed via AppStore first; fall back to forcing the key
  localStorage.setItem('genesys:v0.7', JSON.stringify(stored));

  return render(
    <ThemeProvider>
      <AppStoreProvider>
        <MemoryRouter initialEntries={['/onboarding/repo']}>
          <Routes>
            <Route path="/onboarding/repo" element={<PickRepo />} />
            <Route path="/coming-soon" element={<LocationStub />} />
          </Routes>
        </MemoryRouter>
      </AppStoreProvider>
    </ThemeProvider>,
  );
}

describe('TEST-GEN-181 / TEST-GEN-182 — PickRepo navigates to /coming-soon', () => {
  beforeEach(() => { localStorage.clear(); });

  it('found repo → state.flow = "import" + repo full name', async () => {
    // First mount AppStoreProvider to populate the seed at the current key.
    render(
      <ThemeProvider>
        <AppStoreProvider>
          <MemoryRouter><div /></MemoryRouter>
        </AppStoreProvider>
      </ThemeProvider>,
    ).unmount();

    renderApp('alice'); // alice has alice/aurora with spec+tests

    const user = userEvent.setup();
    const btn = screen.getByRole('button', { name: /open dashboard/i });
    await user.click(btn);

    const stub = screen.getByTestId('location');
    const payload = JSON.parse(stub.textContent ?? '{}');
    expect(payload.path).toBe('/coming-soon');
    expect(payload.state.flow).toBe('import');
    expect(payload.state.repo).toBe('alice/aurora');
  });

  it('missing repo → state.flow = "scratch" + derived startup name + rocket CTA', async () => {
    render(
      <ThemeProvider>
        <AppStoreProvider>
          <MemoryRouter><div /></MemoryRouter>
        </AppStoreProvider>
      </ThemeProvider>,
    ).unmount();

    renderApp('henry'); // henry/brisk has no spec, no tests

    const user = userEvent.setup();
    const btns = screen.getAllByRole('button', { name: /start from scratch/i });
    expect(btns.length).toBeGreaterThan(0);
    await user.click(btns[0]!);

    const stub = screen.getByTestId('location');
    const payload = JSON.parse(stub.textContent ?? '{}');
    expect(payload.path).toBe('/coming-soon');
    expect(payload.state.flow).toBe('scratch');
    expect(payload.state.repo).toBe('henry/brisk');
    expect(payload.state.startupName).toBe('Brisk');
  });
});
