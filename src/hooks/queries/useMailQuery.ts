import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mailService } from '../../services';
import type {
  AdminInternalMailStats,
  AdminMailDetail,
  AdminMailMessage,
  CreateBroadcastPayload,
  CreateTemplatePayload,
  MailBroadcast,
  MailRecipient,
  MailTemplate,
  PreviewAudiencePayload,
} from '../../services/mailService';

export const mailKeys = {
  all: ['admin-mail'] as const,
  stats: () => [...mailKeys.all, 'stats'] as const,
  broadcasts: (params?: Record<string, unknown>) =>
    params ? ([...mailKeys.all, 'broadcasts', params] as const) : ([...mailKeys.all, 'broadcasts'] as const),
  templates: (params?: Record<string, unknown>) =>
    params ? ([...mailKeys.all, 'templates', params] as const) : ([...mailKeys.all, 'templates'] as const),
  recipients: (search: string) => [...mailKeys.all, 'recipients', search] as const,
  internalMessages: (params?: Record<string, unknown>) =>
    params
      ? ([...mailKeys.all, 'internal-messages', params] as const)
      : ([...mailKeys.all, 'internal-messages'] as const),
  internalMessage: (id: string) => [...mailKeys.all, 'internal-message', id] as const,
  internalStats: () => [...mailKeys.all, 'internal-stats'] as const,
};

export function useMailStatsQuery() {
  return useQuery({
    queryKey: mailKeys.stats(),
    queryFn: () => mailService.getStats(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useMailBroadcastsQuery(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  const safeParams = {
    page: params?.page || 1,
    limit: params?.limit || 20,
    status: params?.status && params.status !== 'all' ? params.status : undefined,
    search: params?.search || undefined,
  };

  return useQuery({
    queryKey: mailKeys.broadcasts(safeParams),
    queryFn: () => mailService.listBroadcasts(safeParams),
    staleTime: 1000 * 60,
    placeholderData: (prev) => prev,
  });
}

export function useCreateBroadcastMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBroadcastPayload) => mailService.createBroadcast(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mailKeys.all });
    },
  });
}

export function useCancelBroadcastMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mailService.cancelBroadcast(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mailKeys.all });
    },
  });
}

export function usePreviewAudienceMutation() {
  return useMutation({
    mutationFn: (payload: PreviewAudiencePayload) => mailService.previewAudience(payload),
  });
}

export function useMailTemplatesQuery(params?: {
  search?: string;
  category?: string;
  includeInactive?: boolean;
}) {
  const safeParams = {
    search: params?.search || undefined,
    category: params?.category || undefined,
    includeInactive: params?.includeInactive ?? true,
  };

  return useQuery({
    queryKey: mailKeys.templates(safeParams),
    queryFn: () => mailService.listTemplates(safeParams),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTemplatePayload) => mailService.createTemplate(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mailKeys.all });
    },
  });
}

export function useDeleteTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mailService.deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mailKeys.all });
    },
  });
}

export function useSearchRecipientsQuery(search: string) {
  return useQuery({
    queryKey: mailKeys.recipients(search),
    queryFn: () => mailService.searchRecipients(search),
    enabled: search.trim().length >= 2,
    staleTime: 1000 * 60,
  });
}

export type { MailBroadcast, MailRecipient, MailTemplate };

// ─── Internal mail oversight ────────────────────────────────────────────────

export function useInternalMailMessagesQuery(params?: {
  page?: number;
  limit?: number;
  search?: string;
  kind?: 'direct' | 'broadcast' | 'all';
  senderId?: string;
  recipientId?: string;
}) {
  const safeParams = {
    page: params?.page || 1,
    limit: params?.limit || 20,
    search: params?.search || undefined,
    kind: params?.kind && params.kind !== 'all' ? params.kind : undefined,
    senderId: params?.senderId || undefined,
    recipientId: params?.recipientId || undefined,
  };

  return useQuery({
    queryKey: mailKeys.internalMessages(safeParams),
    queryFn: () => mailService.listInternalMessages(safeParams),
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });
}

export function useInternalMailStatsQuery() {
  return useQuery({
    queryKey: mailKeys.internalStats(),
    queryFn: () => mailService.getInternalMailStats(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useInternalMailDetailQuery(id: string | null) {
  return useQuery({
    queryKey: mailKeys.internalMessage(id ?? ''),
    queryFn: () => mailService.getInternalMessage(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
}

export function useDeleteInternalMailMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      scope = 'message',
    }: {
      id: string;
      scope?: 'message' | 'thread';
    }) => mailService.deleteInternalMessage(id, scope),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mailKeys.all });
    },
  });
}

export type { AdminInternalMailStats, AdminMailDetail, AdminMailMessage };
