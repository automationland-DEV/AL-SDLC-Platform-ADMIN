import { useQuery } from '@tanstack/react-query';
import { auditService, type AuditLogQueryParams } from '../../services/auditService';

// ─── Query Keys ────────────────────────────────────────────────────────────────
export const activityKeys = {
  all: ['activity'] as const,
  logs: (params: AuditLogQueryParams) => [...activityKeys.all, 'logs', params] as const,
  stats: () => [...activityKeys.all, 'stats'] as const,
};

export function useActivityLogsQuery(
  params: AuditLogQueryParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: activityKeys.logs(params),
    queryFn: () => auditService.getLogs(params),
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
    enabled: options?.enabled,
  });
}

export function useActivityStatsQuery() {
  return useQuery({
    queryKey: activityKeys.stats(),
    queryFn: () => auditService.getStats(),
    staleTime: 1000 * 60 * 5,
  });
}
