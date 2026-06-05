import api from './api';
import { API_ROUTES } from './apiRoutes';

export interface AuditLogEntry {
  _id: string;
  type: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogStats {
  total: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  recentCount: number;
}

export interface AuditLogQueryParams {
  userId?: string;
  type?: string;
  severity?: string;
  ip?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAuditLogs {
  data: AuditLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const auditService = {
  getLogs: async (params?: AuditLogQueryParams): Promise<PaginatedAuditLogs> => {
    const response = await api.get<PaginatedAuditLogs>(API_ROUTES.AUDIT.LOGS, {
      params,
      withCredentials: true,
    });
    return response.data;
  },

  getLogById: async (id: string): Promise<AuditLogEntry | null> => {
    try {
      const response = await api.get<AuditLogEntry>(API_ROUTES.AUDIT.LOG_BY_ID(id), {
        withCredentials: true,
      });
      return response.data;
    } catch {
      return null;
    }
  },

  getStats: async (): Promise<AuditLogStats> => {
    const response = await api.get<AuditLogStats>(API_ROUTES.AUDIT.STATS, {
      withCredentials: true,
    });
    return response.data;
  },
};
