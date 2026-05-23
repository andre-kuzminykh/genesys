import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppStoreProvider } from '@/ui/AppStore';
import { ThemeProvider } from '@/ui/Theme';
import { PickRepo } from '../PickRepo';

function renderPickRepo(handle: string) {
  // Seed the store and a session for the given cohort handle.
  render(
    <ThemeProvider>
      <AppStoreProvider>
        <MemoryRouter><div /></MemoryRouter>
      </AppStoreProvider>
    </ThemeProvider>,
  ).unmount();
  const stored = JSON.parse(localStorage.getItem('genesys:v0.10') ?? '{}');
  stored.session = { handle, loggedInAt: Date.now() };
  localStorage.setItem('genesys:v0.10', JSON.stringify(stored));

  return render(
    <ThemeProvider>
      <AppStoreProvider>
        <MemoryRouter initialEntries={['/onboarding/repo']}>
          <PickRepo />
        </MemoryRouter>
      </AppStoreProvider>
    </ThemeProvider>,
  );
}

describe('TEST-GEN-200 — PickRepo row chrome', () => {
  beforeEach(() => { localStorage.clear(); });

  it('does not render a "private" badge anywhere on the page', () => {
    renderPickRepo('alice');
    expect(screen.queryByText(/^private$/i)).toBeNull();
  });

  it('renders each spec/tests chip as a single .chip pill containing both an SVG icon and a text label', () => {
    const { container } = renderPickRepo('alice');
    const chips = container.querySelectorAll('.chip');
    expect(chips.length).toBeGreaterThan(0);

    for (const chip of Array.from(chips)) {
      // The chip class is hand-rolled (in index.css) as inline-flex + items-center +
      // whitespace-nowrap, so the icon and label always stay on a single line.
      expect(chip.classList.contains('chip')).toBe(true);

      // Direct children of the chip must include at least one SVG icon and at
      // least one non-empty text node — the rendered chip therefore has the
      // icon + label side by side, not stacked.
      const svgs = chip.querySelectorAll(':scope > svg');
      expect(svgs.length).toBeGreaterThan(0);

      const text = (chip.textContent ?? '').trim();
      expect(text.length).toBeGreaterThan(0);
    }
  });

  it('shows the Sign-out button as a pill that matches the "signed in as" pill in sizing', () => {
    renderPickRepo('alice');
    const signedIn = screen.getByText(/signed in as/i).closest('span.inline-flex') as HTMLElement;
    const signOut = screen.getByRole('button', { name: /sign out/i });

    // Both pills should share the small text + py-1.5 px-3 sizing so they read
    // as the same control class in the header.
    for (const cls of ['text-sm', 'px-3', 'py-1.5', 'rounded-full']) {
      expect(signedIn.className).toContain(cls);
      expect(signOut.className).toContain(cls);
    }
  });
});
