import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppStoreProvider } from '@/ui/AppStore';
import { ThemeProvider } from '@/ui/Theme';
import { Landing } from '../Landing';

function bootstrapSession(handle: string) {
  // Mount once to seed the store at the current key, then patch the session in.
  const { unmount } = render(
    <ThemeProvider>
      <AppStoreProvider>
        <MemoryRouter><div /></MemoryRouter>
      </AppStoreProvider>
    </ThemeProvider>,
  );
  unmount();

  const stored = JSON.parse(localStorage.getItem('genesys:v0.5') ?? '{}');
  stored.session = { handle, loggedInAt: Date.now() };
  localStorage.setItem('genesys:v0.5', JSON.stringify(stored));
}

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

describe('TEST-GEN-190 — wallet + invest UI', () => {
  beforeEach(() => { localStorage.clear(); });

  it('logged-in user sees $100,000 wallet in the header', () => {
    bootstrapSession('andre-kuzminykh');
    renderLanding();
    // After seed, no investments by bob yet → wallet should be the full default.
    expect(screen.getByText('$100,000')).toBeInTheDocument();
  });

  it('opening a card shows the Invest button; clicking it reveals the amount form', async () => {
    bootstrapSession('andre-kuzminykh');
    renderLanding();

    const user = userEvent.setup();
    // Open the carousel featured (it's the first openable). The simplest way is
    // to click on a list card heading.
    const auroras = screen.getAllByText('Aurora');
    expect(auroras.length).toBeGreaterThan(0);
    await user.click(auroras[auroras.length - 1]!);

    // The detail dialog now renders. There should be an Invest button.
    const dialogInvest = screen.getByRole('button', { name: /^invest$/i });
    expect(dialogInvest).toBeInTheDocument();

    await user.click(dialogInvest);
    // Confirm button now appears
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
  });
});
