import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Wordmark } from './Wordmark';

describe('TEST-GEN-160 — Wordmark renders the hosted brand picture', () => {
  it('renders an <img> with the wordmark asset URL and an accessible alt', () => {
    render(<Wordmark size="lg" />);
    const img = screen.getByAltText('Genesys') as HTMLImageElement;
    expect(img.tagName).toBe('IMG');
    expect(img.getAttribute('src')).toMatch(/wordmark|i\.ibb\.co/);
  });

  it('scales by `size` — each size maps to a deterministic CSS height', () => {
    const heights: Record<string, string> = { sm: '22px', md: '32px', lg: '56px', xl: '128px' };
    for (const [size, expected] of Object.entries(heights)) {
      const { container, unmount } = render(<Wordmark size={size as 'sm' | 'md' | 'lg' | 'xl'} />);
      const img = container.querySelector('img')!;
      expect(img.style.height).toBe(expected);
      unmount();
    }
  });
});
