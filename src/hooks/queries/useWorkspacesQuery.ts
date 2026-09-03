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
  lists: () => [...workspaceKeys.all, 'list'] as const,
  list: (params: WorkspaceQueryParams = {}) => [...workspaceKeys.lists(), params] as const,
  detail: (id: string) => [...workspaceKeys.all, 'detail', id] as const,
};

export function useWorkspacesQuery(params: WorkspaceQueryParams = {}) {
  return useQuery({
    queryKey: workspaceKeys.list(params),
    queryFn: () => workspaceService.getAllAdmin(params),
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });
}

export function useWorkspaceDetailQuery(id: string) {
  return useQuery({
    queryKey: workspaceKeys.detail(id),
    queryFn: () => workspaceService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 30,
  });
}

export function useCreateWorkspaceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Workspace>) => workspaceService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspaceKeys.lists() });
    },
  });
}

export function useUpdateWorkspaceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Workspace> }) =>
      workspaceService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspaceKeys.lists() });
    },
  });
}

export function useDeleteWorkspaceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workspaceService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspaceKeys.lists() });
    },
  });
}

export function useArchiveWorkspaceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workspaceService.archive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspaceKeys.lists() });
    },
  });
}

export function useRestoreWorkspaceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workspaceService.restore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspaceKeys.lists() });
    },
  });
}

export function useAddWorkspaceMemberMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, email, role }: { workspaceId: string; email: string; role: string }) =>
      workspaceService.addMember(workspaceId, email, role),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: workspaceKeys.detail(variables.workspaceId) });
      qc.invalidateQueries({ queryKey: workspaceKeys.lists() });
    },
  });
}

export function useRemoveWorkspaceMemberMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, userId }: { workspaceId: string; userId: string }) =>
      workspaceService.removeMember(workspaceId, userId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: workspaceKeys.detail(variables.workspaceId) });
      qc.invalidateQueries({ queryKey: workspaceKeys.lists() });
    },
  });
}

export function useUpdateWorkspaceMemberRoleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, userId, role }: { workspaceId: string; userId: string; role: string }) =>
      workspaceService.updateMember(workspaceId, userId, role),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: workspaceKeys.detail(variables.workspaceId) });
      qc.invalidateQueries({ queryKey: workspaceKeys.lists() });
    },
  });
}
