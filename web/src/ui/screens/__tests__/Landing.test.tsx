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

describe('TEST-GEN-214 — Landing list is a responsive 2-column grid', () => {
  beforeEach(() => { localStorage.clear(); });

  it('renders the cards container as a grid with 1 column on mobile and 2 at md+', () => {
    const { container } = renderLanding();
    // The list is the single <ul> inside <main>.
    const ul = container.querySelector('main ul') as HTMLElement;
    expect(ul).not.toBeNull();
    expect(ul.className).toContain('grid');
    expect(ul.className).toContain('grid-cols-1');
    expect(ul.className).toContain('md:grid-cols-2');
  });
});

describe('TEST-FR-LAND-002-C — Featured carousel cycles through every cohort startup', () => {
  beforeEach(() => { localStorage.clear(); });

  it('renders one navigation dot per published cohort startup (16, not 4)', () => {
    renderLanding();
    // Each dot is rendered with aria-label "Go to slide N" — count them
    // and make sure the carousel covers the entire 16-startup roster instead
    // of the legacy top-4 slice.
    const dots = screen.getAllByRole('button', { name: /^Go to slide \d+$/i });
    expect(dots.length).toBe(16);
    // The last slide must be reachable — proves the carousel is not capped at 4.
    expect(screen.getByRole('button', { name: /^Go to slide 16$/i })).toBeInTheDocument();
  });

  it('exposes prev/next controls so visitors can drive the carousel manually', () => {
    renderLanding();
    expect(screen.getByRole('button', { name: /^previous$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^next$/i })).toBeInTheDocument();
  });
});
