import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppStoreProvider } from '@/ui/AppStore';
import { Marketplace } from '../Marketplace';
import { Login } from '../Login';

function renderApp(initialPath: string) {
  return render(
    <AppStoreProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/app/marketplace" element={<Marketplace />} />
        </Routes>
      </MemoryRouter>
    </AppStoreProvider>,
  );
}

describe('TEST-GEN-024 — Marketplace lists only published startups in active batch', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('lists Aurora/Nebula/Pulse (published) and hides Orbit (draft) after seeded login as alice', () => {
    // First login on Login route (mock).
    const { unmount } = render(
      <AppStoreProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      </AppStoreProvider>,
    );
    // Login UI exists.
    expect(screen.getByPlaceholderText(/ghp_|github_pat/)).toBeInTheDocument();
    unmount();

    // Simulate session by writing directly to localStorage.
    const stored = JSON.parse(localStorage.getItem('genesys:v0.5')!);
    stored.session = { handle: 'alice', loggedInAt: Date.now() };
    localStorage.setItem('genesys:v0.5', JSON.stringify(stored));

    renderApp('/app/marketplace');
    expect(screen.getByText('Aurora')).toBeInTheDocument();
    expect(screen.getByText('Nebula')).toBeInTheDocument();
    expect(screen.getByText('Pulse')).toBeInTheDocument();
    expect(screen.queryByText('Orbit')).not.toBeInTheDocument();
  });
});
