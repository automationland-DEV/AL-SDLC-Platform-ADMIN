import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../services/dashboardService';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
};

export function useDashboardStatsQuery() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => dashboardService.getAdminStats(),
    staleTime: 1000 * 60, // 1 minute
  });
}
