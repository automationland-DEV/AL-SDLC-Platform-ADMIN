import { useEffect, useState } from 'react';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { Button, Input, SearchableSelect, Select } from '../../../../components/ui';
import {
  resolveWorkModeLabel,
  WORK_MODE_OPTIONS,
  type AdminWorkScheduleTemplate,
} from '../../../../services/workScheduleService';
import { Avatar, Card, FieldLabel, QuickShiftPicker, WeekdayPicker, type StaffOption } from '../lib/schedule-ui';
import { weekdayFull } from '../lib/schedule-utils';

export interface TemplateForm {
  userId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  title: string;
  workMode: string;
}

interface TemplatesTabProps {
  templates: AdminWorkScheduleTemplate[];
  templatesLoading: boolean;
  staffOptions: StaffOption[];
  filterUserId: string;
  onFilterUserChange: (userId: string) => void;
  editing: AdminWorkScheduleTemplate | null;
  onEditingChange: (template: AdminWorkScheduleTemplate | null) => void;
  onSubmit: (form: TemplateForm) => void;
  onToggleActive: (template: AdminWorkScheduleTemplate) => void;
  onDelete: (template: AdminWorkScheduleTemplate) => void;
  isPending: boolean;
  displayNameOf: (userId: string, fallback?: string) => string;
  vi: boolean;
  language: string;
}

