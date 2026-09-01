import type { DeviceTemplate, PortDef, PortSide, PortType } from '../types';
import { CATEGORY_COLOR } from '../lib/colors';
import { makeId } from '../lib/id';

function ports(
  count: number,
  label: string,
  type: PortType,
  side: PortSide,
  startAt = 1,
): PortDef[] {
  return Array.from({ length: count }, (_, i) => ({
    id: makeId(),
    label: count === 1 ? label : `${label} ${startAt + i}`,
    type,
    side,
  }));
}

function device(
  id: string,
  name: string,
  category: DeviceTemplate['category'],
  heightU: number,
  portDefs: PortDef[],
): DeviceTemplate {
  return {
    id,
    name,
    category,
    heightU,
    color: CATEGORY_COLOR[category],
    ports: portDefs,
    builtIn: true,
  };
}

export const builtInTemplates: DeviceTemplate[] = [
  device('router', 'Router', 'Networking', 1, [
    ...ports(1, 'WAN', 'rj45', 'front'),
    ...ports(4, 'LAN', 'rj45', 'front'),
  ]),
  device('modem', 'Modem / ONT', 'Networking', 1, [
    ...ports(1, 'WAN', 'coax', 'front'),
    ...ports(1, 'LAN', 'rj45', 'front'),
  ]),
  device('switch-8', 'Switch (8-port)', 'Networking', 1, [
    ...ports(8, 'Port', 'rj45', 'front'),
  ]),
  device('switch-24', 'Switch (24-port)', 'Networking', 1, [
    ...ports(24, 'Port', 'rj45', 'front'),
    ...ports(2, 'SFP+', 'sfp', 'front'),
  ]),
  device('firewall', 'Firewall', 'Networking', 1, [
    ...ports(1, 'WAN', 'rj45', 'front'),
    ...ports(6, 'LAN', 'rj45', 'front'),
  ]),
  device('wap', 'Wireless AP / Controller', 'Networking', 1, [
    ...ports(1, 'Uplink', 'rj45', 'front'),
    ...ports(1, 'PoE In', 'power', 'front'),
  ]),
  device('patch-12', 'Patch Panel (12-port)', 'Patch & Cable', 1, [
    ...ports(12, 'Port', 'rj45', 'both'),
  ]),
  device('patch-24', 'Patch Panel (24-port)', 'Patch & Cable', 1, [
    ...ports(24, 'Port', 'rj45', 'both'),
  ]),
  device('cable-mgmt', 'Cable Management', 'Patch & Cable', 1, []),
  device('mini-pc', 'Mini PC', 'Compute & Storage', 1, [
    ...ports(2, 'LAN', 'rj45', 'rear'),
    ...ports(4, 'USB-A', 'usb-a', 'rear'),
    ...ports(1, 'USB-C', 'usb-c', 'rear'),
    ...ports(1, 'Power', 'power', 'rear'),
  ]),
  device('server-2u', 'Server', 'Compute & Storage', 2, [
    ...ports(2, 'LAN', 'rj45', 'rear'),
    ...ports(1, 'iDRAC/IPMI', 'rj45', 'rear'),
    ...ports(2, 'USB-A', 'usb-a', 'rear'),
    ...ports(2, 'Power', 'power', 'rear'),
  ]),
  device('nas-4bay', 'NAS', 'Compute & Storage', 2, [
    ...ports(2, 'LAN', 'rj45', 'rear'),
    ...ports(2, 'USB-A', 'usb-a', 'rear'),
    ...ports(1, 'Power', 'power', 'rear'),
  ]),
  device('ups', 'UPS', 'Power & Cooling', 2, [...ports(1, 'Input', 'power', 'rear')]),
  device('pdu', 'PDU (8-outlet)', 'Power & Cooling', 1, [
    ...ports(8, 'Outlet', 'power', 'rear'),
  ]),
  device('fan-panel', 'Fan Panel', 'Power & Cooling', 1, [...ports(1, 'Power', 'power', 'rear')]),
  device('blank', 'Blank Panel', 'Structural', 1, []),
  device('shelf', 'Shelf', 'Structural', 1, []),
];
