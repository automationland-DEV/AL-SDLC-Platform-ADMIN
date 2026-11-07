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
  workMode: string;
  status: string;
  attendanceStatus?: string;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  workedMinutes?: number;
  earlyCheckInMinutes?: number;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  lateCheckOutMinutes?: number;
  attendanceNote?: string;
  checkInLocationId?: string | null;
  checkInLocationName?: string;
  checkInAddress?: string;
  checkInLatitude?: number | null;
  checkInLongitude?: number | null;
  checkInDistanceMeters?: number | null;
  checkOutLatitude?: number | null;
  checkOutLongitude?: number | null;
  checkOutDistanceMeters?: number | null;
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
  workMode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWorkScheduleQueryParams {
  userId?: string;
  from?: string;
  to?: string;
  status?: string;
  workMode?: string;
  attendanceStatus?: string;
  page?: number;
  limit?: number;
}

export interface AssignSchedulePayload {
  userId: string;
  workDate: string;
  startTime: string;
  endTime: string;
  title?: string;
  workMode?: string;
}

export interface BulkAssignSchedulePayload {
  userIds: string[];
  workDate: string;
  startTime: string;
  endTime: string;
  title?: string;
  workMode?: string;
}

export interface BulkAssignResult {
  items: AdminWorkScheduleItem[];
  created: number;
  skipped: { userId: string; userName?: string; reason: string }[];
}

export interface UpdateSchedulePayload {
  workDate?: string;
  startTime?: string;
  endTime?: string;
  title?: string;
  status?: string;
  workMode?: string;
  attendanceStatus?: string;
  attendanceNote?: string;
  checkInLocationId?: string;
}

export interface CreateTemplatePayload {
  userId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  title?: string;
  workMode?: string;
}

export interface UpdateTemplatePayload {
  weekday?: number;
  startTime?: string;
  endTime?: string;
  title?: string;
  isActive?: boolean;
  workMode?: string;
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

export const WORK_MODE_LABELS: Record<string, string> = {
  office: 'Tại văn phòng',
  remote: 'Remote',
  half_day: 'Nửa ngày',
};

export const WORK_MODE_OPTIONS = [
  { value: 'office', label: 'Tại văn phòng' },
  { value: 'remote', label: 'Remote' },
  { value: 'half_day', label: 'Nửa ngày' },
];

export function resolveWorkModeLabel(workMode?: string | null): string {
  if (!workMode) return WORK_MODE_LABELS.office;
  return WORK_MODE_LABELS[workMode] ?? workMode;
}

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  pending: 'Chưa điểm danh',
  checked_in: 'Đang làm việc',
  checked_out: 'Đã hoàn thành',
  absent: 'Vắng mặt',
};

export const ATTENDANCE_STATUS_OPTIONS = [
  { value: 'pending', label: 'Chưa điểm danh' },
  { value: 'checked_in', label: 'Đang làm việc' },
  { value: 'checked_out', label: 'Đã hoàn thành' },
  { value: 'absent', label: 'Vắng mặt' },
];

export function resolveAttendanceLabel(status?: string | null): string {
  if (!status) return ATTENDANCE_STATUS_LABELS.pending;
  return ATTENDANCE_STATUS_LABELS[status] ?? status;
}

export function formatCheckTime(iso?: string | null): string {
  if (!iso) return '--:--';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export const CHECKIN_MAX_RADIUS_METERS = 1000;

export interface CheckInLocationOption {
  id: string;
  name: string;
  shortName: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  embedUrl: string;
}

export const CHECKIN_LOCATIONS: CheckInLocationOption[] = [
  {
    id: 'huce_hcm',
    name: 'Trường đại học Xây dựng Hà Nội - Phân hiệu TP.HCM',
    shortName: 'ĐH Xây dựng HN - Phân hiệu TP.HCM',
    address: 'Trường đại học Xây dựng Hà Nội - Phân hiệu TP.HCM, 190, Võ Văn Ngân Thành phố Thủ Đức 71306 Thành phố Hồ Chí Minh',
    latitude: 10.850666072336104,
    longitude: 106.76418227254291,
    radiusMeters: CHECKIN_MAX_RADIUS_METERS,
    embedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d748.6777109911931!2d106.76418227254291!3d10.850666072336104!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317527a21b082251%3A0xf4b983351b0c88a3!2zVHLGsOG7nW5nIMSR4bqhaSBo4buNYyBYw6J5IGThu7FuZyBIw6AgTuG7mWkgLSBQaMOibiBoaeG7h3UgVFAuSENN!5e1!3m2!1sen!2s!4v1794078977144!5m2!1sen!2s',
  },
  {
    id: 'peak_garden_villa',
    name: 'The Peak Garden Villa',
    shortName: 'The Peak Garden Villa',
    address: 'The Peak Garden Villa, Thành phố Hồ Chí Minh',
    latitude: 10.70829872205756,
    longitude: 106.73231696332599,
    radiusMeters: CHECKIN_MAX_RADIUS_METERS,
    embedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2519.433212608838!2d106.73231696332599!3d10.70829872205756!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317525030a4e294d%3A0x209e455faf581838!2sThe%20Peak%20Garden%20Villa!5e1!3m2!1sen!2s!4v1794079038133!5m2!1sen!2s',
  },
];

export function formatDistanceMeters(meters?: number | null): string {
  if (meters === undefined || meters === null) return '';
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(2)}km`;
}

export function resolveCheckInLocationLabel(locationId?: string | null, fallbackName?: string): string {
  if (locationId) {
    const found = CHECKIN_LOCATIONS.find((l) => l.id === locationId);
    if (found) return found.shortName;
  }
  return fallbackName || '';
}

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
        workMode: params.workMode || undefined,
        attendanceStatus: params.attendanceStatus || undefined,
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

  bulkAssign: async (payload: BulkAssignSchedulePayload): Promise<BulkAssignResult> => {
    const res = await api.post('/admin/work-schedules/bulk', payload);
    const result = unwrap<BulkAssignResult | AdminWorkScheduleItem[]>(res.data);
    if (Array.isArray(result)) {
      return { items: result, created: result.length, skipped: [] };
    }
    return {
      items: result?.items ?? [],
      created: result?.created ?? (result?.items?.length ?? 0),
      skipped: result?.skipped ?? [],
    };
  },

  update: async (id: string, payload: UpdateSchedulePayload): Promise<AdminWorkScheduleItem> => {
    const res = await api.patch(`/admin/work-schedules/${id}`, payload);
    return unwrap<AdminWorkScheduleItem>(res.data);
  },

  checkIn: async (id: string, note?: string): Promise<AdminWorkScheduleItem> => {
    const res = await api.post(`/admin/work-schedules/${id}/check-in`, { note });
    return unwrap<AdminWorkScheduleItem>(res.data);
  },

  checkOut: async (id: string, note?: string): Promise<AdminWorkScheduleItem> => {
    const res = await api.post(`/admin/work-schedules/${id}/check-out`, { note });
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
