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

function fits(devices: MountedDevice[], startU: number, heightU: number, ignoreIds?: string[]) {
  const endU = startU + heightU - 1;
  return devices.every((d) => {
    if (ignoreIds?.includes(d.instanceId)) return true;
    const dEnd = d.startU + d.heightU - 1;
    return endU < d.startU || startU > dEnd;
  });
}

interface RackStore {
  rack: RackConfig;
  templates: DeviceTemplate[];

  /** Returns the height actually applied, clamped so it never cuts through a mounted device. */
  setRackHeight: (u: number) => number;
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

      setRackHeight: (u) => {
        const { rack } = get();
        const requested = Math.max(1, Math.min(60, Math.round(u)));
        const minRequired = rack.devices.reduce(
          (max, d) => Math.max(max, d.startU + d.heightU - 1),
          1,
        );
        const applied = Math.max(requested, minRequired);
        set((s) => ({ rack: { ...s.rack, heightU: applied } }));
        return applied;
      },
      setRackWidth: (w) =>
        set((s) => ({ rack: { ...s.rack, widthIn: Math.max(4, Math.min(30, w)) } })),
      setRackName: (name) => set((s) => ({ rack: { ...s.rack, name } })),

      canPlace: (heightU, startU, ignoreId) => {
        const { rack } = get();
        if (startU < 1 || startU + heightU - 1 > rack.heightU) return false;
        return fits(rack.devices, startU, heightU, ignoreId ? [ignoreId] : undefined);
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

        if (canPlace(dev.heightU, startU, instanceId)) {
          set({
            rack: {
              ...rack,
              devices: rack.devices.map((d) =>
                d.instanceId === instanceId ? { ...d, startU } : d,
              ),
            },
          });
          return true;
        }

        // Blocked by exactly one device: swap positions if each fits where
        // the other used to be, instead of just rejecting the move.
        const targetEnd = startU + dev.heightU - 1;
        const blockers = rack.devices.filter((d) => {
          if (d.instanceId === instanceId) return false;
          const dEnd = d.startU + d.heightU - 1;
          return targetEnd >= d.startU && startU <= dEnd;
        });
        if (blockers.length !== 1) return false;
        const other = blockers[0];

        const bothIgnored = [instanceId, other.instanceId];
        const boundsOk = (u: number, h: number) => u >= 1 && u + h - 1 <= rack.heightU;
        const swapOk =
          boundsOk(startU, dev.heightU) &&
          boundsOk(dev.startU, other.heightU) &&
          fits(rack.devices, startU, dev.heightU, bothIgnored) &&
          fits(rack.devices, dev.startU, other.heightU, bothIgnored);
        if (!swapOk) return false;

        const otherNewStartU = dev.startU;
        set({
          rack: {
            ...rack,
            devices: rack.devices.map((d) => {
              if (d.instanceId === instanceId) return { ...d, startU };
              if (d.instanceId === other.instanceId) return { ...d, startU: otherNewStartU };
              return d;
            }),
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

        // A port only ever holds one cable: replace whatever was already
        // plugged into either end (on this same face) instead of stacking.
        const sameFace = (conn: Connection) => !conn.face || !c.face || conn.face === c.face;
        const touchesEndpoint = (conn: Connection, deviceId: string, portId: string) =>
          (conn.fromDevice === deviceId && conn.fromPort === portId) ||
          (conn.toDevice === deviceId && conn.toPort === portId);
        const survivors = rack.connections.filter((conn) => {
          if (!sameFace(conn)) return true;
          if (touchesEndpoint(conn, c.fromDevice, c.fromPort)) return false;
          if (c.toDevice && touchesEndpoint(conn, c.toDevice, c.toPort!)) return false;
          return true;
        });

        const color = CABLE_PALETTE[survivors.length % CABLE_PALETTE.length];
        const conn: Connection = { ...c, id: makeId(), color };
        set({ rack: { ...rack, connections: [...survivors, conn] } });
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
