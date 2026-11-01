import api from './api';

export interface AdminWorkScheduleItem {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string | null;
  workDate: string;
  startTime: string;
  endTime: string;
  title?: string;
  status: string;
  source: string;
  templateId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWorkScheduleList {
  items: AdminWorkScheduleItem[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminWorkScheduleTemplate {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string | null;
  weekday: number;
  startTime: string;
  endTime: string;
  title?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWorkScheduleQueryParams {
  userId?: string;
  from?: string;
  to?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface AssignSchedulePayload {
  userId: string;
  workDate: string;
  startTime: string;
  endTime: string;
  title?: string;
}

export interface BulkAssignSchedulePayload {
  userIds: string[];
  workDate: string;
  startTime: string;
  endTime: string;
  title?: string;
}

export interface UpdateSchedulePayload {
  workDate?: string;
  startTime?: string;
  endTime?: string;
  title?: string;
  status?: string;
}

export interface CreateTemplatePayload {
  userId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  title?: string;
}

export interface UpdateTemplatePayload {
  weekday?: number;
  startTime?: string;
  endTime?: string;
  title?: string;
  isActive?: boolean;
}

export interface GenerateSchedulesPayload {
  userId: string;
  from: string;
  to: string;
}

export interface GenerateSchedulesResult {
  created: number;
  skipped: number;
  items: AdminWorkScheduleItem[];
}

const unwrap = <T,>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const inner = (payload as { data?: unknown }).data;
    if (inner !== undefined && inner !== null) {
      // Backend returns { data: {...} } or { data: [...] }
      return inner as T;
    }
  }
  return payload as T;
};

const normalizeList = (raw: unknown, fallbackPage: number, fallbackLimit: number): AdminWorkScheduleList => {
  const body = (raw ?? {}) as Record<string, unknown>;
  // Response shape: { data: { items, total, page, limit } }
  const inner = (body.data ?? body) as Record<string, unknown>;
  return {
    items: (inner.items as AdminWorkScheduleItem[]) ?? [],
    total: (inner.total as number) ?? 0,
    page: (inner.page as number) ?? fallbackPage,
    limit: (inner.limit as number) ?? fallbackLimit,
  };
};

const normalizeArray = <T,>(raw: unknown): T[] => {
  const unwrapped = unwrap<T[] | { data?: T[] }>(raw);
  if (Array.isArray(unwrapped)) return unwrapped;
  if (unwrapped && typeof unwrapped === 'object' && 'data' in unwrapped) {
    const inner = (unwrapped as { data?: unknown }).data;
    if (Array.isArray(inner)) return inner as T[];
  }
  return [];
};

export const WEEKDAY_LABELS: Record<number, string> = {
  0: 'Chủ nhật',
  1: 'Thứ hai',
  2: 'Thứ ba',
  3: 'Thứ tư',
  4: 'Thứ năm',
  5: 'Thứ sáu',
  6: 'Thứ bảy',
};

export const WEEKDAY_OPTIONS = [1, 2, 3, 4, 5, 6, 0].map((weekday) => ({
  value: String(weekday),
  label: WEEKDAY_LABELS[weekday],
}));

export function formatDisplayDate(workDate: string): string {
  const [year, month, day] = workDate.split('-');
  if (!year || !month || !day) return workDate;
  return `${day}/${month}/${year}`;
}

export function todayIsoDate(offsetDays = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const workScheduleService = {
  list: async (params: AdminWorkScheduleQueryParams = {}): Promise<AdminWorkScheduleList> => {
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;
    const res = await api.get('/admin/work-schedules', {
      params: {
        userId: params.userId || undefined,
        from: params.from || undefined,
        to: params.to || undefined,
        status: params.status || undefined,
        page,
        limit,
      },
    });
    return normalizeList(res.data, page, limit);
  },

  assign: async (payload: AssignSchedulePayload): Promise<AdminWorkScheduleItem> => {
    const res = await api.post('/admin/work-schedules', payload);
    return unwrap<AdminWorkScheduleItem>(res.data);
  },

  bulkAssign: async (payload: BulkAssignSchedulePayload): Promise<AdminWorkScheduleItem[]> => {
    const res = await api.post('/admin/work-schedules/bulk', payload);
    return normalizeArray<AdminWorkScheduleItem>(res.data);
  },

  update: async (id: string, payload: UpdateSchedulePayload): Promise<AdminWorkScheduleItem> => {
    const res = await api.patch(`/admin/work-schedules/${id}`, payload);
    return unwrap<AdminWorkScheduleItem>(res.data);
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/admin/work-schedules/${id}`);
  },

  listTemplates: async (userId?: string): Promise<AdminWorkScheduleTemplate[]> => {
    const url = userId ? `/admin/work-schedules/templates/by-user/${userId}` : '/admin/work-schedules/templates/all';
    const res = await api.get(url);
    return normalizeArray<AdminWorkScheduleTemplate>(res.data);
  },

  createTemplate: async (payload: CreateTemplatePayload): Promise<AdminWorkScheduleTemplate> => {
    const res = await api.post('/admin/work-schedules/templates', payload);
    return unwrap<AdminWorkScheduleTemplate>(res.data);
  },

  updateTemplate: async (id: string, payload: UpdateTemplatePayload): Promise<AdminWorkScheduleTemplate> => {
    const res = await api.patch(`/admin/work-schedules/templates/${id}`, payload);
    return unwrap<AdminWorkScheduleTemplate>(res.data);
  },

  removeTemplate: async (id: string): Promise<void> => {
    await api.delete(`/admin/work-schedules/templates/${id}`);
  },

  generate: async (payload: GenerateSchedulesPayload): Promise<GenerateSchedulesResult> => {
    const res = await api.post('/admin/work-schedules/generate', payload);
    const result = unwrap<GenerateSchedulesResult>(res.data);
    return {
      created: result?.created ?? 0,
      skipped: result?.skipped ?? 0,
      items: result?.items ?? [],
    };
  },
};
