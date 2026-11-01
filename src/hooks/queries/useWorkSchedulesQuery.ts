import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  workScheduleService,
  type AdminWorkScheduleQueryParams,
  type AssignSchedulePayload,
  type BulkAssignSchedulePayload,
  type CreateTemplatePayload,
  type GenerateSchedulesPayload,
  type UpdateSchedulePayload,
  type UpdateTemplatePayload,
} from '../../services/workScheduleService';

export const workScheduleKeys = {
  all: ['work-schedules'] as const,
  lists: () => [...workScheduleKeys.all, 'list'] as const,
  list: (params: AdminWorkScheduleQueryParams) => [...workScheduleKeys.lists(), params] as const,
  templates: (userId?: string) => [...workScheduleKeys.all, 'templates', userId ?? 'all'] as const,
};

export function useWorkSchedulesQuery(params: AdminWorkScheduleQueryParams = {}) {
  return useQuery({
    queryKey: workScheduleKeys.list(params),
    queryFn: () => workScheduleService.list(params),
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
  });
}

export function useWorkScheduleTemplatesQuery(userId?: string) {
  return useQuery({
    queryKey: workScheduleKeys.templates(userId),
    queryFn: () => workScheduleService.listTemplates(userId || undefined),
    staleTime: 1000 * 30,
  });
}

export function useAssignScheduleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignSchedulePayload) => workScheduleService.assign(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workScheduleKeys.all });
    },
  });
}

export function useBulkAssignScheduleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkAssignSchedulePayload) => workScheduleService.bulkAssign(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workScheduleKeys.all });
    },
  });
}

export function useUpdateScheduleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSchedulePayload }) =>
      workScheduleService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workScheduleKeys.all });
    },
  });
}

export function useRemoveScheduleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workScheduleService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workScheduleKeys.all });
    },
  });
}

export function useCreateWorkScheduleTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTemplatePayload) => workScheduleService.createTemplate(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workScheduleKeys.all });
    },
  });
}

export function useUpdateWorkScheduleTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTemplatePayload }) =>
      workScheduleService.updateTemplate(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workScheduleKeys.all });
    },
  });
}

export function useRemoveTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workScheduleService.removeTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workScheduleKeys.all });
    },
  });
}

export function useGenerateSchedulesMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GenerateSchedulesPayload) => workScheduleService.generate(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workScheduleKeys.all });
    },
  });
}
