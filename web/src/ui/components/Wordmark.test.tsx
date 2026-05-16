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

describe('TEST-GEN-213 — Wordmark cursor sits on the baseline of the artwork', () => {
  it('renders a neon cursor sibling that sits on the lettering baseline (positive marginBottom) and starts at the wordmark container left edge', () => {
    const { container } = render(<Wordmark size="xl" />);
    const wrapper = container.querySelector('[aria-label="Genesys"]') as HTMLElement;
    expect(wrapper.className).toContain('inline-flex');
    expect(wrapper.className).toContain('items-end');

    const cursor = wrapper.querySelector('span[aria-hidden]') as HTMLElement;
    expect(cursor).not.toBeNull();
    expect(cursor.className).toContain('bg-neon-500');

    const mb = parseFloat(cursor.style.marginBottom);
    // The xl cursor should sit well above the picture's bottom edge
    // (artwork has bottom padding around the glyphs).
    expect(mb).toBeGreaterThanOrEqual(40);

    // Cursor stays flush with the wordmark container's left edge so it
    // aligns visually with the card grid below it on the Landing page.
    const ml = parseFloat(cursor.style.marginLeft || '0');
    expect(ml).toBe(0);
  });

  it('pulls the picture left over the cursor area via a negative marginLeft so the lettering reads close to the cursor', () => {
    const { container } = render(<Wordmark size="xl" />);
    const img = container.querySelector('img') as HTMLImageElement;
    const ml = parseFloat(img.style.marginLeft);
    expect(ml).toBeLessThan(0);
  });

  it('omits the cursor sibling when withCursor=false', () => {
    const { container } = render(<Wordmark size="xl" withCursor={false} />);
    expect(container.querySelector('span[aria-hidden]')).toBeNull();
  });
});
