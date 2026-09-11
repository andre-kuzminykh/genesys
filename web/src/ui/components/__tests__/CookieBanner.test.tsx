import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CookieBanner } from '../CookieBanner';

const KEY = 'genesys:cookie-acked:v1';

describe('TEST-FR-LEGAL-001-C — CookieBanner', () => {
  beforeEach(() => localStorage.clear());

  it('renders the notice + OK button on first paint', () => {
    render(<CookieBanner />);
    expect(screen.getByRole('dialog', { name: /cookie notice/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^ok$/i })).toBeInTheDocument();
  });

  it('disappears + persists the ack to localStorage when OK is clicked', () => {
    render(<CookieBanner />);
    fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));
    expect(screen.queryByRole('dialog', { name: /cookie notice/i })).toBeNull();
    expect(localStorage.getItem(KEY)).not.toBeNull();
  });

  it('does not render at all when the user has already accepted', () => {
    localStorage.setItem(KEY, String(Date.now()));
    const { container } = render(<CookieBanner />);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });
});
