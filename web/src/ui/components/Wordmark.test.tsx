import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Wordmark } from './Wordmark';

describe('TEST-GEN-160 — Wordmark CSS-rendered brand', () => {
  it('renders the lowercase wordmark text', () => {
    render(<Wordmark size="md" />);
    expect(screen.getByText('genesys')).toBeInTheDocument();
    expect(screen.getByLabelText('Genesys')).toBeInTheDocument();
  });

  it('reserves left padding for the cursor by default and drops it when withCursor=false', () => {
    const { rerender, container } = render(<Wordmark size="md" />);
    const withCursor = container.querySelector('[aria-label="Genesys"]') as HTMLElement;
    expect(withCursor.style.paddingLeft).not.toBe('0px');

    rerender(<Wordmark size="md" withCursor={false} />);
    const noCursor = container.querySelector('[aria-label="Genesys"]') as HTMLElement;
    expect(noCursor.style.paddingLeft).toBe('0px');
  });
});
