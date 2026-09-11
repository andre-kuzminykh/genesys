import { useEffect, useRef, useState } from 'react';

/**
 * Tiny infinite-scroll hook.
 *
 * Returns the current visible-count plus a ref to attach to a sentinel
 * element rendered just below the list. The hook bumps the count by
 * `pageSize` whenever the sentinel scrolls into view, as long as there
 * are still hidden items.
 *
 * The hook also resets the count to `pageSize` whenever any item in
 * `deps` changes — typically the active filters / search query — so a
 * fresh result set always starts from the top of the page.
 */
export function useInfinitePagination<T extends ReadonlyArray<unknown>>(
  total: number,
  pageSize: number,
  deps: T,
): { visible: number; sentinelRef: React.RefObject<HTMLDivElement> } {
  const [visible, setVisible] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setVisible(pageSize); }, [pageSize, ...deps]);

  useEffect(() => {
    if (visible >= total) return;
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          setVisible((n) => Math.min(n + pageSize, total));
          return;
        }
      }
    }, { rootMargin: '200px 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible, total, pageSize]);

  return { visible, sentinelRef };
}
