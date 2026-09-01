import { useRackStore } from '../store/rackStore';
import { PORT_TYPE_LABEL } from '../lib/colors';

export function PrintSummary() {
  const rack = useRackStore((s) => s.rack);

  const nameOf = (instanceId: string, portId: string) => {
    const d = rack.devices.find((x) => x.instanceId === instanceId);
    const p = d?.ports.find((x) => x.id === portId);
    return `${d?.name ?? '?'} / ${p?.label ?? '?'}`;
  };
  const otherEndOf = (c: (typeof rack.connections)[number]) =>
    c.toDevice ? nameOf(c.toDevice, c.toPort!) : `Outside: ${c.toExternalLabel}`;

  const sorted = [...rack.devices].sort((a, b) => a.startU - b.startU);

  return (
    <div className="hidden print:block print:text-black">
      <h1 className="text-lg font-semibold">{rack.name}</h1>
      <p className="mb-4 text-xs text-zinc-600">
        {rack.heightU}U, {rack.widthIn}" rail, {rack.devices.length} devices,{' '}
        {rack.connections.length} cables
      </p>

      <h2 className="mt-4 mb-1 text-sm font-semibold">Mounted devices</h2>
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="border-b border-zinc-400 text-left">
            <th className="py-1 pr-2">U position</th>
            <th className="py-1 pr-2">Device</th>
            <th className="py-1 pr-2">Height</th>
            <th className="py-1 pr-2">Ports</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((d) => (
            <tr key={d.instanceId} className="border-b border-zinc-200">
              <td className="py-1 pr-2 font-mono">
                U{d.startU}
                {d.heightU > 1 ? ` to U${d.startU + d.heightU - 1}` : ''}
              </td>
              <td className="py-1 pr-2">{d.name}</td>
              <td className="py-1 pr-2">{d.heightU}U</td>
              <td className="py-1 pr-2">
                {d.ports.length === 0
                  ? 'none'
                  : d.ports.map((p) => `${p.label} (${PORT_TYPE_LABEL[p.type]}, ${p.side})`).join(', ')}
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={4} className="py-2 text-zinc-500">
                No devices mounted.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <h2 className="mt-5 mb-1 text-sm font-semibold">Cable connections</h2>
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="border-b border-zinc-400 text-left">
            <th className="py-1 pr-2">From</th>
            <th className="py-1 pr-2">To</th>
          </tr>
        </thead>
        <tbody>
          {rack.connections.map((c) => (
            <tr key={c.id} className="border-b border-zinc-200">
              <td className="py-1 pr-2">{nameOf(c.fromDevice, c.fromPort)}</td>
              <td className="py-1 pr-2">{otherEndOf(c)}</td>
            </tr>
          ))}
          {rack.connections.length === 0 && (
            <tr>
              <td colSpan={2} className="py-2 text-zinc-500">
                No cables recorded.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
