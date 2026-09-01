import { useLayoutEffect, useState, type RefObject } from 'react';

export interface Point {
  x: number;
  y: number;
}

export function usePortPositions(
  containerRef: RefObject<HTMLElement | null>,
  deps: unknown[],
): Map<string, Point> {
  const [positions, setPositions] = useState<Map<string, Point>>(new Map());

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const compute = () => {
      const rect = el.getBoundingClientRect();
      const map = new Map<string, Point>();
      el.querySelectorAll<HTMLElement>('[data-port-key]').forEach((node) => {
        const r = node.getBoundingClientRect();
        map.set(node.dataset.portKey!, {
          x: r.left - rect.left + r.width / 2,
          y: r.top - rect.top + r.height / 2,
        });
      });
      setPositions(map);
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    window.addEventListener('resize', compute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', compute);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return positions;
}
