import type { Connection } from '../types';
import type { Point } from '../lib/usePortPositions';

interface Props {
  connections: Connection[];
  positions: Map<string, Point>;
  pendingFrom: Point | null;
  mousePos: Point | null;
  onRemove: (id: string) => void;
}

function curve(a: Point, b: Point) {
  const midX = (a.x + b.x) / 2;
  return `M ${a.x} ${a.y} C ${midX} ${a.y}, ${midX} ${b.y}, ${b.x} ${b.y}`;
}

export function ConnectionsOverlay({ connections, positions, pendingFrom, mousePos, onRemove }: Props) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      style={{ zIndex: 15 }}
    >
      {connections.map((c) => {
        // External connections have no second endpoint to draw to; they're
        // shown as a filled port dot with the detail on hover, and listed
        // in the Cables panel.
        if (!c.toDevice) return null;

        const a = positions.get(`${c.fromDevice}:${c.fromPort}`);
        const b = positions.get(`${c.toDevice}:${c.toPort}`);
        if (!a || !b) return null;
        const d = curve(a, b);
        return (
          <g key={c.id}>
            {/* dark halo so the cable reads as drawn "in front of" device rows it crosses */}
            <path d={d} fill="none" stroke="#09090b" strokeWidth={4} strokeOpacity={0.55} />
            <path d={d} fill="none" stroke={c.color} strokeWidth={1.75} strokeOpacity={0.85} />
            <path
              d={d}
              fill="none"
              stroke="transparent"
              strokeWidth={10}
              className="pointer-events-auto cursor-pointer"
              onClick={() => onRemove(c.id)}
            >
              <title>Click to remove cable</title>
            </path>
            <circle cx={a.x} cy={a.y} r={2.5} fill={c.color} />
            <circle cx={b.x} cy={b.y} r={2.5} fill={c.color} />
          </g>
        );
      })}
      {pendingFrom && mousePos && (
        <path
          d={curve(pendingFrom, mousePos)}
          fill="none"
          stroke="#f4f4f5"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          opacity={0.8}
        />
      )}
    </svg>
  );
}
