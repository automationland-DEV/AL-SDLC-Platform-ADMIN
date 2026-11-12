import {
  ATTENDANCE_STATUS_OPTIONS,
  WORK_MODE_OPTIONS,
} from '../../../../services/workScheduleService';

export const ATTENDANCE_VARIANTS = [
  { value: '', label: 'Tất cả điểm danh' },
  ...ATTENDANCE_STATUS_OPTIONS,
];

export const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'published', label: 'Đang áp dụng' },
  { value: 'cancelled', label: 'Đã huỷ' },
];

export const WORK_MODE_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả hình thức' },
  ...WORK_MODE_OPTIONS,
];

export function attendanceBadgeVariant(status?: string | null) {
  if (status === 'checked_out') return 'success' as const;
  if (status === 'checked_in') return 'info' as const;
  if (status === 'absent') return 'danger' as const;
  return 'default' as const;
}

export function workModeBadgeVariant(workMode?: string | null) {
  if (workMode === 'remote') return 'purple' as const;
  if (workMode === 'half_day') return 'warning' as const;
  return 'info' as const;
}
