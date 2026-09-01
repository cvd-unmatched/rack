import { useEffect, useMemo, useRef, useState } from 'react';
import type { DeviceTemplate, Face } from '../types';
import { useRackStore, useActiveRack } from '../store/rackStore';
import { useUiStore } from '../store/uiStore';
import { rackWidthPx } from '../lib/geometry';
import { usePortPositions, type Point } from '../lib/usePortPositions';
import { DeviceBlock } from './DeviceBlock';
import { ConnectionsOverlay } from './ConnectionsOverlay';

interface Props {
  side: Face;
  templateById: Map<string, DeviceTemplate>;
  rowH: number;
  pxPerInch: number;
}

export function RackElevation({ side, templateById, rowH, pxPerInch }: Props) {
  const rack = useActiveRack();
  const addDevice = useRackStore((s) => s.addDevice);
  const addConnection = useRackStore((s) => s.addConnection);
  const removeConnection = useRackStore((s) => s.removeConnection);
  const setPortOccupied = useRackStore((s) => s.setPortOccupied);
  const canPlace = useRackStore((s) => s.canPlace);

  const select = useUiStore((s) => s.select);
  const draggingTemplateId = useUiStore((s) => s.draggingTemplateId);
  const setDraggingTemplateId = useUiStore((s) => s.setDraggingTemplateId);

  const bodyRef = useRef<HTMLDivElement>(null);
  const [dropPreview, setDropPreview] = useState<{ u: number; h: number; ok: boolean } | null>(
    null,
  );
  const [pending, setPending] = useState<{ instanceId: string; portId: string } | null>(null);
  const [mousePos, setMousePos] = useState<Point | null>(null);

  const positions = usePortPositions(bodyRef, [rack.devices, rack.connections.length, side, rowH]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPending(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const pendingPoint = pending
    ? (positions.get(`${pending.instanceId}:${pending.portId}`) ?? null)
    : null;
  const pendingPort = pending
    ? (rack.devices
        .find((d) => d.instanceId === pending.instanceId)
        ?.ports.find((p) => p.id === pending.portId) ?? null)
    : null;

  function computeU(clientY: number) {
    if (!bodyRef.current) return 1;
    const rect = bodyRef.current.getBoundingClientRect();
    const y = clientY - rect.top;
    return Math.max(1, Math.min(rack.heightU, Math.floor(y / rowH) + 1));
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!draggingTemplateId) return;
    const tpl = templateById.get(draggingTemplateId);
    if (!tpl) return;
    const u = computeU(e.clientY);
    setDropPreview({ u, h: tpl.heightU, ok: canPlace(tpl.heightU, u) });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const templateId = draggingTemplateId ?? e.dataTransfer.getData('text/plain');
    setDropPreview(null);
    setDraggingTemplateId(null);
    if (!templateId) return;
    const u = computeU(e.clientY);
    const id = addDevice(templateId, u);
    if (id) select(id);
  }

  function handlePortClick(instanceId: string, portId: string) {
    if (!pending) {
      setPending({ instanceId, portId });
      return;
    }
    if (pending.instanceId === instanceId && pending.portId === portId) {
      setPending(null);
      return;
    }
    addConnection({
      fromDevice: pending.instanceId,
      fromPort: pending.portId,
      toDevice: instanceId,
      toPort: portId,
      face: side,
    });
    setPending(null);
  }

  function handleConnectExternal() {
    if (!pending) return;
    const label = window.prompt(
      'What is this port connected to outside the rack? (e.g. "Wall jack, bedroom", "ISP fiber")',
    );
    if (!label || !label.trim()) return;
    addConnection({
      fromDevice: pending.instanceId,
      fromPort: pending.portId,
      toDevice: null,
      toPort: null,
      toExternalLabel: label.trim(),
      face: side,
    });
    setPending(null);
  }

  function handleToggleOccupied() {
    if (!pending || !pendingPort) return;
    setPortOccupied(pending.instanceId, pending.portId, !pendingPort.occupied);
    setPending(null);
  }

  function handleBodyPointerMove(e: React.PointerEvent) {
    if (!pending || !bodyRef.current) return;
    const rect = bodyRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  function handleBodyPointerDown(e: React.PointerEvent) {
    if (e.target === bodyRef.current) {
      setPending(null);
      select(null);
    }
  }

  // A connection made from this elevation belongs to this face. Older saved
  // data has no recorded face, so fall back to deriving it from the port's
  // own configured side (a "both" port matches either face).
  const matchesSide = (p: { side: string } | undefined) => p?.side === side || p?.side === 'both';
  const legacyMatch = (c: (typeof rack.connections)[number]) => {
    const fromDev = rack.devices.find((d) => d.instanceId === c.fromDevice);
    const fromPort = fromDev?.ports.find((p) => p.id === c.fromPort);
    if (!matchesSide(fromPort)) return false;
    if (!c.toDevice) return true;
    const toDev = rack.devices.find((d) => d.instanceId === c.toDevice);
    const toPort = toDev?.ports.find((p) => p.id === c.toPort);
    return matchesSide(toPort);
  };

  const sideConnections = useMemo(
    () => rack.connections.filter((c) => (c.face ? c.face === side : legacyMatch(c))),
    [rack.connections, rack.devices, side],
  );

  const connectedPortIds = useMemo(() => {
    const s = new Set<string>();
    sideConnections.forEach((c) => {
      s.add(c.fromPort);
      if (c.toPort) s.add(c.toPort);
    });
    return s;
  }, [sideConnections]);

  const externalByPort = useMemo(() => {
    const m = new Map<string, string>();
    sideConnections.forEach((c) => {
      if (!c.toDevice && c.toExternalLabel) m.set(c.fromPort, c.toExternalLabel);
    });
    return m;
  }, [sideConnections]);

  const visibleDevices = useMemo(
    () =>
      rack.devices.filter(
        (d) => d.ports.length === 0 || d.ports.some((p) => p.side === side || p.side === 'both'),
      ),
    [rack.devices, side],
  );

  const contentWidth = rackWidthPx(rack.widthIn, pxPerInch);
  const bodyHeight = rack.heightU * rowH;

  const railStyle: React.CSSProperties = {
    width: 10,
    backgroundColor: '#27272a',
    backgroundImage: `radial-gradient(circle at 50% ${rowH / 2}px, #52525b 1.4px, transparent 1.6px)`,
    backgroundSize: `100% ${rowH}px`,
    backgroundRepeat: 'repeat-y',
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold tracking-wide text-zinc-500 uppercase">
        {side === 'front' ? 'Front' : 'Rear'}
        {pending && (
          <span className="flex items-center gap-1.5 normal-case">
            <span className="rounded-full bg-blue-500/15 px-2 py-0.5 font-medium text-blue-300">
              Click another port to connect
            </span>
            <button
              onClick={handleConnectExternal}
              className="rounded-full bg-zinc-800 px-2 py-0.5 font-medium text-zinc-300 hover:bg-zinc-700"
            >
              Connect to outside device...
            </button>
            <button
              onClick={handleToggleOccupied}
              className="rounded-full bg-zinc-800 px-2 py-0.5 font-medium text-zinc-300 hover:bg-zinc-700"
            >
              {pendingPort?.occupied ? 'Mark as free' : 'Mark as in use'}
            </button>
            <span className="text-zinc-600">Esc to cancel</span>
          </span>
        )}
      </div>
      <div className="flex">
        <div className="flex flex-col pr-1.5 text-right">
          {Array.from({ length: rack.heightU }).map((_, i) => (
            <div
              key={i}
              style={{ height: rowH }}
              className="flex items-center justify-end font-mono text-[9px] text-zinc-600"
            >
              {i + 1}
            </div>
          ))}
        </div>
        <div className="flex rounded-md border border-zinc-700 bg-gradient-to-b from-zinc-800 to-zinc-900 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div style={railStyle} className="rounded-l-md" />
          <div
            ref={bodyRef}
            data-rack-side={side}
            onDragOver={handleDragOver}
            onDragLeave={() => setDropPreview(null)}
            onDrop={handleDrop}
            onPointerMove={handleBodyPointerMove}
            onPointerDown={handleBodyPointerDown}
            className="relative bg-zinc-900"
            style={{
              width: contentWidth,
              height: bodyHeight,
              backgroundImage: `repeating-linear-gradient(to bottom, rgba(255,255,255,0.045) 0px, rgba(255,255,255,0.045) 1px, transparent 1px, transparent ${rowH}px)`,
            }}
          >
            {dropPreview && (
              <div
                className="pointer-events-none absolute right-1 left-1 rounded-sm border-2 border-dashed"
                style={{
                  top: (dropPreview.u - 1) * rowH,
                  height: dropPreview.h * rowH,
                  borderColor: dropPreview.ok ? '#4ade80' : '#f87171',
                  backgroundColor: dropPreview.ok ? '#4ade8022' : '#f8717122',
                }}
              />
            )}

            {visibleDevices.map((d) => (
              <DeviceBlock
                key={d.instanceId}
                device={d}
                side={side}
                rowH={rowH}
                category={templateById.get(d.templateId)?.category}
                connectedPortIds={connectedPortIds}
                externalByPort={externalByPort}
                pending={pending}
                onPortClick={handlePortClick}
              />
            ))}

            <ConnectionsOverlay
              connections={sideConnections}
              positions={positions}
              pendingFrom={pendingPoint}
              mousePos={mousePos}
              onRemove={removeConnection}
            />

            {rack.devices.length === 0 && !dropPreview && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-xs text-zinc-600">
                Drag a device from the library onto the rack
              </div>
            )}
            {rack.devices.length > 0 && visibleDevices.length === 0 && !dropPreview && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-xs text-zinc-600">
                Nothing mounted here has ports on the {side}
              </div>
            )}
          </div>
          <div style={railStyle} className="rounded-r-md" />
        </div>
      </div>
    </div>
  );
}
