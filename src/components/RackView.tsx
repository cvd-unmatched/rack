import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRackStore } from '../store/rackStore';
import { RackElevation } from './RackElevation';
import { BASE_PX_PER_INCH, BASE_ROW_H, fitPxPerInch, fitRowH } from '../lib/geometry';

export function RackView() {
  const rack = useRackStore((s) => s.rack);
  const templates = useRackStore((s) => s.templates);

  const templateById = useMemo(() => new Map(templates.map((t) => [t.id, t])), [templates]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [rowH, setRowH] = useState(BASE_ROW_H);
  const [pxPerInch, setPxPerInch] = useState(BASE_PX_PER_INCH);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compute = () => {
      setRowH(fitRowH(rack.heightU, el.clientHeight));
      setPxPerInch(fitPxPerInch(rack.widthIn, el.clientWidth));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [rack.heightU, rack.widthIn]);

  return (
    <div
      ref={containerRef}
      className="flex flex-1 flex-col items-center overflow-auto bg-zinc-950 px-8 py-8"
      style={{
        backgroundImage:
          'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.035) 1px, transparent 0)',
        backgroundSize: '18px 18px',
      }}
    >
      <div className="mb-4 flex items-center gap-2 text-xs text-zinc-500">
        <span className="font-medium text-zinc-300">{rack.name}</span>
        <span>·</span>
        <span>{rack.heightU}U</span>
        <span>·</span>
        <span>{rack.widthIn}" rail</span>
      </div>
      <div className="flex flex-wrap items-start justify-center gap-10">
        <RackElevation side="front" templateById={templateById} rowH={rowH} pxPerInch={pxPerInch} />
        <RackElevation side="rear" templateById={templateById} rowH={rowH} pxPerInch={pxPerInch} />
      </div>
    </div>
  );
}