export default function TemplatesTab({
  templates,
  templatesLoading,
  staffOptions,
  filterUserId,
  onFilterUserChange,
  editing,
  onEditingChange,
  onSubmit,
  onToggleActive,
  onDelete,
  isPending,
  displayNameOf,
  vi,
  language,
}: TemplatesTabProps) {
  const [userId, setUserId] = useState('');
  const [weekday, setWeekday] = useState(1);
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('17:00');
  const [title, setTitle] = useState('');
  const [workMode, setWorkMode] = useState('office');

  useEffect(() => {
    if (!editing) return;
    setUserId(editing.userId);
    setWeekday(editing.weekday);
    setStartTime(editing.startTime);
    setEndTime(editing.endTime);
    setTitle(editing.title || '');
    setWorkMode(editing.workMode || 'office');
  }, [editing]);

  const filterOptions: StaffOption[] = [
    { value: '', label: vi ? 'Tất cả nhân viên' : 'All staff' },
    ...staffOptions,
  ];

  const startEditing = (template: AdminWorkScheduleTemplate) => {
    onEditingChange(template);
  };

  const cancelEditing = () => {
    onEditingChange(null);
    setTitle('');
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      {/* Form tạo / sửa mẫu tuần */}
      <Card
        className="lg:col-span-2"
        title={
          editing
            ? vi
              ? 'Sửa ca mẫu'
              : 'Edit template'
            : vi
              ? 'Tạo ca mẫu mới — 3 bước'
              : 'New template — 3 steps'
        }
        description={
          vi
            ? 'Ca mẫu tự lặp lại mỗi tuần. Ví dụ: Thứ 2 hàng tuần 8h–17h.'
            : 'Templates repeat every week. E.g. every Monday 8am–5pm.'
        }
      >
        <div className="space-y-4">
          {!editing && (
            <div>
              <FieldLabel step="1">{vi ? 'Chọn nhân viên' : 'Pick staff'}</FieldLabel>
              <SearchableSelect
                options={staffOptions}
                value={userId}
                onChange={setUserId}
                placeholder={vi ? 'Bấm để chọn nhân viên...' : 'Click to pick staff...'}
              />
            </div>
          )}
          {editing && (
            <div className="flex items-center gap-2.5 rounded-xl bg-[var(--bg-tertiary)] px-3 py-2">
              <Avatar name={editing.userName || '?'} src={editing.userAvatar} size="sm" />
              <p className="truncate text-xs font-bold text-[var(--text-primary)]">
                {displayNameOf(editing.userId, editing.userName)}
              </p>
            </div>
          )}

          <div>
            <FieldLabel step={editing ? undefined : '2'}>{vi ? 'Chọn ngày trong tuần' : 'Pick weekday'}</FieldLabel>
            <WeekdayPicker value={weekday} onChange={setWeekday} language={language} />
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">
              {vi ? 'Đang chọn: ' : 'Selected: '}
              <b className="text-[var(--text-primary)]">{weekdayFull(weekday, language)}</b>
            </p>
          </div>

          <div>
            <FieldLabel step={editing ? undefined : '3'}>{vi ? 'Chọn giờ làm' : 'Pick hours'}</FieldLabel>
            <div className="mb-2">
              <QuickShiftPicker
                start={startTime}
                end={endTime}
                onPick={(start, end, quickTitle) => {
                  setStartTime(start);
                  setEndTime(end);
                  setTitle(quickTitle);
                }}
                vi={vi}
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Input
                label={vi ? 'Giờ bắt đầu' : 'Start'}
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <Input
                label={vi ? 'Giờ kết thúc' : 'End'}
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

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
            <Select value={workMode} onChange={setWorkMode} options={WORK_MODE_OPTIONS} />
          </div>

          <div className="flex gap-2 pt-1">
            {editing && (
              <Button variant="secondary" className="flex-1 py-2.5" onClick={cancelEditing}>
                {vi ? 'Huỷ' : 'Cancel'}
              </Button>
            )}
            <Button
              className="flex-1 py-2.5 text-sm font-bold"
              disabled={isPending}
              onClick={() => onSubmit({ userId, weekday, startTime, endTime, title, workMode })}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {vi ? 'Lưu ca mẫu' : 'Save template'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Danh sách mẫu tuần */}
      <div className="lg:col-span-3">
        <Card
          title={vi ? 'Danh sách ca mẫu' : 'Shift templates'}
          description={
            vi
              ? 'Bật/tắt để tạm ngưng áp dụng mẫu cho nhân viên.'
              : 'Toggle a template to pause applying it for a staff member.'
          }
          actions={
            <div className="min-w-[180px]">
              <SearchableSelect
                options={filterOptions}
                value={filterUserId}
                onChange={onFilterUserChange}
                placeholder={vi ? 'Lọc theo nhân viên...' : 'Filter by staff...'}
              />
            </div>
          }
        >
          {templatesLoading ? (
            <p className="py-10 text-center text-sm text-[var(--text-muted)]">
              {vi ? 'Đang tải mẫu...' : 'Loading templates...'}
            </p>
          ) : templates.length === 0 ? (
            <div className="py-12 text-center">
              <span className="text-4xl">📋</span>
              <p className="mt-2 text-sm font-bold text-[var(--text-primary)]">
                {vi ? 'Chưa có ca mẫu nào' : 'No templates yet'}
              </p>
              <p className="mx-auto mt-1 max-w-xs text-xs text-[var(--text-muted)]">
                {vi
                  ? 'Tạo ca mẫu ở form bên trái, sau đó dùng tab "Tự tạo lịch" để sinh lịch hàng loạt.'
                  : 'Create a template on the left, then use auto-generate to create shifts in bulk.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-color)]">
              {templates.map((template) => (
                <div key={template.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar name={template.userName || '?'} src={template.userAvatar} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                      {displayNameOf(template.userId, template.userName)}
                    </p>
                    <p className="truncate text-xs text-[var(--text-secondary)]">
                      {weekdayFull(template.weekday, language)} • {template.startTime}–{template.endTime} •{' '}
                      {resolveWorkModeLabel(template.workMode)}
                      {template.title ? ` • ${template.title}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleActive(template)}
                    className={`relative h-7 w-12 shrink-0 rounded-full p-1 transition-colors ${
                      template.isActive ? 'bg-emerald-500' : 'bg-[var(--border-color)]'
                    }`}
                    title={
                      template.isActive
                        ? vi
                          ? 'Đang bật — bấm để tắt'
                          : 'On — click to turn off'
                        : vi
                          ? 'Đang tắt — bấm để bật'
                          : 'Off — click to turn on'
                    }
                  >
                    <span
                      className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        template.isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => startEditing(template)}
                    aria-label={vi ? 'Sửa' : 'Edit'}
                    className="rounded-xl border border-[var(--border-color)] p-2.5 text-[var(--text-secondary)] hover:border-sky-500 hover:text-sky-500"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(template)}
                    aria-label={vi ? 'Xoá' : 'Delete'}
                    className="rounded-xl border border-[var(--border-color)] p-2.5 text-[var(--text-secondary)] hover:border-rose-500 hover:text-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
