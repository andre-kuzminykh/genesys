import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { useInfinitePagination } from '../useInfinitePagination';

class FakeIO {
  static instances: FakeIO[] = [];
  cb: (entries: Array<{ isIntersecting: boolean }>) => void;
  constructor(cb: (entries: Array<{ isIntersecting: boolean }>) => void) {
    this.cb = cb;
    FakeIO.instances.push(this);
  }
  observe() {}
  disconnect() {
    FakeIO.instances = FakeIO.instances.filter((i) => i !== this);
  }
  static fire(intersecting = true) {
    // Only the latest observer is wired to the current state.
    const latest = FakeIO.instances[FakeIO.instances.length - 1];
    latest?.cb([{ isIntersecting: intersecting }]);
  }
}

function Harness({ total, pageSize, dep, onState }: { total: number; pageSize: number; dep: string; onState: (n: number) => void }) {
  const { visible, sentinelRef } = useInfinitePagination(total, pageSize, [dep]);
  // expose `visible` to the test
  onState(visible);
  // sentinel must be in the DOM for the hook to wire up its IO
  return <div ref={sentinelRef} data-testid="sentinel" />;
}

describe('TEST-FR-LAND-005-C / FR-PICK-004-C — useInfinitePagination', () => {
  beforeEach(() => {
    (globalThis as unknown as { IntersectionObserver: typeof IntersectionObserver }).IntersectionObserver = FakeIO as unknown as typeof IntersectionObserver;
    FakeIO.instances = [];
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it('returns the pageSize on initial render', () => {
    let latest = -1;
    render(<Harness total={100} pageSize={20} dep="a" onState={(n) => { latest = n; }} />);
    expect(latest).toBe(20);
  });

  it('bumps visible by pageSize when the sentinel intersects, capped at total', () => {
    let latest = -1;
    render(<Harness total={50} pageSize={20} dep="a" onState={(n) => { latest = n; }} />);
    expect(latest).toBe(20);

    act(() => { FakeIO.fire(); });
    expect(latest).toBe(40);

    act(() => { FakeIO.fire(); });
    expect(latest).toBe(50); // capped at total

    act(() => { FakeIO.fire(); });
    expect(latest).toBe(50); // no further growth — capped
  });

  it('resets to pageSize whenever a dep changes', () => {
    let latest = -1;
    const { rerender } = render(<Harness total={100} pageSize={10} dep="first" onState={(n) => { latest = n; }} />);
    act(() => { FakeIO.fire(); });
    expect(latest).toBe(20);

    rerender(<Harness total={100} pageSize={10} dep="second" onState={(n) => { latest = n; }} />);
    expect(latest).toBe(10);
  });
});
