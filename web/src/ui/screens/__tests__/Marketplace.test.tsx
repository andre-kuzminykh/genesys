import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppStoreProvider } from '@/ui/AppStore';
import { ThemeProvider } from '@/ui/Theme';
import { Marketplace } from '../Marketplace';
import { Login } from '../Login';

function renderApp(initialPath: string) {
  return render(
    <ThemeProvider>
      <AppStoreProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/app/marketplace" element={<Marketplace />} />
          </Routes>
        </MemoryRouter>
      </AppStoreProvider>
    </ThemeProvider>,
  );
}

describe('TEST-GEN-024 — Marketplace lists only published startups in active batch', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('lists ArtRise/Shelfly/Stylify after seeded login as a cohort member', () => {
    // mount once to seed the current key
    const { unmount } = render(
      <ThemeProvider>
        <AppStoreProvider>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<Login />} />
            </Routes>
          </MemoryRouter>
        </AppStoreProvider>
      </ThemeProvider>,
    );
    expect(screen.getByPlaceholderText(/ghp_|github_pat/)).toBeInTheDocument();
    unmount();

    // Simulate session by writing directly to localStorage.
    const stored = JSON.parse(localStorage.getItem('genesys:v0.7')!);
    stored.session = { handle: 'artem-grigorash', loggedInAt: Date.now() };
    localStorage.setItem('genesys:v0.7', JSON.stringify(stored));

    renderApp('/app/marketplace');
    expect(screen.getByText('ArtRise')).toBeInTheDocument();
    expect(screen.getByText('Shelfly')).toBeInTheDocument();
    expect(screen.getByText('Stylify')).toBeInTheDocument();
  });
});
