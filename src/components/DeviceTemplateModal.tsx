import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { useRackStore } from '../store/rackStore';
import { SWATCHES, SIDE_COLOR } from '../lib/colors';
import { makeId } from '../lib/id';
import type { Category, DeviceTemplate, PortSide, PortType } from '../types';

const CATEGORIES: Category[] = [
  'Networking',
  'Compute & Storage',
  'Power & Cooling',
  'Patch & Cable',
  'Structural',
  'Custom',
];
const PORT_TYPES: PortType[] = ['rj45', 'sfp', 'usb-a', 'usb-c', 'power', 'coax', 'other'];

interface PortGroup {
  key: string;
  label: string;
  type: PortType;
  side: PortSide;
  count: number;
}

interface Props {
  seed?: DeviceTemplate;
  editId?: string;
  onClose: () => void;
}

export function DeviceTemplateModal({ seed, editId, onClose }: Props) {
  const addTemplate = useRackStore((s) => s.addTemplate);
  const updateTemplate = useRackStore((s) => s.updateTemplate);

  const [name, setName] = useState(seed ? (editId ? seed.name : `${seed.name} Copy`) : 'New Device');
  const [category, setCategory] = useState<Category>(seed?.category ?? 'Custom');
  const [heightU, setHeightU] = useState(seed?.heightU ?? 1);
  const [color, setColor] = useState(seed?.color ?? SWATCHES[0]);
  const [mountSide, setMountSide] = useState<PortSide>(seed?.mountSide ?? 'both');
  const [groups, setGroups] = useState<PortGroup[]>(
    seed
      ? Array.from(
          seed.ports.reduce((map, p) => {
            const base = p.label.replace(/\s+\d+$/, '');
            const key = `${base}|${p.type}|${p.side}`;
            const g = map.get(key);
            if (g) g.count += 1;
            else map.set(key, { key: makeId(), label: base, type: p.type, side: p.side, count: 1 });
            return map;
          }, new Map<string, PortGroup>()),
        ).map(([, g]) => g)
      : [],
  );

  function addGroup() {
    setGroups((g) => [...g, { key: makeId(), label: 'Port', type: 'rj45', side: 'front', count: 1 }]);
  }
  function updateGroup(key: string, patch: Partial<PortGroup>) {
    setGroups((g) => g.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  }
  function removeGroup(key: string) {
    setGroups((g) => g.filter((x) => x.key !== key));
  }

  function save() {
    const ports = groups.flatMap((g) =>
      Array.from({ length: Math.max(1, g.count) }, (_, i) => ({
        id: makeId(),
        label: g.count > 1 ? `${g.label} ${i + 1}` : g.label,
        type: g.type,
        side: g.side,
      })),
    );
    if (editId) {
      updateTemplate(editId, { name, category, heightU, color, ports, mountSide });
    } else {
      addTemplate({ name, category, heightU, color, ports, mountSide });
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-100">
            {editId ? 'Edit device' : 'New device'}
          </h2>
          <button onClick={onClose} className="rounded p-1 text-zinc-400 hover:bg-zinc-800">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <div>
            <label className="mb-1 block text-[11px] text-zinc-400">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-[11px] text-zinc-400">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-20">
              <label className="mb-1 block text-[11px] text-zinc-400">Height</label>
              <input
                type="number"
                min={0.5}
                max={12}
                step={0.5}
                value={heightU}
                onChange={(e) =>
                  setHeightU(Math.max(0.5, Math.min(12, Math.round(Number(e.target.value) * 2) / 2)))
                }
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-[11px] text-zinc-400">Color</label>
              <div className="flex gap-1.5">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-6 w-6 rounded-full ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="w-28">
              <label className="mb-1 block text-[11px] text-zinc-400">Visible on</label>
              <select
                value={mountSide}
                onChange={(e) => setMountSide(e.target.value as PortSide)}
                className="w-full rounded border px-2 py-1.5 text-sm font-medium outline-none"
                style={{
                  backgroundColor: `${SIDE_COLOR[mountSide]}22`,
                  borderColor: `${SIDE_COLOR[mountSide]}88`,
                  color: SIDE_COLOR[mountSide],
                }}
              >
                <option value="both">both</option>
                <option value="front">front only</option>
                <option value="rear">rear only</option>
              </select>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[11px] text-zinc-400">Ports</label>
              <button
                onClick={addGroup}
                className="flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-700"
              >
                <Plus size={10} /> Add port group
              </button>
            </div>
            <div className="space-y-1.5">
              {groups.length === 0 && (
                <p className="text-[11px] text-zinc-600">No ports on this device.</p>
              )}
              {groups.map((g) => (
                <div key={g.key} className="flex items-center gap-1 rounded border border-zinc-800 bg-zinc-800/50 p-1.5">
                  <input
                    value={g.label}
                    onChange={(e) => updateGroup(g.key, { label: e.target.value })}
                    placeholder="Label"
                    className="w-16 min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-800 px-1.5 py-1 text-[11px] text-zinc-100 outline-none"
                  />
                  <select
                    value={g.type}
                    onChange={(e) => updateGroup(g.key, { type: e.target.value as PortType })}
                    className="rounded border border-zinc-700 bg-zinc-800 px-1 py-1 text-[11px] text-zinc-100 outline-none"
                  >
                    {PORT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <select
                    value={g.side}
                    onChange={(e) => updateGroup(g.key, { side: e.target.value as PortSide })}
                    className="rounded border px-1 py-1 text-[11px] font-medium outline-none"
                    style={{
                      backgroundColor: `${SIDE_COLOR[g.side]}22`,
                      borderColor: `${SIDE_COLOR[g.side]}88`,
                      color: SIDE_COLOR[g.side],
                    }}
                  >
                    <option value="front">front</option>
                    <option value="rear">rear</option>
                    <option value="both">both</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={48}
                    value={g.count}
                    onChange={(e) => updateGroup(g.key, { count: Math.max(1, Number(e.target.value)) })}
                    className="w-12 rounded border border-zinc-700 bg-zinc-800 px-1 py-1 text-center text-[11px] text-zinc-100 outline-none"
                  />
                  <button
                    onClick={() => removeGroup(g.key)}
                    className="rounded p-1 text-zinc-500 hover:bg-red-500/20 hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-800 px-4 py-3">
          <button
            onClick={onClose}
            className="rounded px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!name.trim()}
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-40"
          >
            Save device
          </button>
        </div>
      </div>
    </div>
  );
}
