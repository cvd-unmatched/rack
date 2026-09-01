import { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { Face, MountedDevice } from '../types';
import { useRackStore } from '../store/rackStore';
import { useUiStore } from '../store/uiStore';
import { ROW_H } from '../lib/geometry';
import { CATEGORY_ICON } from '../lib/icons';
import { PortDot } from './PortDot';

interface Props {
  device: MountedDevice;
  side: Face;
  category: string | undefined;
  connectedPortIds: Set<string>;
  externalByPort: Map<string, string>;
  pending: { instanceId: string; portId: string } | null;
  onPortClick: (instanceId: string, portId: string, e: React.MouseEvent) => void;
}

export function DeviceBlock({
  device,
  side,
  category,
  connectedPortIds,
  externalByPort,
  pending,
  onPortClick,
}: Props) {
  const selectedId = useUiStore((s) => s.selectedId);
  const select = useUiStore((s) => s.select);
  const moveDevice = useRackStore((s) => s.moveDevice);
  const removeDevice = useRackStore((s) => s.removeDevice);

  const [dragU, setDragU] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);

  const Icon = CATEGORY_ICON[(category as keyof typeof CATEGORY_ICON) ?? 'Custom'] ?? CATEGORY_ICON.Custom;
  const isSelected = selectedId === device.instanceId;
  const visiblePorts = device.ports.filter((p) => p.side === side || p.side === 'both');

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    select(device.instanceId);
    startY.current = e.clientY;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragU(Math.round((e.clientY - startY.current) / ROW_H));
  };
  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    if (dragU !== 0) moveDevice(device.instanceId, device.startU + dragU);
    setDragU(0);
  };

  const top = (device.startU - 1 + (dragging ? dragU : 0)) * ROW_H;
  const headerH = device.heightU >= 2 ? 22 : 18;

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        height: device.heightU * ROW_H - 2,
        backgroundColor: `${device.color}26`,
        borderColor: isSelected ? '#f4f4f5' : `${device.color}99`,
        zIndex: dragging ? 30 : isSelected ? 5 : 1,
      }}
      className={`group cursor-grab select-none rounded-[3px] border px-2 active:cursor-grabbing ${
        dragging ? 'opacity-90 shadow-[0_8px_24px_rgba(0,0,0,0.5)]' : ''
      }`}
    >
      <div
        className="flex items-center gap-1.5 overflow-hidden"
        style={{ height: headerH }}
      >
        <Icon size={12} strokeWidth={2.25} color={device.color} className="shrink-0" />
        <span className="truncate text-[11px] font-medium text-zinc-100">{device.name}</span>
        <span className="ml-auto shrink-0 text-[9px] font-mono text-zinc-400">
          {device.heightU}U
        </span>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            removeDevice(device.instanceId);
          }}
          className="shrink-0 rounded p-0.5 text-zinc-400 opacity-0 hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
        >
          <Trash2 size={11} />
        </button>
      </div>
      {visiblePorts.length > 0 && (
        <div
          className="absolute right-1.5 bottom-1 left-1.5 flex flex-wrap content-end justify-start gap-[3px]"
          style={{ top: headerH }}
        >
          {visiblePorts.map((p) => (
            <PortDot
              key={p.id}
              instanceId={device.instanceId}
              port={p}
              connected={connectedPortIds.has(p.id)}
              externalLabel={externalByPort.get(p.id)}
              pending={pending?.instanceId === device.instanceId && pending?.portId === p.id}
              onClick={onPortClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
