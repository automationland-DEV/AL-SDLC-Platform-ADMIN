import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../../services/dashboardService';

export function useDashboardData(filters: Record<string, string>) {
  return useQuery({
    queryKey: ['adminDashboardSdlc', filters],
    queryFn: () => dashboardService.getSdlcStats(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}
