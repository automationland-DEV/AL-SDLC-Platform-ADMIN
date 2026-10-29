import api from './api';
import { API_ROUTES } from './apiRoutes';
import type {
  AdminDailyReport,
  AdminDailyReportList,
  AdminWorkspaceOption,
  AdminDailyReportQueryParams,
} from '../types/dailyReport';

const unwrap = <T,>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const inner = (payload as { data?: unknown }).data;
    if (inner !== undefined && inner !== null) {
      return inner as T;
    }
  }
  return payload as T;
};

export const dailyReportService = {
  /** Dữ liệu báo cáo phân theo workspace rồi theo từng người báo cáo. */
  getAll: async (params: AdminDailyReportQueryParams = {}): Promise<AdminDailyReportList> => {
    const response = await api.get<unknown>(API_ROUTES.DAILY_REPORTS.BASE, { params });
    const payload = unwrap<AdminDailyReportList | { data?: AdminDailyReportList }>(response.data);
    if (payload && 'workspaces' in payload) {
      return payload;
    }
    const inner = (payload as { data?: AdminDailyReportList })?.data;
    return inner ?? { workspaces: [], total: 0 };
  },

  getWorkspaces: async (): Promise<AdminWorkspaceOption[]> => {
    const response = await api.get<unknown>(API_ROUTES.DAILY_REPORTS.WORKSPACES);
    const payload = unwrap<AdminWorkspaceOption[] | { data?: AdminWorkspaceOption[] }>(response.data);
    if (Array.isArray(payload)) return payload;
    return (payload as { data?: AdminWorkspaceOption[] })?.data ?? [];
  },

  getById: async (id: string): Promise<AdminDailyReport | null> => {
    const response = await api.get<unknown>(API_ROUTES.DAILY_REPORTS.DETAIL(id));
    return unwrap<AdminDailyReport | null>(response.data) ?? null;
  },
};
