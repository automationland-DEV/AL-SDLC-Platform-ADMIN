import { create } from 'zustand';

interface AdminChatState {
  activeThreadParentId: string | null;
  setActiveThreadParentId: (id: string | null) => void;
  scrollTargetId: string | null;
  setScrollTargetId: (id: string | null) => void;
}

export const useAdminChatStore = create<AdminChatState>((set) => ({
  activeThreadParentId: null,
  setActiveThreadParentId: (id) => set({ activeThreadParentId: id }),
  scrollTargetId: null,
  setScrollTargetId: (id) => set({ scrollTargetId: id }),
}));
