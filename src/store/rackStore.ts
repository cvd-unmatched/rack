import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Connection, DeviceTemplate, MountedDevice, PortDef, RackConfig } from '../types';
import { builtInTemplates } from '../data/deviceLibrary';
import { makeId } from '../lib/id';
import { CABLE_PALETTE } from '../lib/colors';

function emptyRack(): RackConfig {
  return {
    id: makeId(),
    name: 'My Rack',
    heightU: 12,
    widthIn: 19,
    devices: [],
    connections: [],
  };
}

function fits(devices: MountedDevice[], startU: number, heightU: number, ignoreId?: string) {
  const endU = startU + heightU - 1;
  return devices.every((d) => {
    if (d.instanceId === ignoreId) return true;
    const dEnd = d.startU + d.heightU - 1;
    return endU < d.startU || startU > dEnd;
  });
}

interface RackStore {
  rack: RackConfig;
  templates: DeviceTemplate[];

  setRackHeight: (u: number) => void;
  setRackWidth: (w: number) => void;
  setRackName: (name: string) => void;

  canPlace: (heightU: number, startU: number, ignoreId?: string) => boolean;
  addDevice: (templateId: string, startU: number) => string | null;
  removeDevice: (instanceId: string) => void;
  moveDevice: (instanceId: string, startU: number) => boolean;
  renameDevice: (instanceId: string, name: string) => void;
  setDeviceColor: (instanceId: string, color: string) => void;
  setDevicePorts: (instanceId: string, ports: PortDef[]) => void;
  setPortOccupied: (instanceId: string, portId: string, occupied: boolean) => void;

  addTemplate: (t: Omit<DeviceTemplate, 'id' | 'builtIn'>) => DeviceTemplate;
  updateTemplate: (id: string, patch: Partial<DeviceTemplate>) => void;
  removeTemplate: (id: string) => void;

  addConnection: (c: Omit<Connection, 'id' | 'color'>) => void;
  removeConnection: (id: string) => void;
  recolorConnection: (id: string) => void;

  importState: (data: { rack: RackConfig; templates: DeviceTemplate[] }) => void;
  resetAll: () => void;
}

export const useRackStore = create<RackStore>()(
  persist(
    (set, get) => ({
      rack: emptyRack(),
      templates: builtInTemplates,

      setRackHeight: (u) =>
        set((s) => ({ rack: { ...s.rack, heightU: Math.max(1, Math.min(60, u)) } })),
      setRackWidth: (w) =>
        set((s) => ({ rack: { ...s.rack, widthIn: Math.max(4, Math.min(30, w)) } })),
      setRackName: (name) => set((s) => ({ rack: { ...s.rack, name } })),

      canPlace: (heightU, startU, ignoreId) => {
        const { rack } = get();
        if (startU < 1 || startU + heightU - 1 > rack.heightU) return false;
        return fits(rack.devices, startU, heightU, ignoreId);
      },

      addDevice: (templateId, startU) => {
        const { templates, canPlace, rack } = get();
        const tpl = templates.find((t) => t.id === templateId);
        if (!tpl) return null;
        if (!canPlace(tpl.heightU, startU)) return null;
        const instance: MountedDevice = {
          instanceId: makeId(),
          templateId: tpl.id,
          name: tpl.name,
          startU,
          heightU: tpl.heightU,
          color: tpl.color,
          ports: tpl.ports.map((p) => ({ ...p, id: makeId() })),
        };
        set({ rack: { ...rack, devices: [...rack.devices, instance] } });
        return instance.instanceId;
      },

      removeDevice: (instanceId) =>
        set((s) => ({
          rack: {
            ...s.rack,
            devices: s.rack.devices.filter((d) => d.instanceId !== instanceId),
            connections: s.rack.connections.filter(
              (c) => c.fromDevice !== instanceId && c.toDevice !== instanceId,
            ),
          },
        })),

      moveDevice: (instanceId, startU) => {
        const { rack, canPlace } = get();
        const dev = rack.devices.find((d) => d.instanceId === instanceId);
        if (!dev) return false;
        if (!canPlace(dev.heightU, startU, instanceId)) return false;
        set({
          rack: {
            ...rack,
            devices: rack.devices.map((d) =>
              d.instanceId === instanceId ? { ...d, startU } : d,
            ),
          },
        });
        return true;
      },

      renameDevice: (instanceId, name) =>
        set((s) => ({
          rack: {
            ...s.rack,
            devices: s.rack.devices.map((d) =>
              d.instanceId === instanceId ? { ...d, name } : d,
            ),
          },
        })),

      setDeviceColor: (instanceId, color) =>
        set((s) => ({
          rack: {
            ...s.rack,
            devices: s.rack.devices.map((d) =>
              d.instanceId === instanceId ? { ...d, color } : d,
            ),
          },
        })),

      setDevicePorts: (instanceId, ports) =>
        set((s) => ({
          rack: {
            ...s.rack,
            devices: s.rack.devices.map((d) =>
              d.instanceId === instanceId ? { ...d, ports } : d,
            ),
          },
        })),

      setPortOccupied: (instanceId, portId, occupied) =>
        set((s) => ({
          rack: {
            ...s.rack,
            devices: s.rack.devices.map((d) =>
              d.instanceId === instanceId
                ? { ...d, ports: d.ports.map((p) => (p.id === portId ? { ...p, occupied } : p)) }
                : d,
            ),
          },
        })),

      addTemplate: (t) => {
        const tpl: DeviceTemplate = { ...t, id: makeId(), builtIn: false };
        set((s) => ({ templates: [...s.templates, tpl] }));
        return tpl;
      },

      updateTemplate: (id, patch) =>
        set((s) => ({
          templates: s.templates.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      removeTemplate: (id) =>
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id || t.builtIn) })),

      addConnection: (c) => {
        const { rack } = get();
        if (c.fromDevice === c.toDevice && c.fromPort === c.toPort) return;
        const color = CABLE_PALETTE[rack.connections.length % CABLE_PALETTE.length];
        const conn: Connection = { ...c, id: makeId(), color };
        set({ rack: { ...rack, connections: [...rack.connections, conn] } });
      },

      removeConnection: (id) =>
        set((s) => ({
          rack: { ...s.rack, connections: s.rack.connections.filter((c) => c.id !== id) },
        })),

      recolorConnection: (id) =>
        set((s) => ({
          rack: {
            ...s.rack,
            connections: s.rack.connections.map((c) => {
              if (c.id !== id) return c;
              const idx = CABLE_PALETTE.indexOf(c.color);
              const next = CABLE_PALETTE[(idx + 1) % CABLE_PALETTE.length];
              return { ...c, color: next };
            }),
          },
        })),

      importState: (data) => set({ rack: data.rack, templates: data.templates }),

      resetAll: () => set({ rack: emptyRack(), templates: builtInTemplates }),
    }),
    { name: 'rack-builder-state' },
  ),
);
