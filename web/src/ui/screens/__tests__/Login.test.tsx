import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Login } from '../Login';

describe('TEST-FR-AUTH-001-C — Login screen', () => {
  it('renders the wordmark + "Continue with GitHub" CTA pointing at /auth/github', () => {
    render(
      <MemoryRouter><Login /></MemoryRouter>,
    );
    expect(screen.getByLabelText(/Genesys/i)).toBeInTheDocument();
    const cta = screen.getByRole('link', { name: /continue with github/i }) as HTMLAnchorElement;
    expect(cta).toBeInTheDocument();
    expect(cta.getAttribute('href')).toBe('/auth/github');
  });

  it('does NOT carry the old "Sign in with GitHub" heading any more', () => {
    render(<MemoryRouter><Login /></MemoryRouter>);
    expect(screen.queryByText(/^sign in with github$/i)).toBeNull();
  });

  it('mounts the footer + cookie banner', () => {
    render(<MemoryRouter><Login /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /^terms$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^privacy$/i })).toBeInTheDocument();
  });
});
