import { Plus, Trash2, X } from 'lucide-react';
import { useRackStore, useActiveRack } from '../store/rackStore';
import { useUiStore } from '../store/uiStore';
import { SWATCHES, PORT_TYPE_COLOR, SIDE_COLOR } from '../lib/colors';
import { makeId } from '../lib/id';
import type { PortSide, PortType } from '../types';

const PORT_TYPES: PortType[] = ['rj45', 'sfp', 'usb-a', 'usb-c', 'power', 'coax', 'other'];

export function Inspector() {
  const rack = useActiveRack();
  const removeDevice = useRackStore((s) => s.removeDevice);
  const renameDevice = useRackStore((s) => s.renameDevice);
  const setDeviceColor = useRackStore((s) => s.setDeviceColor);
  const setDevicePorts = useRackStore((s) => s.setDevicePorts);
  const removeConnection = useRackStore((s) => s.removeConnection);
  const recolorConnection = useRackStore((s) => s.recolorConnection);

  const selectedId = useUiStore((s) => s.selectedId);
  const select = useUiStore((s) => s.select);
  const rightTab = useUiStore((s) => s.rightTab);
  const setRightTab = useUiStore((s) => s.setRightTab);
  const mobilePanel = useUiStore((s) => s.mobilePanel);
  const setMobilePanel = useUiStore((s) => s.setMobilePanel);
  const open = mobilePanel === 'inspector';

  const device = rack.devices.find((d) => d.instanceId === selectedId) ?? null;
  const nameOf = (instanceId: string, portId: string) => {
    const d = rack.devices.find((x) => x.instanceId === instanceId);
    const p = d?.ports.find((x) => x.id === portId);
    return `${d?.name ?? '?'} / ${p?.label ?? '?'}`;
  };
  const otherEndOf = (c: (typeof rack.connections)[number]) =>
    c.toDevice ? nameOf(c.toDevice, c.toPort!) : `Outside: ${c.toExternalLabel}`;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobilePanel('none')}
        />
      )}
      <div
        className={`print:hidden z-50 flex w-72 shrink-0 flex-col border-l border-zinc-800 bg-[#19191c] lg:static lg:z-auto lg:flex ${
          open ? 'fixed inset-y-0 right-0' : 'hidden'
        }`}
      >
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setRightTab('device')}
            className={`flex-1 px-3 py-2.5 text-[11px] font-semibold tracking-wide uppercase ${
              rightTab === 'device' ? 'border-b-2 border-blue-500 text-zinc-100' : 'text-zinc-500'
            }`}
          >
            Device
          </button>
          <button
            onClick={() => setRightTab('connections')}
            className={`flex-1 px-3 py-2.5 text-[11px] font-semibold tracking-wide uppercase ${
              rightTab === 'connections' ? 'border-b-2 border-blue-500 text-zinc-100' : 'text-zinc-500'
            }`}
          >
            Cables ({rack.connections.length})
          </button>
          <button
            onClick={() => setMobilePanel('none')}
            className="flex items-center px-2 text-zinc-400 hover:bg-zinc-800 lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {rightTab === 'device' &&
          (device ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-[11px] text-zinc-400">Name</label>
                <input
                  value={device.name}
                  onChange={(e) => renameDevice(device.instanceId, e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
                />
              </div>
              <div className="text-[11px] text-zinc-500">
                U{device.startU}
                {device.heightU > 1 ? `–U${device.startU + device.heightU - 1}` : ''} ·{' '}
                {device.heightU}U
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-zinc-400">Color</label>
                <div className="flex gap-1.5">
                  {SWATCHES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setDeviceColor(device.instanceId, c)}
                      className={`h-6 w-6 rounded-full ${device.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#19191c]' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-[11px] text-zinc-400">Ports</label>
                  <button
                    onClick={() =>
                      setDevicePorts(device.instanceId, [
                        ...device.ports,
                        { id: makeId(), label: 'Port', type: 'rj45', side: 'front' },
                      ])
                    }
                    className="flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-700"
                  >
                    <Plus size={10} /> Add
                  </button>
                </div>
                <div className="space-y-1">
                  {device.ports.length === 0 && (
                    <p className="text-[11px] text-zinc-600">No ports on this device.</p>
                  )}
                  {device.ports.map((p) => (
                    <div key={p.id} className="flex items-center gap-1">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        title={p.type}
                        style={{ backgroundColor: PORT_TYPE_COLOR[p.type] }}
                      />
                      <input
                        value={p.label}
                        onChange={(e) =>
                          setDevicePorts(
                            device.instanceId,
                            device.ports.map((x) =>
                              x.id === p.id ? { ...x, label: e.target.value } : x,
                            ),
                          )
                        }
                        className="w-16 min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-800 px-1.5 py-1 text-[11px] text-zinc-100 outline-none"
                      />
                      <select
                        value={p.type}
                        onChange={(e) =>
                          setDevicePorts(
                            device.instanceId,
                            device.ports.map((x) =>
                              x.id === p.id ? { ...x, type: e.target.value as PortType } : x,
                            ),
                          )
                        }
                        className="rounded border border-zinc-700 bg-zinc-800 px-1 py-1 text-[11px] text-zinc-100 outline-none"
                      >
                        {PORT_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <select
                        value={p.side}
                        onChange={(e) =>
                          setDevicePorts(
                            device.instanceId,
                            device.ports.map((x) =>
                              x.id === p.id ? { ...x, side: e.target.value as PortSide } : x,
                            ),
                          )
                        }
                        className="rounded border px-1 py-1 text-[11px] font-medium outline-none"
                        style={{
                          backgroundColor: `${SIDE_COLOR[p.side]}22`,
                          borderColor: `${SIDE_COLOR[p.side]}88`,
                          color: SIDE_COLOR[p.side],
                        }}
                      >
                        <option value="front">front</option>
                        <option value="rear">rear</option>
                        <option value="both">both</option>
                      </select>
                      <button
                        onClick={() =>
                          setDevicePorts(
                            device.instanceId,
                            device.ports.filter((x) => x.id !== p.id),
                          )
                        }
                        className="rounded p-1 text-zinc-500 hover:bg-red-500/20 hover:text-red-400"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  removeDevice(device.instanceId);
                  select(null);
                }}
                className="w-full rounded border border-red-900/50 py-1.5 text-[11px] font-medium text-red-400 hover:bg-red-500/10"
              >
                Remove from rack
              </button>
            </div>
          ) : (
            <p className="px-1 text-[11px] leading-relaxed text-zinc-600">
              Select a device in the rack to edit its name, color and ports.
            </p>
          ))}

        {rightTab === 'connections' && (
          <div className="space-y-1">
            {rack.connections.length === 0 && (
              <p className="px-1 text-[11px] leading-relaxed text-zinc-600">
                No cables yet. Click a port on the rack, then click another port to connect them.
              </p>
            )}
            {rack.connections.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-900 px-2 py-1.5"
              >
                <button
                  title="Click to change cable color"
                  onClick={() => recolorConnection(c.id)}
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <div className="min-w-0 flex-1 text-[10.5px] leading-tight text-zinc-300">
                  <div className="truncate">{nameOf(c.fromDevice, c.fromPort)}</div>
                  <div className="truncate text-zinc-500">→ {otherEndOf(c)}</div>
                </div>
                <button
                  onClick={() => removeConnection(c.id)}
                  className="shrink-0 rounded p-1 text-zinc-500 hover:bg-red-500/20 hover:text-red-400"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </>
  );
}
