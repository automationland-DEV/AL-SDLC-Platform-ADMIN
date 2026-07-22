import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatChannelService } from '../../services';

// ─── Query Keys ────────────────────────────────────────────────────────────────
export const channelKeys = {
  all: ['channels'] as const,
  list: (workspaceId?: string) => [...channelKeys.all, 'list', workspaceId ?? 'all'] as const,
};

// ─── Queries ───────────────────────────────────────────────────────────────────

/** All chat channels (admin), optionally filtered by workspaceId. */
export function useChannelsQuery(workspaceId?: string) {
  const params = workspaceId && workspaceId !== 'all' ? { workspaceId } : undefined;
  return useQuery({
    queryKey: channelKeys.list(workspaceId),
    queryFn: () => chatChannelService.getAllChannels(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export function useDeleteChannelMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => chatChannelService.deleteChannel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: channelKeys.all });
    },
  });
}
