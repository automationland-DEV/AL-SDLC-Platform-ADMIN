import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService } from '../../services';
import type { Document } from '../../types';

// ─── Query Keys ────────────────────────────────────────────────────────────────
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (params: { page?: number; type?: string; workspaceId?: string }) =>
    [...documentKeys.lists(), params] as const,
  detail: (id: string) => [...documentKeys.all, 'detail', id] as const,
};

// ─── Queries ───────────────────────────────────────────────────────────────────

/** Paginated admin document list — cached per (page, type, workspaceId). */
export function useDocumentsQuery(params: {
  page?: number;
  type?: string;
  workspaceId?: string;
} = {}) {
  const apiParams: Record<string, string | number> = { limit: 20 };
  if (params.page) apiParams.page = params.page;
  if (params.type && params.type !== 'all') apiParams.type = params.type;
  if (params.workspaceId && params.workspaceId !== 'all') apiParams.workspaceId = params.workspaceId;

  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => documentService.getAllAdmin(apiParams),
    placeholderData: (prev) => prev,
  });
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export function useUploadDocumentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, name, workspaceIds }: { file: File; name: string; workspaceIds: string[] }) =>
      documentService.upload(file, name, workspaceIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

export function useCreateOnlineDocumentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, content, workspaceIds }: { name: string; content: string; workspaceIds: string[] }) =>
      documentService.createOnline(name, content, workspaceIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

export function useUpdateDocumentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Document> }) =>
      documentService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

export function useDeleteDocumentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}
