import { useRef, useState } from 'react';
import { FolderOpen, PanelLeft, PanelRight, Printer, RotateCcw, Save, Server } from 'lucide-react';
import { useRackStore } from '../store/rackStore';
import { useUiStore } from '../store/uiStore';
import { loadFromFile, parseRackFile, saveToFile, serialize } from '../lib/fileIO';
import { useServerSync } from '../lib/useServerSync';

const SYNC_LABEL: Record<ReturnType<typeof useServerSync>, string> = {
  checking: 'Checking server...',
  synced: 'Synced to server volume',
  'local-only': 'No server storage, saved to this browser only',
  error: 'Server sync failed, saved to this browser only',
};

const SYNC_COLOR: Record<ReturnType<typeof useServerSync>, string> = {
  checking: '#71717a',
  synced: '#4ade80',
  'local-only': '#71717a',
  error: '#f87171',
};

export function Header() {
  const syncStatus = useServerSync();
  const mobilePanel = useUiStore((s) => s.mobilePanel);
  const setMobilePanel = useUiStore((s) => s.setMobilePanel);
  const rack = useRackStore((s) => s.rack);
  const templates = useRackStore((s) => s.templates);
  const setRackHeight = useRackStore((s) => s.setRackHeight);
  const setRackWidth = useRackStore((s) => s.setRackWidth);
  const setRackName = useRackStore((s) => s.setRackName);
  const importState = useRackStore((s) => s.importState);
  const resetAll = useRackStore((s) => s.resetAll);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errTimer = useRef<number | undefined>(undefined);

  function flashError(msg: string) {
    setError(msg);
    window.clearTimeout(errTimer.current);
    errTimer.current = window.setTimeout(() => setError(null), 4000);
  }

  async function handleSave() {
    setBusy(true);
    try {
      const filename = `${rack.name.trim().toLowerCase().replace(/\s+/g, '-') || 'rack'}.json`;
      await saveToFile(serialize(rack, templates), filename);
    } finally {
      setBusy(false);
    }
  }

  async function handleLoad() {
    setBusy(true);
    try {
      const text = await loadFromFile();
      if (!text) return;
      const data = parseRackFile(text);
      importState(data);
    } catch {
      flashError('Could not read that file as a rack config.');
    } finally {
      setBusy(false);
    }
  }

  function handleReset() {
    if (window.confirm('Clear the current rack and start over? This cannot be undone in-app.')) {
      resetAll();
    }
  }

  return (
    <header className="print:hidden flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-zinc-800 bg-zinc-900 px-4 py-2.5">
      <button
        onClick={() => setMobilePanel(mobilePanel === 'library' ? 'none' : 'library')}
        title="Components"
        className={`rounded p-1.5 lg:hidden ${
          mobilePanel === 'library' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-300'
        }`}
      >
        <PanelLeft size={14} />
      </button>

      <div className="flex items-center gap-2">
        <Server size={16} className="text-blue-400" />
        <span className="hidden text-sm font-semibold text-zinc-100 sm:inline">Rack Builder</span>
        <span className="font-mono text-[10px] text-zinc-600">v{__APP_VERSION__}</span>
      </div>

      <input
        value={rack.name}
        onChange={(e) => setRackName(e.target.value)}
        className="w-40 rounded border border-transparent bg-transparent px-1.5 py-1 text-xs text-zinc-300 outline-none hover:border-zinc-700 focus:border-blue-500 focus:bg-zinc-800"
      />

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-medium tracking-wide text-zinc-500 uppercase">Height</span>
        <input
          type="number"
          min={1}
          max={60}
          value={rack.heightU}
          onChange={(e) => {
            const requested = Number(e.target.value);
            const applied = setRackHeight(requested);
            if (applied > requested) {
              flashError(`Can't shrink below ${applied}U, a device is mounted there.`);
            }
          }}
          className="w-14 rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-center text-[10.5px] text-zinc-200 outline-none focus:border-blue-500"
        />
        <span className="text-[10px] text-zinc-500">U</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-medium tracking-wide text-zinc-500 uppercase">Width</span>
        <input
          type="number"
          min={4}
          max={30}
          step={0.5}
          value={rack.widthIn}
          onChange={(e) => setRackWidth(Number(e.target.value))}
          className="w-14 rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-center text-[10.5px] text-zinc-200 outline-none focus:border-blue-500"
        />
        <span className="text-[10px] text-zinc-500">in</span>
        <div className="ml-1 flex gap-0.5">
          {[10, 19].map((w) => (
            <button
              key={w}
              onClick={() => setRackWidth(w)}
              className={`rounded px-1.5 py-0.5 text-[10.5px] font-mono ${
                rack.widthIn === w
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {w}"
            </button>
          ))}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {error && <span className="text-[10.5px] text-red-400">{error}</span>}
        <span
          title={SYNC_LABEL[syncStatus]}
          className="mr-1 flex items-center gap-1 text-[10px] text-zinc-500"
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: SYNC_COLOR[syncStatus] }}
          />
          {syncStatus === 'synced' ? 'Synced' : syncStatus === 'checking' ? 'Checking' : 'Local only'}
        </span>
        <button
          onClick={handleLoad}
          disabled={busy}
          title="Open a rack config .json file"
          className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-[10.5px] text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
        >
          <FolderOpen size={12} /> Open
        </button>
        <button
          onClick={handleSave}
          disabled={busy}
          title="Save the rack config as .json"
          className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-[10.5px] text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
        >
          <Save size={12} /> Save
        </button>
        <button
          onClick={() => window.print()}
          title="Print or export as PDF"
          className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-[10.5px] text-zinc-300 hover:bg-zinc-700"
        >
          <Printer size={12} /> Print
        </button>
        <button
          onClick={handleReset}
          title="Reset to an empty rack"
          className="flex items-center gap-1 rounded px-2 py-1 text-[10.5px] text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
        >
          <RotateCcw size={12} /> Reset
        </button>
        <button
          onClick={() => setMobilePanel(mobilePanel === 'inspector' ? 'none' : 'inspector')}
          title="Device / Cables"
          className={`rounded p-1.5 lg:hidden ${
            mobilePanel === 'inspector' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-300'
          }`}
        >
          <PanelRight size={14} />
        </button>
      </div>
    </header>
  );
}
