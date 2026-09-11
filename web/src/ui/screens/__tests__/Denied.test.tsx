import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppStoreProvider } from '@/ui/AppStore';
import { ThemeProvider } from '@/ui/Theme';
import { Denied } from '../Denied';

describe('TEST-UC-AUTH-02-C — Denied screen', () => {
  beforeEach(() => localStorage.clear());

  it('renders the "not on the allowlist" copy + retry / back links', () => {
    render(
      <ThemeProvider>
        <AppStoreProvider>
          <MemoryRouter><Denied /></MemoryRouter>
        </AppStoreProvider>
      </ThemeProvider>,
    );
    expect(screen.getByText(/not on the allowlist/i)).toBeInTheDocument();
    const tryAgain = screen.getByRole('link', { name: /try again/i }) as HTMLAnchorElement;
    expect(tryAgain.getAttribute('href')).toBe('/login');
    const back = screen.getByRole('link', { name: /back home/i }) as HTMLAnchorElement;
    expect(back.getAttribute('href')).toBe('/');
  });
});
