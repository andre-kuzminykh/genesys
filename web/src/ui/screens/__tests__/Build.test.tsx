import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Build } from '../Build';

function renderBuild() {
  return render(
    <MemoryRouter initialEntries={['/build']}>
      <Build />
    </MemoryRouter>,
  );
}

describe('TEST-GEN-605-C — FR-GEN-605 Step 2 is locked until Step 1 is filled', () => {
  beforeEach(() => localStorage.clear());

  it('renders the Feature roadmap step shell with pointer-events-none + opacity-50 while step 1 is empty', () => {
    renderBuild();
    const step2 = screen.getByText('Feature roadmap').closest('section') as HTMLElement;
    expect(step2).not.toBeNull();
    expect(step2.className).toContain('pointer-events-none');
    expect(step2.className).toContain('opacity-50');
  });
});

describe('TEST-GEN-606-C — FR-GEN-606 magic-wand has no border / no background chrome', () => {
  beforeEach(() => localStorage.clear());

  it('renders sparkle buttons with no border-* and no bg-* classes — only hover-tinted glyphs', () => {
    const { container } = renderBuild();
    const wands = container.querySelectorAll('button[aria-label="Suggest with AI"]');
    expect(wands.length).toBeGreaterThan(0);
    for (const w of Array.from(wands)) {
      // FR-GEN-606 is about user-visible chrome — we forbid the explicit
      // border-* / bg-* utility classes that would give the button a pill
      // look. (`text-textsec` colour stays.)
      expect(w.className).not.toMatch(/(?:^|\s)border(?:-|\s|$)/);
      expect(w.className).not.toMatch(/(?:^|\s)bg-(?!transparent)/);
      // Accessibility: the button announces itself.
      expect(w.getAttribute('aria-label')).toBeTruthy();
    }
  });
});
