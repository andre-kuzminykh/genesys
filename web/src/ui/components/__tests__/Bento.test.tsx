import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Bento } from '../Bento';

describe('TEST-Bento-C — base shell + tone variants', () => {
  it('renders children and applies the default tone ring + p-5 padding', () => {
    const { container } = render(<Bento>hello</Bento>);
    const el = container.firstElementChild as HTMLElement;
    expect(el).not.toBeNull();
    expect(el.className).toContain('bento');
    expect(el.className).toContain('p-5');
    expect(el.className).toContain('border-white/[0.06]');
    expect(el.textContent).toBe('hello');
  });

  it('switches the border ring based on `tone`', () => {
    for (const [tone, ring] of [
      ['yellow', 'border-neon-500/30'],
      ['sky', 'border-sky-500/30'],
      ['violet', 'border-signal-violet/30'],
    ] as const) {
      const { container, unmount } = render(<Bento tone={tone}>x</Bento>);
      expect(container.firstElementChild?.className).toContain(ring);
      unmount();
    }
  });

  it('lets callers override padding via the `padding` prop', () => {
    const { container } = render(<Bento padding="p-8">x</Bento>);
    expect(container.firstElementChild?.className).toContain('p-8');
    expect(container.firstElementChild?.className).not.toContain('p-5');
  });

  it('merges arbitrary className into the host', () => {
    const { container } = render(<Bento className="glow-yellow extra-thing">x</Bento>);
    expect(container.firstElementChild?.className).toContain('glow-yellow');
    expect(container.firstElementChild?.className).toContain('extra-thing');
  });
});
