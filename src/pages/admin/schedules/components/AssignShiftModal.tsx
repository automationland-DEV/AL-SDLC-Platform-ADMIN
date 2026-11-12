import { useEffect, useState } from 'react';
import { Loader2, UserRound, Users } from 'lucide-react';
import { Button, Input, MultiSearchableSelect, SearchableSelect, Select } from '../../../../components/ui';
import { WORK_MODE_OPTIONS } from '../../../../services/workScheduleService';
import { FieldLabel, ModalShell, QuickShiftPicker, type StaffOption } from '../lib/schedule-ui';
import { formatDisplayDate, parseWorkDateValue, weekdayFull } from '../lib/schedule-utils';

/** Giá trị trả về khi bấm "Xong". */
export interface AssignShiftForm {
  mode: 'single' | 'bulk';
  userId: string;
  userIds: string[];
  workDate: string;
  startTime: string;
  endTime: string;
  title: string;
  workMode: string;
}

/** Giá trị khởi tạo khi mở modal (không chứa danh sách chọn nhiều người). */
export interface AssignShiftSeed {
  userId: string;
  workDate: string;
  startTime: string;
  endTime: string;
  title: string;
  workMode: string;
}

interface AssignShiftModalProps {
  open: boolean;
  onClose: () => void;
  staffOptions: StaffOption[];
  initial: AssignShiftSeed;
  isPending: boolean;
  onSubmit: (form: AssignShiftForm) => void;
  vi: boolean;
  language: string;
}

export default function AssignShiftModal({
  open,
  onClose,
  staffOptions,
  initial,
  isPending,
  onSubmit,
  vi,
  language,
}: AssignShiftModalProps) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [userId, setUserId] = useState(initial.userId);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [workDate, setWorkDate] = useState(initial.workDate);
  const [startTime, setStartTime] = useState(initial.startTime);
  const [endTime, setEndTime] = useState(initial.endTime);
  const [title, setTitle] = useState(initial.title);
  const [workMode, setWorkMode] = useState(initial.workMode);

  // Reset form đúng lúc modal mở. Dùng các giá trị primitive làm dependency
  // để không reset khi parent tạo lại object `initial` ở mỗi render.
  useEffect(() => {
    if (!open) return;
    setMode('single');
    setUserId(initial.userId);
    setUserIds([]);
    setWorkDate(initial.workDate);
    setStartTime(initial.startTime);
    setEndTime(initial.endTime);
    setTitle(initial.title);
    setWorkMode(initial.workMode);
  }, [
    open,
    initial.userId,
    initial.workDate,
    initial.startTime,
    initial.endTime,
    initial.title,
    initial.workMode,
  ]);

  if (!open) return null;

  const applyQuickShift = (start: string, end: string, quickTitle: string) => {
    setStartTime(start);
    setEndTime(end);
    setTitle(quickTitle);
  };

  return (
    <ModalShell
      title={vi ? 'Gán ca mới' : 'New shift'}
      subtitle={vi ? 'Chỉ 3 bước là xong!' : 'Only 3 steps!'}
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
                mode,
                userId,
                userIds,
                workDate,
                startTime,
                endTime,
                title,
                workMode,
              })
            }
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {vi ? 'Xong — Lưu ca' : 'Done — Save'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--bg-tertiary)] p-1">
          {(
            [
              { id: 'single', label: vi ? '1 người' : '1 person', icon: UserRound },
              { id: 'bulk', label: vi ? 'Nhiều người' : 'Many people', icon: Users },
            ] as Array<{ id: 'single' | 'bulk'; label: string; icon: typeof Users }>
          ).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-bold transition-all ${
                  mode === item.id
                    ? 'bg-[var(--bg-card)] text-sky-600 shadow-xs dark:text-sky-400'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div>
          <FieldLabel step="1">{vi ? 'Ai làm ca này?' : 'Who works?'}</FieldLabel>
          {mode === 'single' ? (
            <SearchableSelect
              options={staffOptions}
              value={userId}
              onChange={setUserId}
              placeholder={vi ? 'Bấm để chọn nhân viên...' : 'Click to pick staff...'}
            />
          ) : (
            <MultiSearchableSelect
              options={staffOptions}
              values={userIds}
              onChange={setUserIds}
              placeholder={vi ? 'Bấm để chọn nhiều người...' : 'Click to pick people...'}
            />
          )}
        </div>

        <div>
          <FieldLabel step="2">{vi ? 'Làm ngày nào?' : 'Which day?'}</FieldLabel>
          <Input type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} />
          <p className="mt-1.5 text-xs text-[var(--text-muted)]">
            {vi ? 'Đang chọn: ' : 'Selected: '}
            <b className="text-[var(--text-primary)]">
              {weekdayFull(parseWorkDateValue(workDate).getDay(), language)}, {formatDisplayDate(workDate)}
            </b>
          </p>
        </div>

        <div>
          <FieldLabel step="3">{vi ? 'Làm giờ nào?' : 'What hours?'}</FieldLabel>
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
          <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Input
              label={vi ? 'Tên ca (không bắt buộc)' : 'Shift name (optional)'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={vi ? 'Ví dụ: Ca sáng...' : 'E.g. Morning shift...'}
            />
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                {vi ? 'Hình thức làm việc' : 'Work mode'}
              </label>
              <Select
                value={workMode}
                onChange={setWorkMode}
                options={WORK_MODE_OPTIONS}
              />
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
