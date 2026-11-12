import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Clock3, LogIn, LogOut, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge, Button } from '../../../../components/ui';
import {
  formatCheckTime,
  formatDistanceMeters,
  resolveCheckInLocationLabel,
} from '../../../../services/workScheduleService';
import { Avatar } from '../lib/schedule-ui';
import { formatDisplayDate, weekdayShort, WORK_MODE_DOT, addDaysIso } from '../lib/schedule-utils';
import type { WeekViewProps } from './view-types';

export default function WeekView({
  shifts,
  conflictIds,
  displayNameOf,
  weekDays,
  weekAnchor,
  weekEnd,
  todayIso,
  onJumpWeek,
  onQuickAssign,
  onEdit,
  onDelete,
  onCheckIn,
  onCheckOut,
  attendancePendingIds,
  vi,
  language,
}: WeekViewProps) {
  const shiftsByDate = new Map<string, typeof shifts>();
  shifts.forEach((shift) => {
    const list = shiftsByDate.get(shift.workDate);
    if (list) list.push(shift);
    else shiftsByDate.set(shift.workDate, [shift]);
  });
  shiftsByDate.forEach((list) => list.sort((a, b) => (a.startTime < b.startTime ? -1 : 1)));

  // Danh sách dưới lưới chỉ hiện ca của tuần đang xem; ca ngoài tuần đếm riêng.
  const weekDaySet = new Set(weekDays);
  const weekShifts = shifts.filter((shift) => weekDaySet.has(shift.workDate));
  const outsideCount = shifts.length - weekShifts.length;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onJumpWeek(addDaysIso(weekAnchor, -7))}
            aria-label={vi ? 'Tuần trước' : 'Previous week'}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-2 text-[var(--text-secondary)] transition-colors hover:border-sky-500 hover:text-sky-500"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <Button variant="secondary" size="sm" onClick={() => onJumpWeek(todayIso)} className="font-bold">
            {vi ? 'Về hôm nay' : 'Today'}
          </Button>
          <button
            type="button"
            onClick={() => onJumpWeek(addDaysIso(weekAnchor, 7))}
            aria-label={vi ? 'Tuần sau' : 'Next week'}
            className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-2 text-[var(--text-secondary)] transition-colors hover:border-sky-500 hover:text-sky-500"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <p className="ml-1 font-mono-code text-sm font-bold text-[var(--text-primary)]">
            {formatDisplayDate(weekAnchor)} → {formatDisplayDate(weekEnd)}
          </p>
        </div>
        <p className="hidden text-xs text-[var(--text-muted)] sm:block">
          {vi ? 'Bấm vào ca để sửa • Bấm + để thêm ca mới' : 'Click a shift to edit • Click + to add'}
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[900px] grid-cols-7 divide-x divide-[var(--border-color)]">
          {weekDays.map((day) => {
            const dayShifts = shiftsByDate.get(day) ?? [];
            const isToday = day === todayIso;
            return (
              <div
                key={day}
                className={`flex min-h-[300px] flex-col ${isToday ? 'bg-sky-500/[0.05]' : ''}`}
              >
                <div
                  className={`border-b border-[var(--border-color)] px-2 py-2.5 text-center ${
                    isToday ? 'bg-sky-600 text-white' : 'bg-[var(--bg-tertiary)]/60'
                  }`}
                >
                  <p
                    className={`text-[11px] font-bold uppercase tracking-wider ${
                      isToday ? 'text-sky-100' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {weekdayShort(day, language)}
                  </p>
                  <p
                    className={`text-lg font-bold leading-tight ${
                      isToday ? 'text-white' : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {day.split('-')[2]}
                  </p>
                  <p
                    className={`font-mono-code text-[10px] ${
                      isToday ? 'text-sky-100' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {dayShifts.length} {vi ? 'ca' : 'shifts'}
                  </p>
                </div>

                <div className="flex flex-1 flex-col gap-2 p-2">
                  {dayShifts.map((item) => {
                    const isConflict = conflictIds.has(item.id);
                    const isBusy = attendancePendingIds.has(item.id);
                    const attendance = item.attendanceStatus ?? 'pending';
                    return (
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => onEdit(item)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') onEdit(item);
                        }}
                        title={vi ? 'Bấm để sửa ca này' : 'Click to edit'}
                        className={`cursor-pointer rounded-xl border bg-[var(--bg-secondary)] p-2.5 text-left shadow-xs transition-all hover:-translate-y-px hover:shadow-md ${
                          item.status === 'cancelled' ? 'opacity-60' : ''
                        } ${isConflict ? 'border-amber-400 bg-amber-500/[0.06]' : 'border-[var(--border-color)]'}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <p className="flex items-center gap-1 font-mono-code text-xs font-bold text-[var(--text-primary)]">
                            <Clock3 className="h-3 w-3 shrink-0 text-sky-500" />
                            {item.startTime}–{item.endTime}
                          </p>
                          {isConflict && (
                            <span className="flex items-center gap-0.5 rounded bg-amber-500/15 px-1 py-0.5 text-[9px] font-bold text-amber-600">
                              <AlertTriangle className="h-2.5 w-2.5" /> {vi ? 'Trùng' : 'Overlap'}
                            </span>
                          )}
                        </div>

                        <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${WORK_MODE_DOT[item.workMode] ?? 'bg-sky-500'}`} />
                          <span className="truncate">{displayNameOf(item.userId, item.userName)}</span>
                        </p>
                        {item.title && (
                          <p className="mt-0.5 truncate text-[11px] text-[var(--text-muted)]">{item.title}</p>
                        )}

                        {item.status === 'cancelled' ? (
                          <span className="mt-1.5 inline-block rounded-md bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-500">
                            {vi ? 'Đã huỷ' : 'Cancelled'}
                          </span>
                        ) : (
                          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1">
                            <span
                              className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                                attendance === 'checked_out'
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : attendance === 'checked_in'
                                    ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                                    : attendance === 'absent'
                                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                      : 'bg-slate-500/10 text-[var(--text-muted)]'
                              }`}
                            >
                              {attendance === 'checked_out'
                                ? vi
                                  ? 'Đã hoàn thành'
                                  : 'Done'
                                : attendance === 'checked_in'
                                  ? vi
                                    ? 'Đang làm'
                                    : 'Working'
                                  : attendance === 'absent'
                                    ? vi
                                      ? 'Vắng mặt'
                                      : 'Absent'
                                    : vi
                                      ? 'Chưa điểm danh'
                                      : 'Not checked'}
                            </span>
                            {(attendance === 'pending' || attendance === 'absent') && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCheckIn(item);
                                }}
                                disabled={isBusy}
                                title="Check-in"
                                className="inline-flex items-center gap-0.5 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                <LogIn className="h-2.5 w-2.5" />
                                {vi ? 'Vào' : 'In'}
                              </button>
                            )}
                            {attendance === 'checked_in' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCheckOut(item);
                                }}
                                disabled={isBusy}
                                title="Check-out"
                                className="inline-flex items-center gap-0.5 rounded-md bg-amber-600 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                              >
                                <LogOut className="h-2.5 w-2.5" />
                                {vi ? 'Ra' : 'Out'}
                              </button>
                            )}
                          </div>
                        )}

                        {(item.checkInAt || item.checkOutAt) && (
                          <p className="mt-1 font-mono-code text-[10px] text-[var(--text-muted)]">
                            {formatCheckTime(item.checkInAt)} → {formatCheckTime(item.checkOutAt)}
                            {(item.earlyCheckInMinutes ?? 0) > 0 ? ` • Sớm ${item.earlyCheckInMinutes}p` : ''}
                            {(item.lateMinutes ?? 0) > 0 ? ` • Trễ ${item.lateMinutes}p` : ''}
                            {(item.lateCheckOutMinutes ?? 0) > 0 ? ` • Checkout trễ ${item.lateCheckOutMinutes}p` : ''}
                          </p>
                        )}

                        {(item.checkInLocationId || item.checkInLocationName) && (
                          <p className="mt-0.5 truncate text-[10px] text-[var(--text-muted)]">
                            📍 {resolveCheckInLocationLabel(item.checkInLocationId, item.checkInLocationName)}
                            {item.checkInDistanceMeters != null ? ` (${formatDistanceMeters(item.checkInDistanceMeters)})` : ''}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => onQuickAssign(day)}
                    className="mt-auto flex items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[var(--border-color)] py-2.5 text-xs font-bold text-[var(--text-muted)] transition-all hover:border-sky-500 hover:bg-sky-500/5 hover:text-sky-600"
                  >
                    <Plus className="h-4 w-4" />
                    {vi ? 'Thêm ca' : 'Add'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Danh sách ca gọn bên dưới lưới tuần */}
      <div className="border-t border-[var(--border-color)]">
        <div className="border-b border-[var(--border-color)] px-4 py-3">
          <p className="text-sm font-bold text-[var(--text-primary)]">
            {vi ? `Danh sách ca trong tuần (${weekShifts.length})` : `Shifts this week (${weekShifts.length})`}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {outsideCount > 0
              ? vi
                ? `Còn ${outsideCount} ca ngoài tuần này trong khoảng lọc — xem ở chế độ "Theo nhân viên" hoặc "Bảng chi tiết".`
                : `${outsideCount} more shifts outside this week in the current filter — see "By staff" or "Detailed table".`
              : vi
                ? 'Bấm Check-in/Check-out để điểm danh hộ, bút để sửa, thùng rác để xoá'
                : 'Click Check-in/Check-out to mark attendance, pencil to edit, trash to delete'}
          </p>
        </div>
        {weekShifts.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
            {vi ? 'Không có ca nào trong tuần này.' : 'No shifts this week.'}
          </p>
        ) : (
          <div className="divide-y divide-[var(--border-color)]">
            {weekShifts.map((item) => {
              const attendance = item.attendanceStatus ?? 'pending';
              const isBusy = attendancePendingIds.has(item.id);
              const isConflict = conflictIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--bg-hover)]/50"
                >
                  <Avatar name={displayNameOf(item.userId, item.userName)} src={item.userAvatar} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                      {displayNameOf(item.userId, item.userName)}
                      {isConflict && (
                        <span className="ml-2 inline-flex items-center gap-0.5 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-600">
                          <AlertTriangle className="h-2.5 w-2.5" /> {vi ? 'Trùng' : 'Overlap'}
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-[var(--text-secondary)]">
                      {weekdayShort(item.workDate, language)}, {formatDisplayDate(item.workDate)} •{' '}
                      {item.startTime}–{item.endTime}
                      {item.title ? ` • ${item.title}` : ''}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant={
                          item.status === 'published'
                            ? 'success'
                            : ('danger' as const)
                        }
                        dot
                      >
                        {item.status === 'published'
                          ? vi
                            ? 'Đang áp dụng'
                            : 'Published'
                          : vi
                            ? 'Đã huỷ'
                            : 'Cancelled'}
                      </Badge>
                      <span
                        className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          attendance === 'checked_out'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : attendance === 'checked_in'
                              ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                              : attendance === 'absent'
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                : 'bg-slate-500/10 text-[var(--text-muted)]'
                        }`}
                      >
                        {attendance === 'checked_out'
                          ? vi
                            ? 'Đã hoàn thành'
                            : 'Done'
                          : attendance === 'checked_in'
                            ? vi
                              ? 'Đang làm'
                              : 'Working'
                            : attendance === 'absent'
                              ? vi
                                ? 'Vắng mặt'
                                : 'Absent'
                              : vi
                                ? 'Chưa điểm danh'
                                : 'Not checked'}
                      </span>
                      {(item.checkInAt || item.checkOutAt) && (
                        <span className="font-mono-code text-[11px] text-[var(--text-muted)]">
                          ({formatCheckTime(item.checkInAt)} → {formatCheckTime(item.checkOutAt)}
                          {(item.workedMinutes ?? 0) > 0 ? ` • ${item.workedMinutes}p` : ''}
                          {(item.lateMinutes ?? 0) > 0 ? ` • Trễ ${item.lateMinutes}p` : ''})
                        </span>
                      )}
                      {(item.checkInLocationId || item.checkInLocationName) && (
                        <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                          📍 {resolveCheckInLocationLabel(item.checkInLocationId, item.checkInLocationName)}
                          {item.checkInDistanceMeters != null
                            ? ` (${formatDistanceMeters(item.checkInDistanceMeters)})`
                            : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {item.status === 'published' &&
                      (attendance === 'pending' || attendance === 'absent') && (
                        <button
                          type="button"
                          onClick={() => onCheckIn(item)}
                          disabled={isBusy}
                          title={vi ? 'Check-in hộ nhân viên' : 'Check-in staff'}
                          className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-2 text-xs font-bold text-emerald-600 transition-colors hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-400"
                        >
                          <LogIn className="h-3.5 w-3.5" />
                          {vi ? 'Vào' : 'In'}
                        </button>
                      )}
                    {item.status === 'published' && attendance === 'checked_in' && (
                      <button
                        type="button"
                        onClick={() => onCheckOut(item)}
                        disabled={isBusy}
                        title={vi ? 'Check-out hộ nhân viên' : 'Check-out staff'}
                        className="inline-flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-xs font-bold text-amber-600 transition-colors hover:bg-amber-500/20 disabled:opacity-50 dark:text-amber-400"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        {vi ? 'Ra' : 'Out'}
                      </button>
                    )}
                    {attendance === 'checked_out' && (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 px-2.5 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {vi ? 'Xong' : 'Done'}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      title={vi ? 'Sửa ca' : 'Edit shift'}
                      className="rounded-xl border border-[var(--border-color)] p-2.5 text-[var(--text-secondary)] transition-colors hover:border-sky-500 hover:text-sky-500"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      title={vi ? 'Xoá ca' : 'Delete shift'}
                      className="rounded-xl border border-[var(--border-color)] p-2.5 text-[var(--text-secondary)] transition-colors hover:border-rose-500 hover:text-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
