import type { AdminWorkScheduleItem } from '../../../../services/workScheduleService';

export { formatDisplayDate } from '../../../../services/workScheduleService';

/** Ngày ISO YYYY-MM-DD, giữ nguyên giờ local để khớp workDate của backend. */
export function parseWorkDateValue(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return new Date(value);
  return new Date(year, month - 1, day);
}

export function toIsoDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Thứ 2 của tuần chứa workDate. */
export function getWeekStartIso(workDate: string): string {
  const date = parseWorkDateValue(workDate);
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayOffset);
  return toIsoDateValue(date);
}

export function addDaysIso(workDate: string, days: number): string {
  const date = parseWorkDateValue(workDate);
  date.setDate(date.getDate() + days);
  return toIsoDateValue(date);
}

export function getScheduleMinutes(item: AdminWorkScheduleItem): number {
  const [sh, sm] = item.startTime.split(':').map(Number);
  const [eh, em] = item.endTime.split(':').map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;
  return Math.max(0, eh * 60 + em - (sh * 60 + sm));
}

export function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} giờ`;
  return `${h}h${String(m).padStart(2, '0')}`;
}

export function weekdayShort(workDate: string, lang: string): string {
  const d = parseWorkDateValue(workDate).getDay();
  if (lang === 'vi') return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d];
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d];
}

export function weekdayFull(weekday: number, lang: string): string {
  if (lang === 'vi') return ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][weekday];
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][weekday];
}

/** Tập id của các ca đang bị trùng giờ — dùng để gắn badge trong mọi view. */
export function collectConflictIds(shifts: AdminWorkScheduleItem[]): Set<string> {
  const conflictIds = new Set<string>();
  const byUserAndDay = new Map<string, AdminWorkScheduleItem[]>();

  shifts.forEach((shift) => {
    const key = `${shift.userId}|${shift.workDate}`;
    const list = byUserAndDay.get(key);
    if (list) list.push(shift);
    else byUserAndDay.set(key, [shift]);
  });

  byUserAndDay.forEach((list) => {
    const active = list.filter((item) => item.status !== 'cancelled');
    for (let i = 0; i < active.length; i += 1) {
      for (let j = i + 1; j < active.length; j += 1) {
        const a = active[i];
        const b = active[j];
        const [ah, am] = a.startTime.split(':').map(Number);
        const [ae, am2] = a.endTime.split(':').map(Number);
        const [bh, bm] = b.startTime.split(':').map(Number);
        const [be, bm2] = b.endTime.split(':').map(Number);
        const aStart = ah * 60 + am;
        const aEnd = ae * 60 + am2;
        const bStart = bh * 60 + bm;
        const bEnd = be * 60 + bm2;
        if (Math.max(aStart, bStart) < Math.min(aEnd, bEnd)) {
          conflictIds.add(a.id);
          conflictIds.add(b.id);
        }
      }
    }
  });

  return conflictIds;
}

export interface ScheduleGroupByUser {
  userId: string;
  displayName: string;
  email?: string;
  avatar?: string | null;
  items: AdminWorkScheduleItem[];
  minutes: number;
}

export interface ScheduleGroupByMonth {
  monthKey: string;
  label: string;
  items: AdminWorkScheduleItem[];
  minutes: number;
}

export function groupSchedulesByUser(
  shifts: AdminWorkScheduleItem[],
  displayNameOf: (userId: string, fallback?: string) => string,
  userLookup: (userId: string) => { email?: string; avatar?: string | null } | undefined,
): ScheduleGroupByUser[] {
  const map = new Map<string, ScheduleGroupByUser>();

  shifts.forEach((item) => {
    let entry = map.get(item.userId);
    if (!entry) {
      const lookup = userLookup(item.userId);
      entry = {
        userId: item.userId,
        displayName: displayNameOf(item.userId, item.userName),
        email: lookup?.email,
        avatar: item.userAvatar || lookup?.avatar,
        items: [],
        minutes: 0,
      };
      map.set(item.userId, entry);
    }
    entry.items.push(item);
    entry.minutes += getScheduleMinutes(item);
  });

  return Array.from(map.values()).sort((a, b) => b.items.length - a.items.length);
}

export function groupSchedulesByMonth(
  shifts: AdminWorkScheduleItem[],
  monthLabel: (monthKey: string) => string,
): ScheduleGroupByMonth[] {
  const map = new Map<string, ScheduleGroupByMonth>();

  shifts.forEach((item) => {
    const monthKey = item.workDate.slice(0, 7);
    let entry = map.get(monthKey);
    if (!entry) {
      entry = { monthKey, label: monthLabel(monthKey), items: [], minutes: 0 };
      map.set(monthKey, entry);
    }
    entry.items.push(item);
    entry.minutes += getScheduleMinutes(item);
  });

  return Array.from(map.values()).sort((a, b) => (a.monthKey < b.monthKey ? 1 : -1));
}

export function sortShifts(shifts: AdminWorkScheduleItem[]): AdminWorkScheduleItem[] {
  return shifts.slice().sort((a, b) => {
    if (a.workDate !== b.workDate) return a.workDate < b.workDate ? -1 : 1;
    if (a.startTime !== b.startTime) return a.startTime < b.startTime ? -1 : 1;
    return 0;
  });
}

export const QUICK_SHIFTS = [
  {
    id: 'morning',
    labelVi: 'Sáng 8h30–12h',
    labelEn: 'Morning 8:30–12',
    start: '08:30',
    end: '12:00',
    titleVi: 'Ca sáng',
    titleEn: 'Morning',
  },
  {
    id: 'afternoon',
    labelVi: 'Chiều 13–17h',
    labelEn: 'Afternoon 13–17',
    start: '13:00',
    end: '17:00',
    titleVi: 'Ca chiều',
    titleEn: 'Afternoon',
  },
  {
    id: 'full',
    labelVi: 'Cả ngày 8h30–17h',
    labelEn: 'Full day 8:30–17',
    start: '08:30',
    end: '17:00',
    titleVi: 'Ca cả ngày',
    titleEn: 'Full day',
  },
  {
    id: 'night',
    labelVi: 'Tối 18–22h',
    labelEn: 'Evening 18–22',
    start: '18:00',
    end: '22:00',
    titleVi: 'Ca tối',
    titleEn: 'Evening',
  },
];

export const WORK_MODE_DOT: Record<string, string> = {
  office: 'bg-sky-500',
  remote: 'bg-violet-500',
  half_day: 'bg-amber-500',
};

export const ATTENDANCE_BADGE_VARIANT: Record<string, 'default' | 'success' | 'info' | 'danger'> = {
  checked_out: 'success',
  checked_in: 'info',
  absent: 'danger',
  pending: 'default',
};
