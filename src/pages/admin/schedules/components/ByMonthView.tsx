import { AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { Avatar } from '../lib/schedule-ui';
import { formatDisplayDate, formatHours, weekdayShort } from '../lib/schedule-utils';
import { AttendanceBadge, WorkModeBadge } from './ShiftBadges';
import type { ByMonthViewProps } from './view-types';

export default function ByMonthView({
  groups,
  conflictIds,
  displayNameOf,
  onEdit,
  onDelete,
  vi,
  language,
}: ByMonthViewProps) {
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div
          key={group.monthKey}
          className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/40 px-5 py-3.5">
            <p className="text-sm font-bold text-[var(--text-primary)]">{group.label}</p>
            <span className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-1 text-xs font-bold text-sky-600 dark:text-sky-400">
              {group.items.length} {vi ? 'ca làm' : 'shifts'} • {formatHours(group.minutes)}
            </span>
          </div>

          <div className="divide-y divide-[var(--border-color)]">
            {group.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--bg-hover)]"
              >
                <Avatar name={displayNameOf(item.userId, item.userName)} src={item.userAvatar} size="sm" />
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-xs font-bold text-[var(--text-primary)]">
                    {displayNameOf(item.userId, item.userName)} •{' '}
                    {formatDisplayDate(item.workDate)} ({weekdayShort(item.workDate, language)}) •{' '}
                    {item.startTime}–{item.endTime}
                    {conflictIds.has(item.id) && (
                      <span className="ml-2 inline-flex items-center gap-0.5 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-600">
                        <AlertTriangle className="h-2.5 w-2.5" /> {vi ? 'Trùng' : 'Overlap'}
                      </span>
                    )}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-[11px] text-[var(--text-muted)]">
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
      ))}
    </div>
  );
}
