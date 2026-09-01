import type { DeviceTemplate, RackConfig } from '../types';

export interface RackFile {
  version: 1;
  rack: RackConfig;
  templates: DeviceTemplate[];
}

export function serialize(rack: RackConfig, templates: DeviceTemplate[]): string {
  const data: RackFile = { version: 1, rack, templates };
  return JSON.stringify(data, null, 2);
}

export function parseRackFile(text: string): { rack: RackConfig; templates: DeviceTemplate[] } {
  const data = JSON.parse(text) as Partial<RackFile>;
  if (!data || typeof data !== 'object' || !data.rack || !Array.isArray(data.templates)) {
    throw new Error('This file does not look like a rack-builder config.');
  }
  return { rack: data.rack, templates: data.templates };
}

export interface WorkspaceFile {
  version: 1;
  racks: RackConfig[];
  activeRackId: string;
  templates: DeviceTemplate[];
}

export function serializeWorkspace(
  racks: RackConfig[],
  activeRackId: string,
  templates: DeviceTemplate[],
): string {
  const data: WorkspaceFile = { version: 1, racks, activeRackId, templates };
  return JSON.stringify(data);
}

export function parseWorkspaceFile(text: string): {
  racks: RackConfig[];
  activeRackId: string;
  templates: DeviceTemplate[];
} {
  const data = JSON.parse(text) as Partial<WorkspaceFile>;
  if (
    !data ||
    typeof data !== 'object' ||
    !Array.isArray(data.racks) ||
    data.racks.length === 0 ||
    !Array.isArray(data.templates)
  ) {
    throw new Error('This file does not look like a rack-builder workspace.');
  }
  const activeRackId =
    data.activeRackId && data.racks.some((r) => r.id === data.activeRackId)
      ? data.activeRackId
      : data.racks[0].id;
  return { racks: data.racks, activeRackId, templates: data.templates };
}

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: { description: string; accept: Record<string, string[]> }[];
}
interface FileSystemWritableFileStreamLike {
  write(data: string): Promise<void>;
  close(): Promise<void>;
}
interface FileSystemFileHandleLike {
  createWritable(): Promise<FileSystemWritableFileStreamLike>;
  getFile(): Promise<File>;
}

declare global {
  interface Window {
    showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandleLike>;
    showOpenFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandleLike[]>;
  }
}

const JSON_TYPE = { description: 'JSON', accept: { 'application/json': ['.json'] } };

function downloadBlob(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function saveToFile(content: string, suggestedName: string): Promise<boolean> {
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({ suggestedName, types: [JSON_TYPE] });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return true;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return false;
    }
  }
  downloadBlob(content, suggestedName);
  return true;
}

export async function loadFromFile(): Promise<string | null> {
  if (window.showOpenFilePicker) {
    try {
      const [handle] = await window.showOpenFilePicker({ types: [JSON_TYPE] });
      const file = await handle.getFile();
      return await file.text();
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return null;
    }
  }
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.readAsText(file);
    };
    input.click();
  });
}
