import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { storageService, type StorageSourceType } from '../../services/storageService';

export const storageKeys = {
  all: ['storage'] as const,
  overview: () => [...storageKeys.all, 'overview'] as const,
  users: (params: { page?: number; search?: string; minPercentUsed?: number }) =>
    [...storageKeys.all, 'users', params] as const,
  userMedia: (userId: string, source?: StorageSourceType) =>
    [...storageKeys.all, 'media', userId, source ?? 'all'] as const,
};

export function useStorageOverviewQuery() {
  return useQuery({
    queryKey: storageKeys.overview(),
    queryFn: () => storageService.getOverview(),
    staleTime: 1000 * 30,
  });
}

export function useStorageUsersQuery(params: {
  page?: number;
  limit?: number;
  search?: string;
  minPercentUsed?: number;
} = {}) {
  return useQuery({
    queryKey: storageKeys.users(params),
    queryFn: () => storageService.getUsers({ limit: 20, ...params }),
    placeholderData: (prev) => prev,
    staleTime: 1000 * 30,
  });
}

export function useStorageUserMediaQuery(
  userId: string | null,
  opts: { page?: number; limit?: number; source?: StorageSourceType } = {},
) {
  return useQuery({
    queryKey: storageKeys.userMedia(userId ?? '', opts.source),
    queryFn: () =>
      storageService.getUserMedia({ userId: userId!, page: opts.page ?? 1, limit: opts.limit ?? 24, source: opts.source }),
    enabled: Boolean(userId),
    staleTime: 1000 * 30,
  });
}

export function useSetUserQuotaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, quotaBytes, note }: { userId: string; quotaBytes: number; note?: string }) =>
      storageService.setQuota(userId, quotaBytes, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: storageKeys.all });
    },
  });
}

export function useClearUserQuotaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => storageService.clearQuota(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: storageKeys.all });
    },
  });
}

export function useDeleteUserMediaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: Array<{ source: StorageSourceType; id: string }>) =>
      storageService.deleteUserMedia(items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: storageKeys.all });
    },
  });
}
