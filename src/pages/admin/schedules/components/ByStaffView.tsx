import { AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { Avatar } from '../lib/schedule-ui';
import { formatDisplayDate, formatHours, weekdayShort } from '../lib/schedule-utils';
import { AttendanceBadge, WorkModeBadge } from './ShiftBadges';
import type { ByStaffViewProps } from './view-types';

const OVERTIME_MINUTES = 44 * 60;

export default function ByStaffView({
  groups,
  conflictIds,
  onEdit,
  onDelete,
  vi,
  language,
}: ByStaffViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {groups.map((group) => {
        const overtimeWarning = group.minutes > OVERTIME_MINUTES;
        return (
          <div
            key={group.userId}
            className="flex flex-col overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs transition-all hover:border-sky-500/40"
          >
            <div className="flex items-center justify-between gap-2 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/40 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={group.displayName} src={group.avatar} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[var(--text-primary)]">{group.displayName}</p>
                  {group.email && (
                    <p className="truncate text-xs text-[var(--text-muted)]">{group.email}</p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {overtimeWarning && (
                  <span className="flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="h-3 w-3" />
                    {vi ? 'Tăng ca' : 'Overtime'}
                  </span>
                )}
                <span className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-1 text-xs font-bold text-sky-600 dark:text-sky-400">
                  {group.items.length} {vi ? 'ca' : 'shifts'} • {formatHours(group.minutes)}
                </span>
              </div>
            </div>

            <div className="divide-y divide-[var(--border-color)] p-2">
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-xl p-2.5 transition-colors hover:bg-[var(--bg-hover)]"
                >
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono-code text-xs font-bold text-[var(--text-primary)]">
                        {formatDisplayDate(item.workDate)} ({weekdayShort(item.workDate, language)})
                      </span>
                      <span className="font-mono-code text-xs font-semibold text-sky-600 dark:text-sky-400">
                        {item.startTime}–{item.endTime}
                      </span>
                      {conflictIds.has(item.id) && (
                        <span className="flex items-center gap-0.5 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                          <AlertTriangle className="h-2.5 w-2.5" /> {vi ? 'Trùng giờ' : 'Conflict'}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {item.title || (vi ? 'Ca làm việc' : 'Shift')}
                      </p>
                      <WorkModeBadge workMode={item.workMode} />
                      <AttendanceBadge status={item.attendanceStatus} />
                    </div>
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      aria-label={vi ? 'Sửa ca' : 'Edit shift'}
                      className="rounded-xl border border-[var(--border-color)] p-2 text-[var(--text-secondary)] transition-colors hover:border-sky-500 hover:text-sky-500"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      aria-label={vi ? 'Xoá ca' : 'Delete shift'}
                      className="rounded-xl border border-[var(--border-color)] p-2 text-[var(--text-secondary)] transition-colors hover:border-rose-500 hover:text-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ByStaffEmptyState({ vi }: { vi: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-card)] px-6 py-14 text-center">
      <span className="text-4xl">👥</span>
      <p className="text-sm font-bold text-[var(--text-primary)]">
        {vi ? 'Chưa có ca nào trong khoảng lọc' : 'No shifts in this range'}
      </p>
    </div>
  );
}
