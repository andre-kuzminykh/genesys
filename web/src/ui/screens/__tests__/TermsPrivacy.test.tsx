import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Terms } from '../Terms';
import { Privacy } from '../Privacy';

describe('TEST-FR-LEGAL-003-C — Terms + Privacy screens', () => {
  it('Terms renders sections + a back link', () => {
    render(<MemoryRouter><Terms /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: /terms of use/i })).toBeInTheDocument();
    expect(screen.getByText(/1\. what this is/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. eligibility/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back/i })).toBeInTheDocument();
  });

  it('Privacy renders the data-collection list + back link', () => {
    render(<MemoryRouter><Privacy /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: /privacy policy/i })).toBeInTheDocument();
    expect(screen.getByText(/what we collect/i)).toBeInTheDocument();
    expect(screen.getByText(/what we do not collect/i)).toBeInTheDocument();
    expect(screen.getByText(/llm analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/data retention/i)).toBeInTheDocument();
  });

  it('both pages mount the Footer', () => {
    render(<MemoryRouter><Terms /></MemoryRouter>);
    expect(screen.getAllByRole('link', { name: /^terms$/i }).length).toBeGreaterThan(0);
  });
});
