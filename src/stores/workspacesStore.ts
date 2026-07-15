import { create } from 'zustand';
import type { Workspace } from '../types';
import { workspaceService } from '../services';

interface WorkspacesState {
  workspaces: Workspace[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  filter: string;
  absoluteTotal: number;
}

interface WorkspacesActions {
  setWorkspaces: (workspaces: Workspace[], total: number, page: number, totalPages: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: (filter: string) => void;
  fetchWorkspaces: (page?: number, status?: string) => Promise<void>;
  createWorkspace: (data: Partial<Workspace>) => Promise<void>;
  updateWorkspace: (id: string, data: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  archiveWorkspace: (id: string) => Promise<void>;
  restoreWorkspace: (id: string) => Promise<void>;
}

type WorkspacesStore = WorkspacesState & WorkspacesActions;

export const useWorkspacesStore = create<WorkspacesStore>((set, get) => ({
  workspaces: [],
  total: 0,
  page: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
  filter: 'all',
  absoluteTotal: 0,

  setWorkspaces: (workspaces, total, page, totalPages) => set({ workspaces, total, page, totalPages }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setFilter: (filter) => set({ filter }),

  fetchWorkspaces: async (_page = 1, status = get().filter) => {
    set({ isLoading: true, error: null });
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await workspaceService.getAllAdmin();

      // Handle both paginated and non-paginated responses
      let workspaces: Workspace[] = [];
      let total = 0;

      if (Array.isArray(response)) {
        // Non-paginated response from BE (admin endpoint)
        workspaces = response;
        total = response.length;
      } else {
        // Paginated response
        workspaces = response.data || [];
        total = response.total || workspaces.length;
      }

      // Save absolute total before filtering
      const currentAbsoluteTotal = total;

      // Filter by status if needed
      if (status === 'deleted') {
        workspaces = workspaces.filter(ws => ws.deletedAt != null);
        total = workspaces.length;
      } else if (status === 'archived') {
        workspaces = workspaces.filter(ws => ws.status === 'archived' && ws.deletedAt == null);
        total = workspaces.length;
      } else if (status !== 'all') {
        workspaces = workspaces.filter((ws) => ws.status === status && ws.deletedAt == null);
        total = workspaces.length;
      } else {
        // Exclude deleted from 'all'
        workspaces = workspaces.filter((ws) => ws.deletedAt == null);
        total = workspaces.length;
      }

      set((state) => ({
        workspaces,
        total,
        absoluteTotal: status === 'all' ? currentAbsoluteTotal : state.absoluteTotal || currentAbsoluteTotal,
        page: 1,
        totalPages: 1,
        isLoading: false,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch workspaces';
      set({ error: message, isLoading: false });
    }
  },

  createWorkspace: async (data) => {
    set({ isLoading: true });
    try {
      await workspaceService.create(data);
      await get().fetchWorkspaces();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create workspace';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateWorkspace: async (id, data) => {
    set({ isLoading: true });
    try {
      await workspaceService.update(id, data);
      await get().fetchWorkspaces();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update workspace';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteWorkspace: async (id) => {
    set({ isLoading: true });
    try {
      await workspaceService.delete(id);
      await get().fetchWorkspaces();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete workspace';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  archiveWorkspace: async (id) => {
    try {
      await workspaceService.archive(id);
      await get().fetchWorkspaces();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to archive workspace';
      set({ error: message });
      throw error;
    }
  },

  restoreWorkspace: async (id) => {
    try {
      await workspaceService.restore(id);
      await get().fetchWorkspaces();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to restore workspace';
      set({ error: message });
      throw error;
    }
  },
}));
