import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '../Footer';

describe('TEST-FR-LEGAL-002-C — Footer', () => {
  it('renders Terms + Privacy links', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: /^terms$/i })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: /^privacy$/i })).toHaveAttribute('href', '/privacy');
  });

  it('renders the four social icon links with aria-labels', () => {
    render(<Footer />);
    for (const label of ['Telegram', 'Website', 'YouTube', 'LinkedIn']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('renders the copyright line for the current year', () => {
    render(<Footer />);
    const year = String(new Date().getFullYear());
    const txt = screen.getByText(new RegExp(`© ${year} Andre AI Technologies`, 'i'));
    expect(txt).toBeInTheDocument();
  });

  it('uses a 3-column grid (socials · terms/privacy centered · copyright)', () => {
    const { container } = render(<Footer />);
    const grid = container.querySelector('footer > div');
    expect(grid?.className).toContain('grid');
    // The arbitrary-value class survives Tailwind processing as text; matched loosely.
    expect(grid?.className).toMatch(/grid-cols-\[?auto.*1fr.*auto/);
  });
});
