import { AlertTriangle, LogIn, LogOut, Pencil, Trash2 } from 'lucide-react';
import { Avatar } from '../lib/schedule-ui';
import { formatDisplayDate } from '../lib/schedule-utils';
import { AttendanceBadge, WorkModeBadge } from './ShiftBadges';
import type { TableViewProps } from './view-types';

export default function TableView({
  shifts,
  conflictIds,
  displayNameOf,
  onEdit,
  onDelete,
  onCheckIn,
  onCheckOut,
  attendancePendingIds,
  vi,
}: TableViewProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/60 text-xs font-bold text-[var(--text-secondary)]">
            <tr>
              <th className="px-4 py-3">{vi ? 'Nhân viên' : 'Staff'}</th>
              <th className="px-4 py-3">{vi ? 'Ngày' : 'Date'}</th>
              <th className="px-4 py-3">{vi ? 'Khung giờ' : 'Time'}</th>
              <th className="px-4 py-3">{vi ? 'Ca làm việc' : 'Shift'}</th>
              <th className="px-4 py-3">{vi ? 'Hình thức' : 'Mode'}</th>
              <th className="px-4 py-3">{vi ? 'Trạng thái' : 'Status'}</th>
              <th className="px-4 py-3">{vi ? 'Điểm danh' : 'Attendance'}</th>
              <th className="px-4 py-3 text-right">{vi ? 'Thao tác' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {shifts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">
                  {vi ? 'Không có ca nào khớp bộ lọc.' : 'No shifts match the current filters.'}
                </td>
              </tr>
            ) : (
              shifts.map((item) => {
                const attendance = item.attendanceStatus ?? 'pending';
                const isBusy = attendancePendingIds.has(item.id);
                const canCheckIn = item.status === 'published' && (attendance === 'pending' || attendance === 'absent');
                const canCheckOut = item.status === 'published' && attendance === 'checked_in';
                return (
                  <tr key={item.id} className="transition-colors hover:bg-[var(--bg-hover)]/50">
                    <td className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <Avatar name={displayNameOf(item.userId, item.userName)} src={item.userAvatar} size="sm" />
                        <span className="truncate font-semibold text-[var(--text-primary)]">
                          {displayNameOf(item.userId, item.userName)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono-code text-xs text-[var(--text-secondary)]">
                      {formatDisplayDate(item.workDate)}
                    </td>
                    <td className="px-4 py-3 font-mono-code text-xs font-bold text-[var(--text-primary)]">
                      {item.startTime}–{item.endTime}
                      {conflictIds.has(item.id) && (
                        <span className="ml-1 inline-flex items-center gap-0.5 rounded bg-amber-500/15 px-1 py-0.5 text-[9px] font-bold text-amber-600">
                          <AlertTriangle className="h-2.5 w-2.5" /> {vi ? 'Trùng' : 'Overlap'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{item.title || '—'}</td>
                    <td className="px-4 py-3">
                      <WorkModeBadge workMode={item.workMode} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                          item.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            item.status === 'published' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {item.status === 'published'
                          ? vi
                            ? 'Đang áp dụng'
                            : 'Published'
                          : vi
                            ? 'Đã huỷ'
                            : 'Cancelled'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <AttendanceBadge status={item.attendanceStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {canCheckIn && (
                          <button
                            type="button"
                            onClick={() => onCheckIn(item)}
                            disabled={isBusy}
                            title={vi ? 'Check-in hộ nhân viên' : 'Check-in staff'}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-xs font-bold text-emerald-600 transition-colors hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-400"
                          >
                            <LogIn className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {canCheckOut && (
                          <button
                            type="button"
                            onClick={() => onCheckOut(item)}
                            disabled={isBusy}
                            title={vi ? 'Check-out hộ nhân viên' : 'Check-out staff'}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-xs font-bold text-amber-600 transition-colors hover:bg-amber-500/20 disabled:opacity-50 dark:text-amber-400"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          title={vi ? 'Sửa ca' : 'Edit shift'}
                          className="rounded-lg border border-[var(--border-color)] p-1.5 text-[var(--text-secondary)] transition-colors hover:border-sky-500 hover:text-sky-500"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          title={vi ? 'Xoá ca' : 'Delete shift'}
                          className="rounded-lg border border-[var(--border-color)] p-1.5 text-[var(--text-secondary)] transition-colors hover:border-rose-500 hover:text-rose-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
