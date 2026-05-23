import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppStoreProvider } from '@/ui/AppStore';
import { ThemeProvider } from '@/ui/Theme';
import { AuthSuccess } from '../AuthSuccess';

describe('TEST-FR-AUTH-002-C — AuthSuccess', () => {
  beforeEach(() => {
    localStorage.clear();
    // Token in URL fragment — the screen reads it on mount.
    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: {
        ...window.location,
        hash: '',
        pathname: '/auth/success',
        href: 'http://localhost/auth/success',
      },
    });
  });

  it('surfaces an error when there is no token in the URL fragment', async () => {
    render(
      <ThemeProvider>
        <AppStoreProvider>
          <MemoryRouter initialEntries={['/auth/success']}><AuthSuccess /></MemoryRouter>
        </AppStoreProvider>
      </ThemeProvider>,
    );
    expect(await screen.findByText(/no token in callback url/i)).toBeInTheDocument();
  });

  it('renders the wordmark + "Signing you in" copy', () => {
    render(
      <ThemeProvider>
        <AppStoreProvider>
          <MemoryRouter initialEntries={['/auth/success']}><AuthSuccess /></MemoryRouter>
        </AppStoreProvider>
      </ThemeProvider>,
    );
    expect(screen.getByLabelText(/Genesys/i)).toBeInTheDocument();
    expect(screen.getByText(/signing you in with github/i)).toBeInTheDocument();
  });
});
