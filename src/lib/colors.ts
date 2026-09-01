import type { Category, PortSide, PortType } from '../types';

export const CATEGORY_COLOR: Record<Category, string> = {
  Networking: '#2563eb',
  'Compute & Storage': '#7c3aed',
  'Power & Cooling': '#059669',
  'Patch & Cable': '#d97706',
  Structural: '#64748b',
  Custom: '#e11d48',
};

export const CATEGORY_ORDER: Category[] = [
  'Networking',
  'Compute & Storage',
  'Patch & Cable',
  'Power & Cooling',
  'Structural',
  'Custom',
];

export const SWATCHES = [
  '#2563eb',
  '#7c3aed',
  '#059669',
  '#d97706',
  '#e11d48',
  '#0891b2',
  '#65a30d',
  '#64748b',
];

export const PORT_TYPE_COLOR: Record<PortType, string> = {
  rj45: '#22d3ee',
  sfp: '#a78bfa',
  'usb-a': '#fb923c',
  'usb-c': '#fbbf24',
  power: '#f87171',
  coax: '#94a3b8',
  other: '#e5e7eb',
};

export const SIDE_COLOR: Record<PortSide, string> = {
  front: '#38bdf8',
  rear: '#fb923c',
  both: '#34d399',
};

export const EXTERNAL_COLOR = '#f472b6';

export const PORT_TYPE_LABEL: Record<PortType, string> = {
  rj45: 'RJ45',
  sfp: 'SFP/SFP+',
  'usb-a': 'USB-A',
  'usb-c': 'USB-C',
  power: 'Power',
  coax: 'Coax',
  other: 'Other',
};

export const CABLE_PALETTE = [
  '#38bdf8',
  '#fb923c',
  '#4ade80',
  '#f472b6',
  '#facc15',
  '#a78bfa',
  '#2dd4bf',
  '#f87171',
];
