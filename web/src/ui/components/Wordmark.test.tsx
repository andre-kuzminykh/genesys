import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Wordmark } from './Wordmark';

describe('TEST-GEN-160 — Wordmark image-first with CSS fallback', () => {
  it('renders an <img> initially', () => {
    render(<Wordmark size="md" />);
    const img = screen.getByAltText('Genesys') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.tagName).toBe('IMG');
    expect(img.getAttribute('src')).toBe('/wordmark.png');
  });

  it('falls back to CSS-rendered text when the image errors', () => {
    render(<Wordmark size="md" />);
    const img = screen.getByAltText('Genesys') as HTMLImageElement;
    fireEvent.error(img);
    expect(screen.getByText('genesys')).toBeInTheDocument();
  });
});
