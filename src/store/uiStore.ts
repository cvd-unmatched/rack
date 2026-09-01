import { create } from 'zustand';

interface UiStore {
  selectedId: string | null;
  select: (id: string | null) => void;
  rightTab: 'device' | 'connections';
  setRightTab: (t: 'device' | 'connections') => void;
  draggingTemplateId: string | null;
  setDraggingTemplateId: (id: string | null) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  selectedId: null,
  select: (id) => set({ selectedId: id }),
  rightTab: 'device',
  setRightTab: (t) => set({ rightTab: t }),
  draggingTemplateId: null,
  setDraggingTemplateId: (id) => set({ draggingTemplateId: id }),
}));
