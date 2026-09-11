import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Chip, StatusChip } from './Chip';

describe('Chip + StatusChip', () => {
  it('renders chip text', () => {
    render(<Chip tone="yellow">hello</Chip>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('StatusChip maps statuses to labels', () => {
    render(<StatusChip status="REPLACED" />);
    expect(screen.getByText('REPLACED')).toBeInTheDocument();
  });
});
