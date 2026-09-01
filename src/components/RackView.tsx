import { useMemo } from 'react';
import { useRackStore } from '../store/rackStore';
import { RackElevation } from './RackElevation';

export function RackView() {
  const rack = useRackStore((s) => s.rack);
  const templates = useRackStore((s) => s.templates);

  const templateById = useMemo(() => new Map(templates.map((t) => [t.id, t])), [templates]);

  return (
    <div
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
        <RackElevation side="front" templateById={templateById} />
        <RackElevation side="rear" templateById={templateById} />
      </div>
    </div>
  );
}
