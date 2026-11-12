import { CalendarDays, LayoutGrid, RefreshCw, Search, Table, UserRound } from 'lucide-react';
import { Input, Select } from '../../../../components/ui';
import { ATTENDANCE_VARIANTS, STATUS_OPTIONS, WORK_MODE_FILTER_OPTIONS } from '../lib/schedule-options';
import type { StaffOption } from '../lib/schedule-ui';

export type ScheduleViewMode = 'week' | 'user' | 'month' | 'all';

export interface ScheduleFilterState {
  search: string;
  userId: string;
  from: string;
  to: string;
  status: string;
  attendanceStatus: string;
  workMode: string;
}

interface ScheduleFilterBarProps {
  filters: ScheduleFilterState;
  onChange: (patch: Partial<ScheduleFilterState>) => void;
  staffOptions: StaffOption[];
  view: ScheduleViewMode;
  onViewChange: (view: ScheduleViewMode) => void;
  onRefresh: () => void;
  isFetching: boolean;
  vi: boolean;
}

const VIEW_OPTIONS: Array<{ id: ScheduleViewMode; labelVi: string; labelEn: string; icon: typeof CalendarDays }> = [
  { id: 'week', labelVi: 'Lịch tuần 7 ngày', labelEn: 'Week grid', icon: CalendarDays },
  { id: 'user', labelVi: 'Theo nhân viên', labelEn: 'By staff', icon: UserRound },
  { id: 'month', labelVi: 'Theo tháng', labelEn: 'By month', icon: LayoutGrid },
  { id: 'all', labelVi: 'Bảng chi tiết', labelEn: 'Detailed table', icon: Table },
];

export default function ScheduleFilterBar({
  filters,
  onChange,
  staffOptions,
  view,
  onViewChange,
  onRefresh,
  isFetching,
  vi,
}: ScheduleFilterBarProps) {
  const staffFilterOptions: StaffOption[] = [
    { value: '', label: vi ? 'Tất cả nhân viên' : 'All staff' },
    ...staffOptions,
  ];

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-3 shadow-xs">
      {/* Hàng tìm kiếm + nhân viên + nút tải lại */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder={vi ? 'Gõ tên nhân viên hoặc tên ca để tìm...' : 'Type staff or shift name to search...'}
            className="rounded-xl py-2.5 pl-10 text-sm"
          />
        </div>
        <div className="w-full lg:w-64">
          <Select
            value={filters.userId}
            onChange={(value) => onChange({ userId: value })}
            options={staffFilterOptions}
          />
        </div>
        <button
          onClick={onRefresh}
          disabled={isFetching}
          title={vi ? 'Tải lại' : 'Reload'}
          className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] transition-colors hover:border-sky-500 hover:text-sky-500 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Hàng lọc chi tiết — luôn hiện, không cần mở "Lọc thêm" */}
      <div className="mt-2.5 grid grid-cols-1 gap-2.5 border-t border-[var(--border-color)] pt-2.5 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          type="date"
          value={filters.from}
          onChange={(e) => onChange({ from: e.target.value })}
          label={vi ? 'Từ ngày' : 'From'}
        />
        <Input
          type="date"
          value={filters.to}
          onChange={(e) => onChange({ to: e.target.value })}
          label={vi ? 'Đến ngày' : 'To'}
        />
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            {vi ? 'Trạng thái' : 'Status'}
          </label>
          <Select
            value={filters.status}
            onChange={(value) => onChange({ status: value })}
            options={STATUS_OPTIONS}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            {vi ? 'Điểm danh' : 'Attendance'}
          </label>
          <Select
            value={filters.attendanceStatus}
            onChange={(value) => onChange({ attendanceStatus: value })}
            options={ATTENDANCE_VARIANTS}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            {vi ? 'Nơi làm việc' : 'Work mode'}
          </label>
          <Select
            value={filters.workMode}
            onChange={(value) => onChange({ workMode: value })}
            options={WORK_MODE_FILTER_OPTIONS}
          />
        </div>
      </div>

      {/* Chuyển chế độ xem */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-[var(--border-color)] pt-2.5">
        <span className="text-xs font-semibold text-[var(--text-muted)]">
          {vi ? 'Chế độ xem:' : 'View mode:'}
        </span>
        <div className="flex flex-wrap items-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] p-0.5">
          {VIEW_OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = view === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onViewChange(option.id)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  active
                    ? 'bg-[var(--bg-card)] text-sky-600 shadow-xs dark:text-sky-400'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {vi ? option.labelVi : option.labelEn}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
