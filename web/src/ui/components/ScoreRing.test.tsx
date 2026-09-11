import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreRing } from './ScoreRing';

describe('TEST-GEN-020 — ScoreRing component', () => {
  it('renders the rounded value and label', () => {
    render(<ScoreRing value={67.4} label="Readiness" />);
    expect(screen.getByText('67')).toBeInTheDocument();
    expect(screen.getByText('Readiness')).toBeInTheDocument();
  });

  it('clips out-of-range values', () => {
    const { rerender } = render(<ScoreRing value={120} label="x" />);
    expect(screen.getByText('100')).toBeInTheDocument();
    rerender(<ScoreRing value={-10} label="x" />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
