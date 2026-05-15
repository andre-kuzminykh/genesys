import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppStoreProvider } from '@/ui/AppStore';
import { ThemeProvider } from '@/ui/Theme';
import { ComingSoon } from '../ComingSoon';

describe('TEST-GEN-183 — ComingSoon screen', () => {
  it('renders the placeholder copy and a way back to the repo picker', () => {
    render(
      <ThemeProvider>
        <AppStoreProvider>
          <MemoryRouter>
            <ComingSoon />
          </MemoryRouter>
        </AppStoreProvider>
      </ThemeProvider>,
    );
    expect(screen.getByText(/we'll launch this soon/i)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /pick another repo/i }).length).toBeGreaterThan(0);
  });
});
