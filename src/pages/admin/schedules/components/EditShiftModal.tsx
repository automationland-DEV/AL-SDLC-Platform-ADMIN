import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button, Input, Select } from '../../../../components/ui';
import {
  ATTENDANCE_STATUS_OPTIONS,
  CHECKIN_LOCATIONS,
  formatCheckTime,
  WORK_MODE_OPTIONS,
} from '../../../../services/workScheduleService';
import { FieldLabel, ModalShell, QuickShiftPicker, Avatar } from '../lib/schedule-ui';
import { formatDisplayDate, formatHours } from '../lib/schedule-utils';

export interface EditShiftForm {
  workDate: string;
  startTime: string;
  endTime: string;
  title: string;
  status: string;
  workMode: string;
  attendanceStatus: string;
  attendanceNote: string;
  checkInLocationId: string;
}

interface EditShiftModalProps {
  open: boolean;
  onClose: () => void;
  staffName: string;
  staffAvatar?: string | null;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  workedMinutes?: number;
  lateMinutes?: number;
  initial: EditShiftForm;
  isPending: boolean;
  onSubmit: (form: EditShiftForm) => void;
  vi: boolean;
}

export default function EditShiftModal({
  open,
  onClose,
  staffName,
  staffAvatar,
  checkInAt,
  checkOutAt,
  workedMinutes,
  lateMinutes,
  initial,
  isPending,
  onSubmit,
  vi,
}: EditShiftModalProps) {
  const [workDate, setWorkDate] = useState(initial.workDate);
  const [startTime, setStartTime] = useState(initial.startTime);
  const [endTime, setEndTime] = useState(initial.endTime);
  const [title, setTitle] = useState(initial.title);
  const [status, setStatus] = useState(initial.status);
  const [workMode, setWorkMode] = useState(initial.workMode);
  const [attendanceStatus, setAttendanceStatus] = useState(initial.attendanceStatus);
  const [attendanceNote, setAttendanceNote] = useState(initial.attendanceNote);
  const [checkInLocationId, setCheckInLocationId] = useState(initial.checkInLocationId);

  useEffect(() => {
    if (!open) return;
    setWorkDate(initial.workDate);
    setStartTime(initial.startTime);
    setEndTime(initial.endTime);
    setTitle(initial.title);
    setStatus(initial.status);
    setWorkMode(initial.workMode);
    setAttendanceStatus(initial.attendanceStatus);
    setAttendanceNote(initial.attendanceNote);
    setCheckInLocationId(initial.checkInLocationId);
  }, [
    open,
    initial.workDate,
    initial.startTime,
    initial.endTime,
    initial.title,
    initial.status,
    initial.workMode,
    initial.attendanceStatus,
    initial.attendanceNote,
    initial.checkInLocationId,
  ]);

  if (!open) return null;

  const applyQuickShift = (start: string, end: string, quickTitle: string) => {
    setStartTime(start);
    setEndTime(end);
    setTitle(quickTitle);
  };

  return (
    <ModalShell
      title={vi ? 'Sửa ca làm việc' : 'Edit shift'}
      subtitle={`${staffName} • ${formatDisplayDate(workDate)}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" className="flex-1 py-3 text-sm font-bold" onClick={onClose}>
            {vi ? 'Để sau' : 'Later'}
          </Button>
          <Button
            className="flex-[2] py-3 text-sm font-bold"
            disabled={isPending}
            onClick={() =>
              onSubmit({
                workDate,
                startTime,
                endTime,
                title,
                status,
                workMode,
                attendanceStatus,
                attendanceNote,
                checkInLocationId,
              })
            }
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {vi ? 'Xong — Lưu lại' : 'Done — Save'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl bg-[var(--bg-tertiary)] px-4 py-3">
          <Avatar name={staffName} src={staffAvatar} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[var(--text-primary)]">{staffName}</p>
            <p className="font-mono-code text-xs text-[var(--text-muted)]">
              {initial.startTime}–{initial.endTime} • {formatDisplayDate(initial.workDate)}
            </p>
          </div>
        </div>

        <div>
          <FieldLabel step="1">{vi ? 'Đổi ngày (nếu cần)' : 'Change day (if needed)'}</FieldLabel>
          <Input type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} />
        </div>

        <div>
          <FieldLabel step="2">{vi ? 'Đổi giờ' : 'Change hours'}</FieldLabel>
          <div className="mb-2">
            <QuickShiftPicker start={startTime} end={endTime} onPick={applyQuickShift} vi={vi} />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label={vi ? 'Bắt đầu' : 'Start'}
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <Input
              label={vi ? 'Kết thúc' : 'End'}
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        <div>
          <FieldLabel step="3">{vi ? 'Tên ca, trạng thái & điểm danh' : 'Name, status & attendance'}</FieldLabel>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={vi ? 'Tên ca...' : 'Shift name...'}
          />
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                {vi ? 'Nơi làm' : 'Where'}
              </label>
              <Select value={workMode} onChange={setWorkMode} options={WORK_MODE_OPTIONS} />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                {vi ? 'Trạng thái' : 'Status'}
              </label>
              <Select
                value={status}
                onChange={setStatus}
                options={[
                  { value: 'published', label: vi ? 'Đang áp dụng' : 'Published' },
                  { value: 'cancelled', label: vi ? 'Đã huỷ' : 'Cancelled' },
                ]}
              />
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                {vi ? 'Điểm danh' : 'Attendance'}
              </label>
              <Select
                value={attendanceStatus}
                onChange={setAttendanceStatus}
                options={ATTENDANCE_STATUS_OPTIONS}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                {vi ? 'Điểm check-in (≤ 1km)' : 'Check-in location'}
              </label>
              <Select
                value={checkInLocationId}
                onChange={setCheckInLocationId}
                options={CHECKIN_LOCATIONS.map((loc) => ({ value: loc.id, label: loc.shortName }))}
              />
            </div>
          </div>

          <div className="mt-2.5">
            <Input
              label={vi ? 'Ghi chú điểm danh' : 'Attendance note'}
              value={attendanceNote}
              onChange={(e) => setAttendanceNote(e.target.value)}
              placeholder={vi ? 'Lý do đi muộn / về sớm...' : 'Late / early leave note...'}
            />
          </div>

          {(checkInAt || checkOutAt) && (
            <p className="mt-2 font-mono-code text-xs text-[var(--text-muted)]">
              Check-in: {formatCheckTime(checkInAt)} • Check-out: {formatCheckTime(checkOutAt)}
              {(workedMinutes ?? 0) > 0 ? ` • Thực làm: ${formatHours(workedMinutes ?? 0)}` : ''}
              {(lateMinutes ?? 0) > 0 ? ` • Đi trễ: ${lateMinutes} phút` : ''}
            </p>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
