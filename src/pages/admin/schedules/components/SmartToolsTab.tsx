import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Copy,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import { Button, Input, SearchableSelect, Select } from '../../../../components/ui';
import type { AvailabilityResult, WeeklySummaryUser } from '../../../../services/workScheduleService';
import { Avatar, Card, type StaffOption } from '../lib/schedule-ui';
import { formatDisplayDate } from '../lib/schedule-utils';

interface SmartToolsTabProps {
  staffOptions: StaffOption[];
  lookupStaff: (userId: string) => { email?: string; avatar?: string | null } | undefined;
  availability: AvailabilityResult | null;
  onCheckAvailability: (params: { userId: string; workDate: string; durationMinutes: number }) => void;
  availabilityPending: boolean;
  summary: WeeklySummaryUser[];
  summaryPending: boolean;
  onFetchSummary: (params: { userId: string; from: string; to: string }) => void;
  onCopyWeek: (params: {
    fromWeekStart: string;
    toWeekStart: string;
    userId: string;
    overwrite: boolean;
  }) => void;
  copyWeekPending: boolean;
  onAssignSuggestion: (params: { userId: string; workDate: string; startTime: string; endTime: string }) => void;
  initialCopyFromWeek: string;
  initialCopyToWeek: string;
  initialSummaryFrom: string;
  initialSummaryTo: string;
  initialSmartDate: string;
  vi: boolean;
}

