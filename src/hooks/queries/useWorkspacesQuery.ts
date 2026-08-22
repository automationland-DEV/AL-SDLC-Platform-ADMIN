import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceService } from '../../services';
import type { Workspace } from '../../types';

// ─── Query Keys ────────────────────────────────────────────────────────────────
export const workspaceKeys = {
  all: ['workspaces'] as const,
  list: () => [...workspaceKeys.all, 'all'] as const,
  detail: (id: string) => [...workspaceKeys.all, 'detail', id] as const,
};

// ─── Queries ───────────────────────────────────────────────────────────────────

/** Full workspace list (admin endpoint returns all including soft-deleted). */
export function useWorkspacesQuery() {
  return useQuery({
    queryKey: workspaceKeys.list(),
    queryFn: () => workspaceService.getAllAdmin(),
    staleTime: 1000 * 30, // 30 seconds
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
