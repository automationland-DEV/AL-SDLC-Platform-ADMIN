import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceService } from '../../services';
import type { Workspace } from '../../types';

export interface WorkspaceQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortField?: string;
  sortOrder?: string;
}

// ─── Query Keys ────────────────────────────────────────────────────────────────
export const workspaceKeys = {
  all: ['workspaces'] as const,
  list: (params?: WorkspaceQueryParams) => [...workspaceKeys.all, 'all', params] as const,
  detail: (id: string) => [...workspaceKeys.all, 'detail', id] as const,
};

// ─── Queries ───────────────────────────────────────────────────────────────────

/** Full workspace list (admin endpoint returns all including soft-deleted). */
export function useWorkspacesQuery(params: WorkspaceQueryParams = {}) {
  return useQuery({
    queryKey: workspaceKeys.list(params),
    queryFn: () => workspaceService.getAllAdmin(params),
    staleTime: 1000 * 30, // 30 seconds
    placeholderData: (prev) => prev,
  });
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateWorkspaceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Workspace>) => workspaceService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspaceKeys.list() });
    },
  });
}

export function useUpdateWorkspaceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Workspace> }) =>
      workspaceService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspaceKeys.list() });
    },
  });
}

export function useDeleteWorkspaceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workspaceService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspaceKeys.list() });
    },
  });
}

export function useArchiveWorkspaceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workspaceService.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspaceKeys.list() });
    },
  });
}

export function useRestoreWorkspaceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workspaceService.restore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspaceKeys.list() });
    },
  });
}
