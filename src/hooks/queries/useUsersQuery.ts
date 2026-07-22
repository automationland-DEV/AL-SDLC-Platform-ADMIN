import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services';
import type { User } from '../../types';

// ─── Query Keys ────────────────────────────────────────────────────────────────
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: { page?: number; search?: string; role?: string; status?: string }) =>
    [...userKeys.lists(), params] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
};

// ─── Queries ───────────────────────────────────────────────────────────────────

/** Paginated user list — cached per unique (page, search, role, status) combo. */
export function useUsersQuery(params: {
  page?: number;
  search?: string;
  role?: string;
  status?: string;
} = {}) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => userService.getAllUsers({ limit: 20, ...params }),
    placeholderData: (prev) => prev, // Keep previous data while loading next page
  });
}

/** Single user detail — used by the view modal. */
export function useUserDetailQuery(id: string | null) {
  return useQuery({
    queryKey: userKeys.detail(id!),
    queryFn: () => userService.getUserById(id!),
    enabled: Boolean(id),
  });
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User>) => userService.createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useUpdateUserRoleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      userService.updateUserRole(id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useUpdateUserStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      userService.updateUserStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useDeleteUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useImportUsersCsvMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => userService.importUsersCsv(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
