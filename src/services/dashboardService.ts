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
    // NestJS defaults may wrap it in { data: ... } or just return it directly depending on interceptor
    return response?.data?.data ?? response?.data ?? response;
  },
};
