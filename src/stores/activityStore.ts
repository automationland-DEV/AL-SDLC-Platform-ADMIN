import { create } from 'zustand';
import { auditService, type AuditLogEntry, type AuditLogStats } from '../services/auditService';

interface ActivityState {
  logs: AuditLogEntry[];
  stats: AuditLogStats | null;
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  // Filter state
  filters: {
    userId: string;
    type: string;
    severity: string;
    ip: string;
    startDate: string;
    endDate: string;
  };
}

interface ActivityActions {
  setFilters: (filters: Partial<ActivityState['filters']>) => void;
  resetFilters: () => void;
  fetchLogs: (page?: number) => Promise<void>;
  fetchStats: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const initialFilters = {
  userId: '',
  type: '',
  severity: '',
  ip: '',
  startDate: '',
  endDate: '',
};

export const useActivityStore = create<ActivityState & ActivityActions>((set, get) => ({
  logs: [],
  stats: null,
  total: 0,
  page: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
  filters: { ...initialFilters },

  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),

  resetFilters: () => set({ filters: { ...initialFilters } }),

  fetchLogs: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const { filters } = get();
      const params: Record<string, string | number> = { page, limit: 20 };

      if (filters.userId) params.userId = filters.userId;
      if (filters.type) params.type = filters.type;
      if (filters.severity) params.severity = filters.severity;
      if (filters.ip) params.ip = filters.ip;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await auditService.getLogs(params as any);

      set({
        logs: response.data,
        total: response.pagination.total,
        page: response.pagination.page,
        totalPages: response.pagination.totalPages,
        isLoading: false,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch activity logs';
      set({ error: message, isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await auditService.getStats();
      set({ stats });
    } catch {
      // Non-blocking
    }
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