export default function SmartToolsTab({
  staffOptions,
  lookupStaff,
  availability,
  onCheckAvailability,
  availabilityPending,
  summary,
  summaryPending,
  onFetchSummary,
  onCopyWeek,
  copyWeekPending,
  onAssignSuggestion,
  initialCopyFromWeek,
  initialCopyToWeek,
  initialSummaryFrom,
  initialSummaryTo,
  initialSmartDate,
  vi,
}: SmartToolsTabProps) {
  const [smartUserId, setSmartUserId] = useState('');
  const [smartDate, setSmartDate] = useState(initialSmartDate);
  const [smartDuration, setSmartDuration] = useState(120);
  const [summaryUserId, setSummaryUserId] = useState('');
  const [summaryFrom, setSummaryFrom] = useState(initialSummaryFrom);
  const [summaryTo, setSummaryTo] = useState(initialSummaryTo);
  const [copyFromWeek, setCopyFromWeek] = useState(initialCopyFromWeek);
  const [copyToWeek, setCopyToWeek] = useState(initialCopyToWeek);
  const [copyUserId, setCopyUserId] = useState('');
  const [copyOverwrite, setCopyOverwrite] = useState(false);

  const allStaffOptions: StaffOption[] = [
    { value: '', label: vi ? 'Tất cả nhân viên' : 'All staff' },
    ...staffOptions,
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tìm khung giờ rảnh */}
        <Card
          title={vi ? 'Tìm khung giờ rảnh' : 'Free slot finder'}
          description={
            vi
              ? 'Phát hiện giờ bận và đề xuất ca rảnh khả dụng cho nhân sự'
              : 'Detect busy shifts and suggest free slots for staff'
          }
          icon={<Search className="h-4 w-4" />}
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                {vi ? 'Chọn nhân viên' : 'Select staff'}
              </label>
              <SearchableSelect
                options={staffOptions}
                value={smartUserId}
                onChange={setSmartUserId}
                placeholder={vi ? 'Chọn nhân viên cần tìm giờ...' : 'Select staff...'}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                  {vi ? 'Ngày làm việc' : 'Work date'}
                </label>
                <Input type="date" value={smartDate} onChange={(e) => setSmartDate(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                  {vi ? 'Thời lượng ca (phút)' : 'Shift duration (mins)'}
                </label>
                <Select
                  value={String(smartDuration)}
                  onChange={(value) => setSmartDuration(Number(value))}
                  options={[
                    { value: '60', label: vi ? '1 giờ (60p)' : '1 hour' },
                    { value: '120', label: vi ? '2 giờ (120p)' : '2 hours' },
                    { value: '240', label: vi ? '4 giờ (nửa ca)' : '4 hours' },
                    { value: '480', label: vi ? '8 giờ (cả ngày)' : '8 hours' },
                  ]}
                />
              </div>
            </div>

            <Button
              onClick={() =>
                onCheckAvailability({ userId: smartUserId, workDate: smartDate, durationMinutes: smartDuration })
              }
              disabled={availabilityPending || !smartUserId || !smartDate}
              className="w-full gap-2 py-2.5 font-bold"
            >
              {availabilityPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {vi ? 'Kiểm tra giờ rảnh' : 'Check availability'}
            </Button>

            {availability && (
              <div className="space-y-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)]/30 p-3.5">
                <div>
                  <span className="text-xs font-bold text-[var(--text-secondary)]">
                    {vi ? 'Ca đã xếp (bận):' : 'Busy shifts:'}
                  </span>
                  {availability.busy.length === 0 ? (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {vi ? 'Chưa có ca nào trong ngày (rảnh hoàn toàn)' : 'Entire day is free'}
                    </span>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {availability.busy.map((busy) => (
                        <span
                          key={busy.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 font-mono-code text-[11px] font-bold text-amber-600 dark:text-amber-400"
                        >
                          <Clock3 className="h-2.5 w-2.5" /> {busy.startTime}–{busy.endTime} ({busy.title || 'Ca'})
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-xs font-bold text-[var(--text-secondary)]">
                    {vi ? 'Khung giờ rảnh gợi ý:' : 'Suggested free slots:'}
                  </span>
                  {availability.suggestions.length === 0 ? (
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {vi
                        ? 'Không có khung giờ rảnh phù hợp cho độ dài đã chọn.'
                        : 'No slots fit the duration.'}
                    </p>
                  ) : (
                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                      {availability.suggestions.map((slot, index) => (
                        <button
                          key={`${slot.startTime}-${slot.endTime}-${index}`}
                          type="button"
                          onClick={() =>
                            onAssignSuggestion({
                              userId: smartUserId,
                              workDate: smartDate,
                              startTime: slot.startTime,
                              endTime: slot.endTime,
                            })
                          }
                          className="group flex items-center justify-between rounded-xl border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-left transition hover:border-sky-500 hover:bg-sky-500/10"
                        >
                          <span className="font-mono-code text-xs font-bold text-sky-600 dark:text-sky-400">
                            {slot.startTime}–{slot.endTime}
                          </span>
                          <span className="text-[10px] font-bold text-sky-500 opacity-0 transition group-hover:opacity-100">
                            {vi ? 'Gán ca' : 'Assign'} →
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Copy tuần */}
        <Card
          title={vi ? 'Sao chép ca theo tuần' : 'Copy week shifts'}
          description={
            vi
              ? 'Sao chép toàn bộ lịch làm việc của một tuần sang tuần tiếp theo'
              : 'Clone an entire week of work schedules to another week'
          }
          icon={<Copy className="h-4 w-4" />}
          tone="violet"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                  {vi ? 'Tuần nguồn (Thứ 2)' : 'Source week (Mon)'}
                </label>
                <Input
                  type="date"
                  value={copyFromWeek}
                  onChange={(e) => setCopyFromWeek(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                  {vi ? 'Tuần đích (Thứ 2)' : 'Target week (Mon)'}
                </label>
                <Input type="date" value={copyToWeek} onChange={(e) => setCopyToWeek(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--text-secondary)]">
                {vi ? 'Áp dụng cho' : 'Apply to'}
              </label>
              <SearchableSelect
                options={allStaffOptions}
                value={copyUserId}
                onChange={setCopyUserId}
                placeholder={vi ? 'Tất cả nhân viên' : 'All staff'}
              />
            </div>

            <label className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)]/30 p-3 text-xs font-medium text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={copyOverwrite}
                onChange={(e) => setCopyOverwrite(e.target.checked)}
                className="h-4 w-4 rounded accent-sky-500"
              />
              <span>
                {vi
                  ? 'Ghi đè ca nếu tuần đích đã có ca trùng giờ'
                  : 'Overwrite conflicting shifts in target week'}
              </span>
            </label>

            <Button
              onClick={() =>
                onCopyWeek({
                  fromWeekStart: copyFromWeek,
                  toWeekStart: copyToWeek,
                  userId: copyUserId,
                  overwrite: copyOverwrite,
                })
              }
              disabled={copyWeekPending || copyFromWeek === copyToWeek}
              className="w-full gap-2 py-2.5 font-bold"
            >
              {copyWeekPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {vi ? 'Sao chép toàn bộ tuần' : 'Copy week schedules'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Tổng hợp tuần */}
      <Card
        title={vi ? 'Tổng hợp giờ làm & cảnh báo tăng ca (>44h)' : 'Weekly summary & overtime (>44h)'}
        description={
          vi
            ? 'Thống kê tổng giờ làm trong tuần, tự động phát hiện vượt định mức hoặc trùng ca'
            : 'Calculate weekly hours and auto-flag overtime or conflicts'
        }
        icon={<Clock3 className="h-4 w-4" />}
        tone="emerald"
        actions={
          <>
            <div className="w-48">
              <SearchableSelect
                options={allStaffOptions}
                value={summaryUserId}
                onChange={setSummaryUserId}
                placeholder={vi ? 'Tất cả nhân viên' : 'All staff'}
              />
            </div>
            <Input
              type="date"
              value={summaryFrom}
              onChange={(e) => setSummaryFrom(e.target.value)}
              className="w-36 text-xs"
            />
            <span className="text-xs text-[var(--text-muted)]">→</span>
            <Input
              type="date"
              value={summaryTo}
              onChange={(e) => setSummaryTo(e.target.value)}
              className="w-36 text-xs"
            />
            <Button
              size="sm"
              onClick={() => onFetchSummary({ userId: summaryUserId, from: summaryFrom, to: summaryTo })}
              disabled={summaryPending}
              className="gap-1 font-bold"
            >
              {summaryPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {vi ? 'Tổng hợp' : 'Analyze'}
            </Button>
          </>
        }
      >
        {summary.length === 0 ? (
          <p className="py-8 text-center text-xs text-[var(--text-muted)]">
            {vi
              ? 'Bấm nút "Tổng hợp" ở trên để xem phân tích số giờ làm việc theo tuần'
              : 'Click "Analyze" above to view weekly working hour metrics'}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summary.map((row) => {
              const conflicts = row.conflicts ?? [];
              const staff = lookupStaff(row.userId);
              return (
                <div
                  key={row.userId}
                  className={`rounded-xl border p-4 transition-all ${
                    row.overtime
                      ? 'border-rose-500/40 bg-rose-500/5'
                      : conflicts.length > 0
                        ? 'border-amber-500/40 bg-amber-500/5'
                        : 'border-[var(--border-color)] bg-[var(--bg-tertiary)]/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar name={row.userName || 'Staff'} src={staff?.avatar} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-[var(--text-primary)]">
                          {row.userName || row.userId}
                        </p>
                        <p className="truncate text-[11px] text-[var(--text-muted)]">{staff?.email || '—'}</p>
                      </div>
                    </div>
                    <span className="font-mono-code text-sm font-bold text-[var(--text-primary)]">
                      {row.totalHours ?? Math.round((row.totalMinutes / 60) * 10) / 10}h
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {row.overtime && (
                      <span className="inline-flex items-center gap-1 rounded bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">
                        <AlertTriangle className="h-3 w-3" /> {vi ? 'Tăng ca (>44h)' : 'Overtime'}
                      </span>
                    )}
                    {conflicts.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                        <AlertTriangle className="h-3 w-3" />{' '}
                        {vi ? `Trùng ${conflicts.length} ca` : `${conflicts.length} conflicts`}
                      </span>
                    )}
                    {(row.lateShifts ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                        {vi ? `Trễ ${row.lateShifts} ca` : `${row.lateShifts} late`}
                      </span>
                    )}
                    {(row.absentShifts ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 rounded bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">
                        {vi ? `Vắng ${row.absentShifts} ca` : `${row.absentShifts} absent`}
                      </span>
                    )}
                    {!row.overtime && conflicts.length === 0 && (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" /> {vi ? 'Định mức chuẩn' : 'Normal'}
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                    {vi ? 'Tổng giờ' : 'Total'}: {row.shifts} {vi ? 'ca' : 'shifts'} •{' '}
                    {vi ? 'Thực làm' : 'Worked'}: {row.workedHours ?? 0}h •{' '}
                    {vi ? 'Hoàn thành' : 'Completed'}: {row.completedShifts ?? 0}/{row.shifts}
                  </p>

                  {conflicts.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {conflicts.slice(0, 3).map((conflict) => (
                        <li key={conflict.id} className="font-mono-code text-[10px] text-amber-600">
                          • {formatDisplayDate(conflict.workDate)} {conflict.startTime}–{conflict.endTime}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
