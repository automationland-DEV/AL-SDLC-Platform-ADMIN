import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  workScheduleService,
  type AdminWorkScheduleQueryParams,
  type AssignSchedulePayload,
  type BulkAssignSchedulePayload,
  type CheckAttendancePayload,
  type CopyWeekPayload,
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
  availability: (userId: string, workDate: string, duration?: number) =>
    [...workScheduleKeys.all, 'availability', userId, workDate, duration ?? 120] as const,
  weeklySummary: (from: string, to: string, userId?: string) =>
    [...workScheduleKeys.all, 'weekly-summary', from, to, userId ?? 'all'] as const,
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

export function useAdminCheckInScheduleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: string | CheckAttendancePayload }) =>
      workScheduleService.checkIn(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workScheduleKeys.all });
    },
  });
}

export function useAdminCheckOutScheduleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: string | CheckAttendancePayload }) =>
      workScheduleService.checkOut(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workScheduleKeys.all });
    },
  });
}

export function useAvailabilityQuery(
  params: { userId: string; workDate: string; durationMinutes?: number },
  enabled = true,
) {
  return useQuery({
    queryKey: workScheduleKeys.availability(params.userId, params.workDate, params.durationMinutes),
    queryFn: () => workScheduleService.availability(params),
    enabled: Boolean(enabled && params.userId && params.workDate),
    staleTime: 1000 * 15,
  });
}

export function useWeeklySummaryQuery(
  params: { from: string; to: string; userId?: string; overtimeHours?: number },
  enabled = true,
) {
  return useQuery({
    queryKey: workScheduleKeys.weeklySummary(params.from, params.to, params.userId),
    queryFn: () => workScheduleService.weeklySummary(params),
    enabled: Boolean(enabled && params.from && params.to),
    staleTime: 1000 * 30,
  });
}

export function useCopyWeekMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CopyWeekPayload) => workScheduleService.copyWeek(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workScheduleKeys.all });
    },
  });
}
