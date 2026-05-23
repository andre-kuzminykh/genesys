import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { ScrollToTop } from '../ScrollToTop';

describe('TEST-FR-LAND-007-C — ScrollToTop visibility + smooth-scroll', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
  });

  it('hidden initially (window.scrollY ≤ threshold)', () => {
    const { container } = render(<ScrollToTop threshold={400} />);
    const btn = container.querySelector('button[aria-label="Scroll to top"]');
    expect(btn).not.toBeNull();
    expect(btn?.className).toContain('opacity-0');
    expect(btn?.className).toContain('pointer-events-none');
  });

  it('becomes visible once the page is scrolled past the threshold', () => {
    const { container } = render(<ScrollToTop threshold={400} />);
    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true, configurable: true });
      window.dispatchEvent(new Event('scroll'));
    });
    const btn = container.querySelector('button[aria-label="Scroll to top"]');
    expect(btn?.className).toContain('opacity-100');
    expect(btn?.className).toContain('pointer-events-auto');
  });

  it('calls window.scrollTo({ top: 0, behavior: "smooth" }) when clicked', () => {
    const spy = vi.fn();
    window.scrollTo = spy as unknown as typeof window.scrollTo;
    const { container } = render(<ScrollToTop threshold={100} />);
    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 500, writable: true, configurable: true });
      window.dispatchEvent(new Event('scroll'));
    });
    const btn = container.querySelector('button[aria-label="Scroll to top"]') as HTMLButtonElement;
    fireEvent.click(btn);
    expect(spy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
