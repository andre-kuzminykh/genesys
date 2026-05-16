import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Wordmark } from './Wordmark';

describe('TEST-GEN-160 — Wordmark inline SVG brand', () => {
  it('renders an SVG with the "genesys" lettering and an accessible label', () => {
    render(<Wordmark size="lg" />);
    const svg = screen.getByLabelText('Genesys');
    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg).toContainHTML('genesys');
  });

  it('emits the neon cursor rect by default and omits it when withCursor=false', () => {
    const { container, rerender } = render(<Wordmark size="md" />);
    expect(container.querySelector('rect[fill="#7FFF00"]')).not.toBeNull();
    rerender(<Wordmark size="md" withCursor={false} />);
    expect(container.querySelector('rect[fill="#7FFF00"]')).toBeNull();
  });

  it('scales the rendered SVG to height = font size with a 4:1 aspect ratio', () => {
    const { container } = render(<Wordmark size="md" />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('height')).toBe('26');
    expect(svg.getAttribute('width')).toBe('104'); // 26 * 4
  });
});
