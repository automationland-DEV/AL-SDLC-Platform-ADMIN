import { useQuery } from '@tanstack/react-query';
import { dailyReportService } from '../../services/dailyReportService';
import type { AdminDailyReportQueryParams } from '../../types/dailyReport';

// ─── Query Keys ────────────────────────────────────────────────────────────────
export const dailyReportKeys = {
  all: ['daily-reports'] as const,
  lists: () => [...dailyReportKeys.all, 'list'] as const,
  list: (params: AdminDailyReportQueryParams = {}) => [...dailyReportKeys.lists(), params] as const,
  workspaces: () => [...dailyReportKeys.all, 'workspaces'] as const,
  detail: (id: string) => [...dailyReportKeys.all, 'detail', id] as const,
};

export function useDailyReportsQuery(params: AdminDailyReportQueryParams = {}) {
  return useQuery({
    queryKey: dailyReportKeys.list(params),
    queryFn: () => dailyReportService.getAll(params),
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });
}

export function useDailyReportWorkspacesQuery() {
  return useQuery({
    queryKey: dailyReportKeys.workspaces(),
    queryFn: () => dailyReportService.getWorkspaces(),
    staleTime: 1000 * 60 * 5,
  });
}
