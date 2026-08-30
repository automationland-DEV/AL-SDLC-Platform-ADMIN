import { useQuery } from '@tanstack/react-query';
import { workspaceService } from '../../services';

export function useWorkspaceOptionsQuery() {
  return useQuery({
    queryKey: ['workspaces', 'options'],
    queryFn: () => workspaceService.getOptionsAdmin(),
    staleTime: 5 * 60 * 1000,
  });
}
