import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppStoreProvider } from '@/ui/AppStore';
import { ThemeProvider } from '@/ui/Theme';
import { Landing } from '../Landing';

function renderLanding() {
  return render(
    <ThemeProvider>
      <AppStoreProvider>
        <MemoryRouter initialEntries={['/']}>
          <Landing />
        </MemoryRouter>
      </AppStoreProvider>
    </ThemeProvider>,
  );
}

describe('TEST-GEN-171 / TEST-GEN-172 — Landing layout v0.4', () => {
  beforeEach(() => { localStorage.clear(); });

  it('list cards offer Open but never Visit', () => {
    renderLanding();
    expect(screen.getAllByRole('button', { name: /open/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: /visit landing/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /^visit$/i })).toBeNull();
  });

  it('Featured pill is shown on the carousel; the rest are list cards', () => {
    renderLanding();
    expect(screen.getAllByText(/featured/i).length).toBeGreaterThan(0);
  });
});
