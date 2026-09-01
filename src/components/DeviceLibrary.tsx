import { useMemo, useState } from 'react';
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import { useRackStore } from '../store/rackStore';
import { useUiStore } from '../store/uiStore';
import { CATEGORY_ORDER } from '../lib/colors';
import { CATEGORY_ICON } from '../lib/icons';
import type { DeviceTemplate } from '../types';
import { DeviceTemplateModal } from './DeviceTemplateModal';

export function DeviceLibrary() {
  const templates = useRackStore((s) => s.templates);
  const removeTemplate = useRackStore((s) => s.removeTemplate);
  const setDraggingTemplateId = useUiStore((s) => s.setDraggingTemplateId);

  const [modal, setModal] = useState<{ seed?: DeviceTemplate; editId?: string } | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, DeviceTemplate[]>();
    for (const cat of CATEGORY_ORDER) map.set(cat, []);
    for (const t of templates) {
      if (!map.has(t.category)) map.set(t.category, []);
      map.get(t.category)!.push(t);
    }
    for (const items of map.values()) {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }
    return map;
  }, [templates]);

  return (
    <div className="print:hidden flex w-64 shrink-0 flex-col border-r border-zinc-800 bg-[#19191c]">
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-3">
        <span className="text-xs font-semibold tracking-wide text-zinc-300 uppercase">
          Components
        </span>
        <button
          type="button"
          onClick={() => setModal({})}
          className="flex items-center gap-1 rounded bg-blue-600/90 px-2 py-1 text-[11px] font-medium text-white hover:bg-blue-500"
        >
          <Plus size={12} /> New
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {[...grouped.entries()]
          .filter(([, items]) => items.length > 0)
          .map(([category, items]) => {
            const Icon = CATEGORY_ICON[category as keyof typeof CATEGORY_ICON] ?? CATEGORY_ICON.Custom;
            return (
              <div key={category} className="mb-3">
                <div className="mb-1 flex items-center gap-1.5 px-1 text-[10px] font-semibold tracking-wide text-zinc-500 uppercase">
                  <Icon size={11} />
                  {category}
                </div>
                <div className="flex flex-col gap-1">
                  {items.map((t) => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', t.id);
                        e.dataTransfer.effectAllowed = 'copy';
                        setDraggingTemplateId(t.id);
                      }}
                      onDragEnd={() => setDraggingTemplateId(null)}
                      className="group flex cursor-grab items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 active:cursor-grabbing hover:border-zinc-700 hover:bg-zinc-800"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="min-w-0 flex-1 truncate text-[12px] text-zinc-200">
                        {t.name}
                      </span>
                      <span className="shrink-0 font-mono text-[9px] text-zinc-500">
                        {t.heightU}U
                      </span>
                      <div className="flex shrink-0 items-center opacity-0 group-hover:opacity-100">
                        <button
                          type="button"
                          title={t.builtIn ? 'Duplicate as custom device' : 'Edit device'}
                          onClick={() =>
                            t.builtIn ? setModal({ seed: t }) : setModal({ seed: t, editId: t.id })
                          }
                          className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                        >
                          {t.builtIn ? <Copy size={11} /> : <Pencil size={11} />}
                        </button>
                        {!t.builtIn && (
                          <button
                            type="button"
                            title="Delete device type"
                            onClick={() => removeTemplate(t.id)}
                            className="rounded p-1 text-zinc-400 hover:bg-red-500/20 hover:text-red-400"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
      <div className="border-t border-zinc-800 px-3 py-2 text-[10px] leading-snug text-zinc-600">
        Drag a component onto the rack. Click a port, then click another port to run a cable.
      </div>
      {modal && (
        <DeviceTemplateModal
          seed={modal.seed}
          editId={modal.editId}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
