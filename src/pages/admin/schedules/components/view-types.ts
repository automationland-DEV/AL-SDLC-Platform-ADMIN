import type { AdminWorkScheduleItem } from '../../../../services/workScheduleService';
import type { ScheduleGroupByMonth, ScheduleGroupByUser } from '../lib/schedule-utils';

export interface ShiftViewCommonProps {
  shifts: AdminWorkScheduleItem[];
  conflictIds: Set<string>;
  displayNameOf: (userId: string, fallback?: string) => string;
  onEdit: (shift: AdminWorkScheduleItem) => void;
  onDelete: (shift: AdminWorkScheduleItem) => void;
  onCheckIn: (shift: AdminWorkScheduleItem) => void;
  onCheckOut: (shift: AdminWorkScheduleItem) => void;
  attendancePendingIds: Set<string>;
}

export interface WeekViewProps extends ShiftViewCommonProps {
  weekDays: string[];
  weekAnchor: string;
  weekEnd: string;
  todayIso: string;
  onJumpWeek: (targetStartIso: string) => void;
  onQuickAssign: (dateIso?: string) => void;
  vi: boolean;
  language: string;
}

export interface ByStaffViewProps extends ShiftViewCommonProps {
  groups: ScheduleGroupByUser[];
  vi: boolean;
  language: string;
}

export interface ByMonthViewProps extends ShiftViewCommonProps {
  groups: ScheduleGroupByMonth[];
  vi: boolean;
  language: string;
}

export interface TableViewProps extends ShiftViewCommonProps {
  vi: boolean;
}
