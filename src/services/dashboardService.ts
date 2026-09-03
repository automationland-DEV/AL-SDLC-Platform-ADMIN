import api from './api';
import { API_ROUTES } from './apiRoutes';

export interface DashboardStats {
  totalUsers: number;
  totalWorkspaces: number;
  totalDocuments: number;
  recentUsers: {
    id: string;
    fullName: string;
    email: string;
    avatar: string;
    role: string;
  }[];
  recentWorkspaces: {
    _id: string;
    name: string;
    key: string;
    status: string;
    members: unknown[];
  }[];
}

export const dashboardService = {
  getAdminStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>(API_ROUTES.DASHBOARD.ADMIN_STATS);
    const raw = response?.data as unknown as Record<string, unknown>;
    return (raw?.data ?? response?.data ?? response) as DashboardStats;
  },
  getSdlcStats: async (filters?: Record<string, string>) => {
    const response = await api.get(API_ROUTES.DASHBOARD.SDLC_STATS, { params: filters });
    const raw = response?.data as unknown as Record<string, unknown>;
    return (raw?.data ?? response?.data ?? response);
  },
};
