import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MagicWand } from '../MagicWand';

describe('TEST-FR-BUILD-006-COMPONENT-C — MagicWand', () => {
  it('renders a sparkle SVG with aria-label by default', () => {
    render(<MagicWand onClick={() => {}} />);
    const btn = screen.getByRole('button', { name: /suggest with ai/i });
    expect(btn).toBeInTheDocument();
    expect(btn.querySelector('svg')).not.toBeNull();
    // No border, no bg chrome on the bare wand.
    expect(btn.className).not.toMatch(/(?:^|\s)border(?:-|\s|$)/);
    expect(btn.className).not.toMatch(/(?:^|\s)bg-(?!transparent)/);
  });

  it('shows a spinner instead of the glyph when busy and disables click', () => {
    const onClick = vi.fn();
    const { container } = render(<MagicWand onClick={onClick} busy />);
    expect(container.querySelector('svg')).toBeNull();
    expect(container.querySelector('.animate-spin')).not.toBeNull();
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('respects a custom title (used as both title attr and aria-label)', () => {
    render(<MagicWand onClick={() => {}} title="Suggest features" />);
    const btn = screen.getByRole('button', { name: /suggest features/i });
    expect(btn).toBeInTheDocument();
    expect(btn.getAttribute('title')).toBe('Suggest features');
  });

  it('fires onClick when clicked', () => {
    const onClick = vi.fn();
    render(<MagicWand onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('stops the click from bubbling so wrapping cards do not also trigger', () => {
    const onParent = vi.fn();
    const onWand = vi.fn();
    render(
      <div onClick={onParent}>
        <MagicWand onClick={onWand} />
      </div>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onWand).toHaveBeenCalledTimes(1);
    expect(onParent).not.toHaveBeenCalled();
  });
});
