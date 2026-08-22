import { useQuery } from '@tanstack/react-query';
import { auditService, type AuditLogQueryParams } from '../../services/auditService';

// ─── Query Keys ────────────────────────────────────────────────────────────────
export const activityKeys = {
  all: ['activity'] as const,
  logs: (params: AuditLogQueryParams) => [...activityKeys.all, 'logs', params] as const,
  stats: () => [...activityKeys.all, 'stats'] as const,
};

// ─── Queries ───────────────────────────────────────────────────────────────────

/** Paginated audit logs — staleTime 30s since logs change frequently. */
export function useActivityLogsQuery(params: AuditLogQueryParams = {}) {
  return useQuery({
    queryKey: activityKeys.logs(params),
    queryFn: () => auditService.getLogs(params),
    staleTime: 1000 * 30, // 30 seconds for audit logs
    placeholderData: (prev) => prev,
  });
}

/** Activity stats — cached for 5 minutes as they rarely change. */
export function useActivityStatsQuery() {
  return useQuery({
    queryKey: activityKeys.stats(),
    queryFn: () => auditService.getStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
