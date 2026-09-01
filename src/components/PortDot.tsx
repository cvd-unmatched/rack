import type { PortDef } from '../types';
import { EXTERNAL_COLOR, PORT_TYPE_COLOR, PORT_TYPE_LABEL } from '../lib/colors';

interface Props {
  instanceId: string;
  port: PortDef;
  scale: number;
  connected: boolean;
  externalLabel?: string;
  pending: boolean;
  onClick: (instanceId: string, portId: string, e: React.MouseEvent) => void;
}

export function PortDot({ instanceId, port, scale, connected, externalLabel, pending, onClick }: Props) {
  const typeColor = PORT_TYPE_COLOR[port.type];
  const fillColor = externalLabel ? EXTERNAL_COLOR : typeColor;
  const filled = connected || pending || port.occupied;
  const label = `${port.label} · ${PORT_TYPE_LABEL[port.type]} · ${port.side}${externalLabel ? ` · ↗ ${externalLabel}` : ''}${port.occupied && !connected ? ' · in use' : ''}`;
  const size = 8 * scale;
  return (
    <button
      type="button"
      data-port-key={`${instanceId}:${port.id}`}
      title={label}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClick(instanceId, port.id, e);
      }}
      className="shrink-0 rounded-full transition-transform hover:scale-125"
      style={{
        width: size,
        height: size,
        backgroundColor: filled ? fillColor : 'transparent',
        opacity: port.occupied && !connected && !pending ? 0.6 : 1,
        border: `${1.5 * scale}px solid ${typeColor}`,
        boxShadow: pending ? `0 0 0 ${3 * scale}px ${typeColor}55` : 'none',
      }}
    />
  );
}
