import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatChannelService } from '../../services';

export const channelKeys = {
  all: ['channels'] as const,
  list: (params: Record<string, unknown>) => [...channelKeys.all, 'list', params] as const,
};

export interface ChannelsQueryParams {
  workspaceId?: string;
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
}

export function useChannelsQuery(params?: ChannelsQueryParams) {
  const safeParams = {
    workspaceId: params?.workspaceId && params.workspaceId !== 'all' ? params.workspaceId : undefined,
    page: params?.page || 1,
    limit: params?.limit || 20,
    search: params?.search || undefined,
    type: params?.type && params.type !== 'all' ? params.type : undefined,
  };

  return useQuery({
    queryKey: channelKeys.list(safeParams),
    queryFn: () => chatChannelService.getAllChannels(safeParams),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    placeholderData: (prev) => prev,
  });
}

export function useDeleteChannelMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => chatChannelService.deleteChannel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: channelKeys.all });
    },
  });
}
