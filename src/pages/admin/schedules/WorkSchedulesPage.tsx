import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Layers,
  Loader2,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  UserRound,
  Users,
  Wand2,
  X,
} from 'lucide-react';
import {
  Badge,
  Button,
  ConfirmModal,
  Input,
  MultiSearchableSelect,
  PageHeader,
  SearchableSelect,
  Select,
} from '../../../components/ui';
import { useDebounce } from '../../../hooks/useDebounce';
import { useTranslation } from '../../../i18n/useTranslation';
import { userService } from '../../../services/authService';
import {
  ATTENDANCE_STATUS_OPTIONS,
  CHECKIN_LOCATIONS,
  WORK_MODE_OPTIONS,
  formatCheckTime,
  formatDisplayDate,
  formatDistanceMeters,
  resolveAttendanceLabel,
  resolveCheckInLocationLabel,
  resolveWorkModeLabel,
  todayIsoDate,
  type AdminWorkScheduleItem,
  type AdminWorkScheduleTemplate,
} from '../../../services/workScheduleService';
import {
  useAdminCheckInScheduleMutation,
  useAdminCheckOutScheduleMutation,
  useAssignScheduleMutation,
  useBulkAssignScheduleMutation,
  useCreateWorkScheduleTemplateMutation,
  useGenerateSchedulesMutation,
  useRemoveScheduleMutation,
  useRemoveTemplateMutation,
  useUpdateScheduleMutation,
  useUpdateWorkScheduleTemplateMutation,
  useWorkScheduleTemplatesQuery,
  useWorkSchedulesQuery,
} from '../../../hooks/queries/useWorkSchedulesQuery';

type MainTab = 'schedules' | 'templates' | 'generate';

const getErrorMessage = (error: unknown, fallback: string): string => {
  try {
    const errObj = error as Record<string, unknown>;
    const response = errObj?.response as Record<string, unknown>;
    const data = response?.data as Record<string, unknown>;
    const msg = data?.message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return String(msg[0]);
    if (typeof errObj?.message === 'string') return errObj.message;
    return fallback;
  } catch {
    return fallback;
  }
};

function useAllUsers() {
  return useQuery({
    queryKey: ['users', 'select-all'],
    queryFn: async () => {
      const res = await userService.getAllUsers({ limit: 200, page: 1 });
      return res.data ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

function parseWorkDateValue(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return new Date(value);
  return new Date(year, month - 1, day);
}

function toIsoDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekStartIso(workDate: string): string {
  const date = parseWorkDateValue(workDate);
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayOffset);
  return toIsoDateValue(date);
}

function addDaysIso(workDate: string, days: number): string {
  const date = parseWorkDateValue(workDate);
  date.setDate(date.getDate() + days);
  return toIsoDateValue(date);
}

function getScheduleMinutes(item: AdminWorkScheduleItem): number {
  const [sh, sm] = item.startTime.split(':').map(Number);
  const [eh, em] = item.endTime.split(':').map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;
  return Math.max(0, eh * 60 + em - (sh * 60 + sm));
}

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} giờ`;
  return `${h}h${String(m).padStart(2, '0')}`;
}

function weekdayShort(workDate: string, lang: string): string {
  const d = parseWorkDateValue(workDate).getDay();
  if (lang === 'vi') return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d];
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d];
}

function weekdayFull(weekday: number, lang: string): string {
  if (lang === 'vi') return ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][weekday];
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][weekday];
}

const QUICK_SHIFTS = [
  { id: 'morning', labelVi: 'Sáng 8h30–12h', labelEn: 'Morning 8:30–12', start: '08:30', end: '12:00', titleVi: 'Ca sáng', titleEn: 'Morning' },
  { id: 'afternoon', labelVi: 'Chiều 13–17h', labelEn: 'Afternoon 13–17', start: '13:00', end: '17:00', titleVi: 'Ca chiều', titleEn: 'Afternoon' },
  { id: 'full', labelVi: 'Cả ngày 8h30–17h', labelEn: 'Full day 8:30–17', start: '08:30', end: '17:00', titleVi: 'Ca cả ngày', titleEn: 'Full day' },
  { id: 'night', labelVi: 'Tối 18–22h', labelEn: 'Evening 18–22', start: '18:00', end: '22:00', titleVi: 'Ca tối', titleEn: 'Evening' },
];

const WORK_MODE_DOT: Record<string, string> = {
  office: 'bg-sky-500',
  remote: 'bg-violet-500',
  half_day: 'bg-amber-500',
};

function Avatar({ name, src, size = 'md' }: { name: string; src?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'sm' ? 'h-7 w-7 text-[11px]' : size === 'lg' ? 'h-11 w-11 text-base' : 'h-9 w-9 text-sm';
  if (src) {
    return <img src={src} alt="" className={`${cls} rounded-full border border-[var(--border-color)] object-cover`} />;
  }
  return (
    <div className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/25 to-violet-500/25 font-bold text-sky-600 dark:text-sky-300`}>
      {(name || 'U').charAt(0).toUpperCase()}
    </div>
  );
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-color)] px-5 py-4">
          <div>
            <h3 className="text-[15px] font-bold text-[var(--text-primary)]">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex gap-2 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)]/40 px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function FieldLabel({ step, children }: { step?: string; children: React.ReactNode }) {
  return (
    <label className="mb-1.5 flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
      {step && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-[11px] font-bold text-white">
          {step}
        </span>
      )}
      {children}
    </label>
  );
}

export default function WorkSchedulesPage() {
  const { t, language } = useTranslation();
  const vi = language === 'vi';
  const [tab, setTab] = useState<MainTab>('schedules');

  // Filters — keep minimal on screen
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [filterUserId, setFilterUserId] = useState('');
  const [from, setFrom] = useState(todayIsoDate(-7));
  const [to, setTo] = useState(todayIsoDate(30));
  const [status, setStatus] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState('');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [weekAnchor, setWeekAnchor] = useState(() => getWeekStartIso(todayIsoDate(0)));
  const todayIso = todayIsoDate(0);

  // Assign modal
  const [showAssign, setShowAssign] = useState(false);
  const [assignMode, setAssignMode] = useState<'single' | 'bulk'>('single');
  const [assignUserId, setAssignUserId] = useState('');
  const [assignUserIds, setAssignUserIds] = useState<string[]>([]);
  const [assignDate, setAssignDate] = useState(todayIsoDate(1));
  const [assignStart, setAssignStart] = useState('08:30');
  const [assignEnd, setAssignEnd] = useState('17:00');
  const [assignTitle, setAssignTitle] = useState('');
  const [assignWorkMode, setAssignWorkMode] = useState('office');

  // Edit modal
  const [editing, setEditing] = useState<AdminWorkScheduleItem | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editWorkMode, setEditWorkMode] = useState('office');
  const [editAttendanceStatus, setEditAttendanceStatus] = useState('pending');
  const [editAttendanceNote, setEditAttendanceNote] = useState('');
  const [editCheckInLocationId, setEditCheckInLocationId] = useState(CHECKIN_LOCATIONS[0].id);

  const [deleting, setDeleting] = useState<AdminWorkScheduleItem | null>(null);

  // Templates
  const [templateUserId, setTemplateUserId] = useState('');
  const [templateWeekday, setTemplateWeekday] = useState('1');
  const [templateStart, setTemplateStart] = useState('08:30');
  const [templateEnd, setTemplateEnd] = useState('17:00');
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateWorkMode, setTemplateWorkMode] = useState('office');
  const [editingTemplate, setEditingTemplate] = useState<AdminWorkScheduleTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<AdminWorkScheduleTemplate | null>(null);

  // Generate
  const [generateUserId, setGenerateUserId] = useState('');
  const [generateFrom, setGenerateFrom] = useState(todayIsoDate(0));
  const [generateTo, setGenerateTo] = useState(todayIsoDate(30));

  const { data: allUsers = [] } = useAllUsers();

  const userOptions = useMemo(
    () =>
      (allUsers ?? []).map((u) => ({
        value: u.id,
        label: u.fullName || u.email,
        email: u.email,
        avatar: u.avatar,
      })),
    [allUsers],
  );

  const filterUserOptions = useMemo(
    () => [{ value: '', label: vi ? 'Tất cả nhân viên' : 'All staff' }, ...userOptions],
    [userOptions, vi],
  );

  const { data: listData, isLoading, isFetching, refetch } = useWorkSchedulesQuery({
    userId: filterUserId || undefined,
    from: from || undefined,
    to: to || undefined,
    status: status || undefined,
    workMode: workModeFilter || undefined,
    attendanceStatus: attendanceFilter || undefined,
    page: 1,
    limit: 200,
  });
  const schedules = useMemo(() => listData?.items ?? [], [listData]);

  const userById = useMemo(() => {
    const map = new Map<string, (typeof allUsers)[number]>();
    (allUsers ?? []).forEach((u) => {
      if (u?.id) map.set(u.id, u);
    });
    return map;
  }, [allUsers]);

  const displayNameOf = (userId: string, fallback?: string) =>
    fallback || userById.get(userId)?.fullName || userById.get(userId)?.email || (vi ? 'Nhân viên' : 'Staff');

  const filteredSchedules = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase();
    if (!keyword) return schedules;
    return schedules.filter((item) => {
      const name = (item.userName || userById.get(item.userId)?.fullName || '').toLowerCase();
      return (
        name.includes(keyword) ||
        (item.title || '').toLowerCase().includes(keyword) ||
        item.workDate.includes(keyword)
      );
    });
  }, [schedules, debouncedSearch, userById]);

  const sortedSchedules = useMemo(
    () =>
      filteredSchedules.slice().sort((a, b) => {
        if (a.workDate !== b.workDate) return a.workDate < b.workDate ? -1 : 1;
        if (a.startTime !== b.startTime) return a.startTime < b.startTime ? -1 : 1;
        return 0;
      }),
    [filteredSchedules],
  );

  const totalMinutes = sortedSchedules.reduce((sum, item) => sum + getScheduleMinutes(item), 0);
  const staffCount = new Set(sortedSchedules.map((s) => s.userId)).size;

  // Week calendar
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysIso(weekAnchor, i)), [weekAnchor]);
  const weekEnd = weekDays[6];
  const shiftsByDate = useMemo(() => {
    const map = new Map<string, AdminWorkScheduleItem[]>();
    for (const item of sortedSchedules) {
      if (!map.has(item.workDate)) map.set(item.workDate, []);
      map.get(item.workDate)!.push(item);
    }
    for (const list of map.values()) list.sort((a, b) => (a.startTime < b.startTime ? -1 : 1));
    return map;
  }, [sortedSchedules]);

  const templatesQuery = useWorkScheduleTemplatesQuery(templateUserId || undefined);
  const templates = templatesQuery.data ?? [];

  const assignMutation = useAssignScheduleMutation();
  const bulkAssignMutation = useBulkAssignScheduleMutation();
  const updateMutation = useUpdateScheduleMutation();
  const removeMutation = useRemoveScheduleMutation();
  const createTemplateMutation = useCreateWorkScheduleTemplateMutation();
  const updateTemplateMutation = useUpdateWorkScheduleTemplateMutation();
  const removeTemplateMutation = useRemoveTemplateMutation();
  const generateMutation = useGenerateSchedulesMutation();
  const checkInMutation = useAdminCheckInScheduleMutation();
  const checkOutMutation = useAdminCheckOutScheduleMutation();

  const openEdit = (item: AdminWorkScheduleItem) => {
    setEditing(item);
    setEditDate(item.workDate);
    setEditStart(item.startTime);
    setEditEnd(item.endTime);
    setEditTitle(item.title || '');
    setEditStatus(item.status);
    setEditWorkMode(item.workMode || 'office');
    setEditAttendanceStatus(item.attendanceStatus || 'pending');
    setEditAttendanceNote(item.attendanceNote || '');
    setEditCheckInLocationId(item.checkInLocationId || CHECKIN_LOCATIONS[0].id);
  };

  const openQuickAssign = (dateIso?: string, userId?: string) => {
    if (dateIso) setAssignDate(dateIso);
    if (userId) {
      setAssignMode('single');
      setAssignUserId(userId);
    }
    setShowAssign(true);
  };

  const jumpWeek = (targetStartIso: string) => {
    const start = getWeekStartIso(targetStartIso);
    const end = addDaysIso(start, 6);
    setWeekAnchor(start);
    if (!from || start < from) setFrom(start);
    if (!to || end > to) setTo(end);
  };

  const applyPreset = (kind: 'today' | 'week' | 'month') => {
    if (kind === 'today') {
      const today = todayIsoDate(0);
      setFrom(today);
      setTo(today);
      setWeekAnchor(getWeekStartIso(today));
    } else if (kind === 'week') {
      const start = getWeekStartIso(todayIsoDate(0));
      setFrom(start);
      setTo(addDaysIso(start, 6));
      setWeekAnchor(start);
    } else {
      const now = new Date();
      const first = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const lastDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const last = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDate).padStart(2, '0')}`;
      setFrom(first);
      setTo(last);
    }
  };

  const pickQuickShift = (start: string, end: string, title: string, setter: { setStart: (v: string) => void; setEnd: (v: string) => void; setTitle: (v: string) => void }) => {
    setter.setStart(start);
    setter.setEnd(end);
    setter.setTitle(title);
  };

  const handleAssign = async () => {
    try {
      if (assignMode === 'single') {
        if (!assignUserId) {
          toast.error(t('schedules.pickUser'));
          return;
        }
        await assignMutation.mutateAsync({
          userId: assignUserId,
          workDate: assignDate,
          startTime: assignStart,
          endTime: assignEnd,
          title: assignTitle.trim() || undefined,
          workMode: assignWorkMode || 'office',
        });
        toast.success(t('schedules.assignSuccess'));
      } else {
        if (assignUserIds.length === 0) {
          toast.error(t('schedules.pickUser'));
          return;
        }
        const result = await bulkAssignMutation.mutateAsync({
          userIds: assignUserIds,
          workDate: assignDate,
          startTime: assignStart,
          endTime: assignEnd,
          title: assignTitle.trim() || undefined,
          workMode: assignWorkMode || 'office',
        });
        toast.success(t('schedules.bulkSuccess', { count: result.created }));
        if (result.skipped?.length > 0) {
          toast(
            vi
              ? `Bỏ qua ${result.skipped.length} nhân viên do trùng ca`
              : `Skipped ${result.skipped.length} staff due to overlap`,
            { icon: '⚠️' },
          );
        }
      }
      setShowAssign(false);
      setAssignUserIds([]);
      setAssignTitle('');
      void refetch();
    } catch (error) {
      toast.error(getErrorMessage(error, t('schedules.assignFailed')));
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      await updateMutation.mutateAsync({
        id: editing.id,
        payload: {
          workDate: editDate || undefined,
          startTime: editStart || undefined,
          endTime: editEnd || undefined,
          title: editTitle,
          status: editStatus || undefined,
          workMode: editWorkMode || undefined,
          attendanceStatus: editAttendanceStatus || undefined,
          attendanceNote: editAttendanceNote,
          checkInLocationId: editCheckInLocationId || undefined,
        },
      });
      toast.success(t('schedules.updateSuccess'));
      setEditing(null);
    } catch (error) {
      toast.error(getErrorMessage(error, t('schedules.updateFailed')));
    }
  };

  const handleCheckIn = async (item: AdminWorkScheduleItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await checkInMutation.mutateAsync({ id: item.id });
      toast.success(vi ? 'Đã check-in ca làm việc' : 'Checked in shift');
    } catch (error) {
      toast.error(getErrorMessage(error, vi ? 'Không thể check-in' : 'Check-in failed'));
    }
  };

  const handleCheckOut = async (item: AdminWorkScheduleItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await checkOutMutation.mutateAsync({ id: item.id });
      toast.success(vi ? 'Đã check-out ca làm việc' : 'Checked out shift');
    } catch (error) {
      toast.error(getErrorMessage(error, vi ? 'Không thể check-out' : 'Check-out failed'));
    }
  };

  const handleSaveTemplate = async () => {
    const userId = editingTemplate ? editingTemplate.userId : templateUserId;
    if (!userId) {
      toast.error(t('schedules.pickUser'));
      return;
    }
    try {
      if (editingTemplate) {
        await updateTemplateMutation.mutateAsync({
          id: editingTemplate.id,
          payload: {
            weekday: Number(templateWeekday),
            startTime: templateStart,
            endTime: templateEnd,
            title: templateTitle.trim() || undefined,
            workMode: templateWorkMode || undefined,
          },
        });
        toast.success(t('schedules.templateUpdateSuccess'));
      } else {
        await createTemplateMutation.mutateAsync({
          userId,
          weekday: Number(templateWeekday),
          startTime: templateStart,
          endTime: templateEnd,
          title: templateTitle.trim() || undefined,
          workMode: templateWorkMode || undefined,
        });
        toast.success(t('schedules.templateCreateSuccess'));
      }
      setEditingTemplate(null);
      setTemplateTitle('');
    } catch (error) {
      toast.error(getErrorMessage(error, t('schedules.templateSaveFailed')));
    }
  };

  const handleGenerate = async () => {
    if (!generateUserId) {
      toast.error(t('schedules.pickUser'));
      return;
    }
    try {
      const result = await generateMutation.mutateAsync({
        userId: generateUserId,
        from: generateFrom,
        to: generateTo,
      });
      toast.success(t('schedules.generateSuccess', { created: result.created, skipped: result.skipped }));
    } catch (error) {
      toast.error(getErrorMessage(error, t('schedules.generateFailed')));
    }
  };

  const tabs: Array<{ id: MainTab; label: string; hint: string; icon: typeof CalendarDays }> = [
    { id: 'schedules', label: vi ? 'Lịch làm việc' : 'Schedule', hint: vi ? 'Xem và gán ca' : 'View & assign', icon: CalendarDays },
    { id: 'templates', label: vi ? 'Ca mẫu lặp lại' : 'Repeating shifts', hint: vi ? 'Đặt ca cố định mỗi tuần' : 'Fixed weekly shifts', icon: Layers },
    { id: 'generate', label: vi ? 'Tự tạo lịch' : 'Auto create', hint: vi ? 'Sinh lịch từ ca mẫu' : 'Generate from templates', icon: Wand2 },
  ];

  return (
    <div className="flex w-full flex-col gap-4 pb-6 font-sans">
      <PageHeader
        breadcrumbs={[{ label: 'Admin' }, { label: vi ? 'Lịch làm việc' : 'Schedules' }]}
        title={vi ? 'Lịch làm việc' : 'Work schedules'}
        subtitle={
          vi
            ? `${sortedSchedules.length} ca • ${formatHours(totalMinutes)} • ${staffCount} nhân viên`
            : `${sortedSchedules.length} shifts • ${formatHours(totalMinutes)} • ${staffCount} staff`
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => void refetch()} disabled={isFetching}>
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {vi ? 'Tải lại' : 'Reload'}
            </Button>
            <Button onClick={() => openQuickAssign()} className="px-5 py-2.5 text-sm font-bold">
              <Plus className="h-4 w-4" />
              {vi ? 'Gán ca mới' : 'New shift'}
            </Button>
          </>
        }
      />

      {/* 3 big actions — pick what you want to do */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {tabs.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-all ${
                active
                  ? 'border-sky-500 bg-sky-500/[0.07] shadow-sm'
                  : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-sky-500/40'
              }`}
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-sky-600 text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-[var(--text-primary)]">{item.label}</span>
                <span className="block truncate text-xs text-[var(--text-muted)]">{item.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      {tab === 'schedules' && (
        <div className="flex w-full flex-col gap-3">
          {/* Super simple toolbar: search + staff + quick dates */}
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-3 shadow-xs">
            <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={vi ? 'Gõ tên nhân viên hoặc tên ca để tìm...' : 'Type staff or shift name to search...'}
                  className="rounded-xl py-2.5 pl-10 text-sm"
                />
              </div>
              <div className="w-full lg:w-64">
                <SearchableSelect
                  options={filterUserOptions}
                  value={filterUserId}
                  onChange={setFilterUserId}
                  placeholder={vi ? 'Chọn nhân viên...' : 'Pick staff...'}
                />
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[var(--text-muted)]">{vi ? 'Xem nhanh:' : 'Quick view:'}</span>
              {(
                [
                  { id: 'today', label: vi ? 'Hôm nay' : 'Today' },
                  { id: 'week', label: vi ? 'Tuần này' : 'This week' },
                  { id: 'month', label: vi ? 'Tháng này' : 'This month' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id)}
                  className="rounded-full border border-[var(--border-color)] bg-[var(--bg-tertiary)]/60 px-4 py-1.5 text-xs font-bold text-[var(--text-secondary)] transition-all hover:border-sky-500 hover:text-sky-600"
                >
                  {p.label}
                </button>
              ))}
              <span className="font-mono-code text-[11px] text-[var(--text-muted)]">
                {formatDisplayDate(from)} → {formatDisplayDate(to)}
              </span>
              <button
                onClick={() => setShowMoreFilters((v) => !v)}
                className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {vi ? 'Lọc thêm' : 'More filters'}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showMoreFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {showMoreFilters && (
              <div className="mt-2.5 grid grid-cols-1 gap-2.5 border-t border-[var(--border-color)] pt-2.5 sm:grid-cols-2 lg:grid-cols-5">
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} label={vi ? 'Từ ngày' : 'From'} />
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} label={vi ? 'Đến ngày' : 'To'} />
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{vi ? 'Trạng thái' : 'Status'}</label>
                  <Select
                    value={status}
                    onChange={setStatus}
                    options={[
                      { value: '', label: vi ? 'Tất cả' : 'All' },
                      { value: 'published', label: t('schedules.published') },
                      { value: 'cancelled', label: t('schedules.cancelled') },
                    ]}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{vi ? 'Điểm danh' : 'Attendance'}</label>
                  <Select
                    value={attendanceFilter}
                    onChange={setAttendanceFilter}
                    options={[
                      { value: '', label: vi ? 'Tất cả điểm danh' : 'All attendance' },
                      ...ATTENDANCE_STATUS_OPTIONS,
                    ]}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{vi ? 'Nơi làm việc' : 'Work mode'}</label>
                  <Select
                    value={workModeFilter}
                    onChange={setWorkModeFilter}
                    options={[
                      { value: '', label: vi ? 'Tất cả' : 'All' },
                      { value: 'office', label: resolveWorkModeLabel('office') },
                      { value: 'remote', label: resolveWorkModeLabel('remote') },
                      { value: 'half_day', label: resolveWorkModeLabel('half_day') },
                    ]}
                  />
                </div>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] py-16 text-sm text-[var(--text-muted)]">
              <Loader2 className="h-5 w-5 animate-spin" />
              {vi ? 'Đang tải lịch...' : 'Loading...'}
            </div>
          ) : sortedSchedules.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-card)] px-6 py-16 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 text-3xl">📅</span>
              <p className="text-base font-bold text-[var(--text-primary)]">
                {vi ? 'Chưa có ca làm việc nào' : 'No shifts yet'}
              </p>
              <p className="max-w-sm text-sm text-[var(--text-muted)]">
                {vi ? 'Bấm nút bên dưới để gán ca đầu tiên. Chỉ mất 10 giây!' : 'Press the button below to assign the first shift. Only 10 seconds!'}
              </p>
              <Button onClick={() => openQuickAssign()} className="mt-1 px-6 py-3 text-sm font-bold">
                <Plus className="h-4 w-4" />
                {vi ? 'Gán ca đầu tiên' : 'Assign first shift'}
              </Button>
            </div>
          ) : (
            <>
              {/* Week calendar — big touch targets, always-visible add */}
              <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/40 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => jumpWeek(addDaysIso(weekAnchor, -7))}
                      aria-label={vi ? 'Tuần trước' : 'Previous week'}
                      className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-2 text-[var(--text-secondary)] transition-colors hover:border-sky-500 hover:text-sky-500"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => jumpWeek(todayIsoDate(0))}
                      className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2 text-xs font-bold text-[var(--text-primary)] transition-colors hover:border-sky-500"
                    >
                      {vi ? 'Về hôm nay' : 'Today'}
                    </button>
                    <button
                      onClick={() => jumpWeek(addDaysIso(weekAnchor, 7))}
                      aria-label={vi ? 'Tuần sau' : 'Next week'}
                      className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-2 text-[var(--text-secondary)] transition-colors hover:border-sky-500 hover:text-sky-500"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <p className="ml-1 text-sm font-bold text-[var(--text-primary)]">
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
                        <div key={day} className={`flex min-h-[300px] flex-col ${isToday ? 'bg-sky-500/[0.05]' : ''}`}>
                          <div className={`border-b border-[var(--border-color)] px-2 py-2.5 text-center ${isToday ? 'bg-sky-600 text-white' : 'bg-[var(--bg-tertiary)]/60'}`}>
                            <p className={`text-[11px] font-bold uppercase tracking-wider ${isToday ? 'text-sky-100' : 'text-[var(--text-muted)]'}`}>
                              {weekdayShort(day, language)}
                            </p>
                            <p className={`text-lg font-bold leading-tight ${isToday ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                              {day.split('-')[2]}
                            </p>
                            <p className={`font-mono-code text-[10px] ${isToday ? 'text-sky-100' : 'text-[var(--text-muted)]'}`}>
                              {dayShifts.length} {vi ? 'ca' : 'shifts'}
                            </p>
                          </div>
                          <div className="flex flex-1 flex-col gap-2 p-2">
                            {dayShifts.map((item) => (
                              <div
                                key={item.id}
                                onClick={() => openEdit(item)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') openEdit(item);
                                }}
                                title={vi ? 'Bấm để sửa ca này' : 'Click to edit'}
                                className={`cursor-pointer rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-2.5 text-left shadow-xs transition-all hover:-translate-y-px hover:shadow-md ${
                                  item.status === 'cancelled' ? 'opacity-60' : ''
                                }`}
                              >
                                <p className="flex items-center gap-1 font-mono-code text-xs font-bold text-[var(--text-primary)]">
                                  <Clock3 className="h-3 w-3 shrink-0 text-sky-500" />
                                  {item.startTime}–{item.endTime}
                                </p>
                                <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                                  <span className={`h-2 w-2 shrink-0 rounded-full ${WORK_MODE_DOT[item.workMode] ?? 'bg-sky-500'}`} />
                                  <span className="truncate">{displayNameOf(item.userId, item.userName)}</span>
                                </p>
                                {item.title && (
                                  <p className="mt-0.5 truncate text-[11px] text-[var(--text-muted)]">{item.title}</p>
                                )}
                                {item.status === 'cancelled' ? (
                                  <span className="mt-1.5 inline-block rounded-md bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-500">
                                    {t('schedules.cancelled')}
                                  </span>
                                ) : (
                                  <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1">
                                    <span
                                      className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                                        item.attendanceStatus === 'checked_out'
                                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                          : item.attendanceStatus === 'checked_in'
                                            ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                                            : item.attendanceStatus === 'absent'
                                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                              : 'bg-slate-500/10 text-[var(--text-muted)]'
                                      }`}
                                    >
                                      {resolveAttendanceLabel(item.attendanceStatus)}
                                    </span>
                                    {(!item.attendanceStatus || item.attendanceStatus === 'pending' || item.attendanceStatus === 'absent') && (
                                      <button
                                        type="button"
                                        onClick={(e) => void handleCheckIn(item, e)}
                                        disabled={checkInMutation.isPending}
                                        title="Check-in"
                                        className="inline-flex items-center gap-0.5 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                                      >
                                        <LogIn className="h-2.5 w-2.5" />
                                        In
                                      </button>
                                    )}
                                    {item.attendanceStatus === 'checked_in' && (
                                      <button
                                        type="button"
                                        onClick={(e) => void handleCheckOut(item, e)}
                                        disabled={checkOutMutation.isPending}
                                        title="Check-out"
                                        className="inline-flex items-center gap-0.5 rounded-md bg-amber-600 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                                      >
                                        <LogOut className="h-2.5 w-2.5" />
                                        Out
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
                            ))}
                            {/* Always-visible big add button — easiest to discover */}
                            <button
                              onClick={() => openQuickAssign(day)}
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
              </div>

              {/* Simple list below — newest first, big rows */}
              <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
                <div className="border-b border-[var(--border-color)] px-4 py-3">
                  <p className="text-sm font-bold text-[var(--text-primary)]">
                    {vi ? `Danh sách ca (${sortedSchedules.length})` : `Shift list (${sortedSchedules.length})`}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {vi ? 'Bấm Check-in/Check-out để điểm danh hộ, cây bút để sửa, thùng rác để xoá' : 'Click Check-in/Check-out to mark attendance, pencil to edit, trash to delete'}
                  </p>
                </div>
                <div className="divide-y divide-[var(--border-color)]">
                  {sortedSchedules.slice(0, 30).map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--bg-hover)]/50">
                      <Avatar name={displayNameOf(item.userId, item.userName)} src={item.userAvatar} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                          {displayNameOf(item.userId, item.userName)}
                        </p>
                        <p className="truncate text-xs text-[var(--text-secondary)]">
                          {weekdayFull(parseWorkDateValue(item.workDate).getDay(), language)}, {formatDisplayDate(item.workDate)} • {item.startTime}–{item.endTime}
                          {item.title ? ` • ${item.title}` : ''}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <Badge variant={item.workMode === 'remote' ? 'purple' : item.workMode === 'half_day' ? 'warning' : 'info'}>
                            {resolveWorkModeLabel(item.workMode)}
                          </Badge>
                          {item.status === 'published' ? (
                            <Badge variant="success" dot>{t('schedules.published')}</Badge>
                          ) : (
                            <Badge variant="danger" dot>{t('schedules.cancelled')}</Badge>
                          )}
                          <Badge
                            variant={
                              item.attendanceStatus === 'checked_out'
                                ? 'success'
                                : item.attendanceStatus === 'checked_in'
                                  ? 'info'
                                  : item.attendanceStatus === 'absent'
                                    ? 'danger'
                                    : 'default'
                            }
                          >
                            {resolveAttendanceLabel(item.attendanceStatus)}
                          </Badge>
                          {(item.checkInAt || item.checkOutAt) && (
                            <span className="font-mono-code text-[11px] text-[var(--text-muted)]">
                              ({formatCheckTime(item.checkInAt)} → {formatCheckTime(item.checkOutAt)}
                              {(item.workedMinutes ?? 0) > 0 ? ` • ${formatHours(item.workedMinutes ?? 0)}` : ''}
                              {(item.earlyCheckInMinutes ?? 0) > 0 ? ` • Sớm ${item.earlyCheckInMinutes}p` : ''}
                              {(item.lateMinutes ?? 0) > 0 ? ` • Trễ ${item.lateMinutes}p` : ''}
                              {(item.lateCheckOutMinutes ?? 0) > 0 ? ` • Checkout trễ ${item.lateCheckOutMinutes}p` : ''})
                            </span>
                          )}
                          {(item.checkInLocationId || item.checkInLocationName) && (
                            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                              📍 {resolveCheckInLocationLabel(item.checkInLocationId, item.checkInLocationName)}
                              {item.checkInDistanceMeters != null ? ` (${formatDistanceMeters(item.checkInDistanceMeters)})` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {item.status === 'published' && (!item.attendanceStatus || item.attendanceStatus === 'pending' || item.attendanceStatus === 'absent') && (
                          <button
                            onClick={(e) => void handleCheckIn(item, e)}
                            disabled={checkInMutation.isPending}
                            title={vi ? 'Check-in hộ nhân viên' : 'Check-in staff'}
                            className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-2 text-xs font-bold text-emerald-600 transition-colors hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-400"
                          >
                            <LogIn className="h-3.5 w-3.5" />
                            Check-in
                          </button>
                        )}
                        {item.status === 'published' && item.attendanceStatus === 'checked_in' && (
                          <button
                            onClick={(e) => void handleCheckOut(item, e)}
                            disabled={checkOutMutation.isPending}
                            title={vi ? 'Check-out hộ nhân viên' : 'Check-out staff'}
                            className="inline-flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-xs font-bold text-amber-600 transition-colors hover:bg-amber-500/20 disabled:opacity-50 dark:text-amber-400"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                            Check-out
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(item)}
                          aria-label={vi ? 'Sửa ca' : 'Edit shift'}
                          className="rounded-xl border border-[var(--border-color)] p-2.5 text-[var(--text-secondary)] transition-colors hover:border-sky-500 hover:text-sky-500"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleting(item)}
                          aria-label={vi ? 'Xoá ca' : 'Delete shift'}
                          className="rounded-xl border border-[var(--border-color)] p-2.5 text-[var(--text-secondary)] transition-colors hover:border-rose-500 hover:text-rose-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {sortedSchedules.length > 30 && (
                  <p className="border-t border-[var(--border-color)] px-4 py-2.5 text-center text-xs text-[var(--text-muted)]">
                    {vi ? `Đang hiện 30 / ${sortedSchedules.length} ca — hãy dùng ô tìm kiếm để lọc` : `Showing 30 of ${sortedSchedules.length} — use search to filter`}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'templates' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {/* Step-by-step form */}
          <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs lg:col-span-2 lg:sticky lg:top-0 lg:self-start">
            <div className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/40 px-5 py-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {editingTemplate ? (vi ? 'Sửa ca mẫu' : 'Edit template') : (vi ? 'Tạo ca mẫu mới — 3 bước' : 'New template — 3 steps')}
              </h3>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {vi ? 'Ca mẫu tự lặp lại mỗi tuần. Ví dụ: Thứ 2 hàng tuần 8h–17h.' : 'Templates repeat every week. E.g. every Monday 8am–5pm.'}
              </p>
            </div>
            <div className="space-y-4 p-5">
              {!editingTemplate && (
                <div>
                  <FieldLabel step="1">{vi ? 'Chọn nhân viên' : 'Pick staff'}</FieldLabel>
                  <SearchableSelect
                    options={userOptions}
                    value={templateUserId}
                    onChange={setTemplateUserId}
                    placeholder={vi ? 'Bấm để chọn nhân viên...' : 'Click to pick staff...'}
                  />
                </div>
              )}
              {editingTemplate && (
                <div className="flex items-center gap-2.5 rounded-xl bg-[var(--bg-tertiary)] px-3 py-2">
                  <Avatar name={editingTemplate.userName || '?'} src={editingTemplate.userAvatar} size="sm" />
                  <p className="truncate text-xs font-bold text-[var(--text-primary)]">
                    {displayNameOf(editingTemplate.userId, editingTemplate.userName)}
                  </p>
                </div>
              )}
              <div>
                <FieldLabel step={editingTemplate ? undefined : '2'}>{vi ? 'Chọn ngày trong tuần' : 'Pick weekday'}</FieldLabel>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                    <button
                      key={d}
                      onClick={() => setTemplateWeekday(String(d))}
                      className={`rounded-xl border-2 py-2 text-xs font-bold transition-all ${
                        templateWeekday === String(d)
                          ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400'
                          : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]'
                      }`}
                    >
                      {weekdayShort(`2024-01-0${d === 0 ? 7 : d}`, language)}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                  {vi ? 'Đang chọn: ' : 'Selected: '}<b className="text-[var(--text-primary)]">{weekdayFull(Number(templateWeekday), language)}</b>
                </p>
              </div>
              <div>
                <FieldLabel step={editingTemplate ? undefined : '3'}>{vi ? 'Chọn giờ làm' : 'Pick hours'}</FieldLabel>
                <div className="mb-2 grid grid-cols-2 gap-1.5">
                  {QUICK_SHIFTS.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => pickQuickShift(q.start, q.end, vi ? q.titleVi : q.titleEn, { setStart: setTemplateStart, setEnd: setTemplateEnd, setTitle: setTemplateTitle })}
                      className="rounded-xl border border-[var(--border-color)] px-2 py-2 text-xs font-bold text-[var(--text-secondary)] transition-all hover:border-sky-500 hover:text-sky-600"
                    >
                      {vi ? q.labelVi : q.labelEn}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <Input label={vi ? 'Giờ bắt đầu' : 'Start'} type="time" value={templateStart} onChange={(e) => setTemplateStart(e.target.value)} />
                  <Input label={vi ? 'Giờ kết thúc' : 'End'} type="time" value={templateEnd} onChange={(e) => setTemplateEnd(e.target.value)} />
                </div>
              </div>
              <Input
                label={vi ? 'Tên ca (không bắt buộc)' : 'Shift name (optional)'}
                value={templateTitle}
                onChange={(e) => setTemplateTitle(e.target.value)}
                placeholder={vi ? 'Ví dụ: Ca sáng...' : 'E.g. Morning shift...'}
              />
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[var(--text-primary)]">{vi ? 'Hình thức làm việc' : 'Work mode'}</label>
                <Select
                  value={templateWorkMode}
                  onChange={setTemplateWorkMode}
                  options={WORK_MODE_OPTIONS}
                />
              </div>
              <div className="flex gap-2 pt-1">
                {editingTemplate && (
                  <Button
                    variant="secondary"
                    className="flex-1 py-2.5"
                    onClick={() => {
                      setEditingTemplate(null);
                      setTemplateTitle('');
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                )}
                <Button
                  className="flex-1 py-2.5 text-sm font-bold"
                  disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                  onClick={() => void handleSaveTemplate()}
                >
                  {(createTemplateMutation.isPending || updateTemplateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {vi ? 'Lưu ca mẫu' : 'Save template'}
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
              <div className="flex flex-wrap items-center gap-2.5 border-b border-[var(--border-color)] p-3">
                <div className="min-w-[200px] flex-1">
                  <SearchableSelect
                    options={filterUserOptions}
                    value={templateUserId}
                    onChange={setTemplateUserId}
                    placeholder={vi ? 'Lọc theo nhân viên...' : 'Filter by staff...'}
                  />
                </div>
                <span className="rounded-full bg-[var(--bg-tertiary)] px-3 py-1 font-mono-code text-xs font-bold text-[var(--text-secondary)]">
                  {templates.length} {vi ? 'ca mẫu' : 'templates'}
                </span>
              </div>
              {templatesQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-14 text-sm text-[var(--text-muted)]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t('common.loading')}
                </div>
              ) : templates.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                  <span className="text-4xl">📋</span>
                  <p className="text-sm font-bold text-[var(--text-primary)]">{vi ? 'Chưa có ca mẫu nào' : 'No templates yet'}</p>
                  <p className="max-w-xs text-xs text-[var(--text-muted)]">
                    {vi ? 'Tạo ca mẫu ở khung bên trái, sau đó dùng nút "Tự tạo lịch" để sinh lịch hàng loạt.' : 'Create a template on the left, then use auto-generate to create shifts in bulk.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-color)]">
                  {templates.map((tpl) => (
                    <div key={tpl.id} className="flex items-center gap-3 px-4 py-3">
                      <Avatar name={tpl.userName || '?'} src={tpl.userAvatar} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                          {displayNameOf(tpl.userId, tpl.userName)}
                        </p>
                        <p className="truncate text-xs text-[var(--text-secondary)]">
                          {weekdayFull(tpl.weekday, language)} • {tpl.startTime}–{tpl.endTime} • {resolveWorkModeLabel(tpl.workMode)}
                          {tpl.title ? ` • ${tpl.title}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          updateTemplateMutation.mutate(
                            { id: tpl.id, payload: { isActive: !tpl.isActive } },
                            { onError: (e) => toast.error(getErrorMessage(e, t('schedules.templateSaveFailed'))) },
                          )
                        }
                        className={`relative h-7 w-12 shrink-0 rounded-full p-1 transition-colors ${tpl.isActive ? 'bg-emerald-500' : 'bg-[var(--border-color)]'}`}
                        title={tpl.isActive ? (vi ? 'Đang bật — bấm để tắt' : 'On — click to turn off') : (vi ? 'Đang tắt — bấm để bật' : 'Off — click to turn on')}
                      >
                        <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${tpl.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingTemplate(tpl);
                          setTemplateWeekday(String(tpl.weekday));
                          setTemplateStart(tpl.startTime);
                          setTemplateEnd(tpl.endTime);
                          setTemplateTitle(tpl.title || '');
                          setTemplateWorkMode(tpl.workMode || 'office');
                        }}
                        aria-label={vi ? 'Sửa' : 'Edit'}
                        className="rounded-xl border border-[var(--border-color)] p-2.5 text-[var(--text-secondary)] hover:border-sky-500 hover:text-sky-500"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingTemplate(tpl)}
                        aria-label={vi ? 'Xoá' : 'Delete'}
                        className="rounded-xl border border-[var(--border-color)] p-2.5 text-[var(--text-secondary)] hover:border-rose-500 hover:text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'generate' && (
        <div className="mx-auto w-full max-w-xl">
          <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
            <div className="border-b border-[var(--border-color)] bg-gradient-to-r from-sky-500/10 to-violet-500/10 px-5 py-4">
              <h3 className="flex items-center gap-2.5 text-[15px] font-bold text-[var(--text-primary)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white">
                  <Wand2 className="h-5 w-5" />
                </span>
                {vi ? 'Tự tạo lịch từ ca mẫu' : 'Auto-create from templates'}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
                {vi ? 'Bước 1: chọn nhân viên. Bước 2: chọn khoảng ngày. Bước 3: bấm nút tạo. Ca nào trùng giờ sẽ tự bỏ qua.' : 'Step 1: pick staff. Step 2: pick dates. Step 3: press create. Overlapping shifts are skipped.'}
              </p>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <FieldLabel step="1">{vi ? 'Chọn nhân viên' : 'Pick staff'}</FieldLabel>
                <SearchableSelect
                  options={userOptions}
                  value={generateUserId}
                  onChange={setGenerateUserId}
                  placeholder={vi ? 'Bấm để chọn nhân viên...' : 'Click to pick staff...'}
                />
              </div>
              <div>
                <FieldLabel step="2">{vi ? 'Chọn khoảng ngày' : 'Pick date range'}</FieldLabel>
                <div className="grid grid-cols-2 gap-2.5">
                  <Input label={vi ? 'Từ ngày' : 'From'} type="date" value={generateFrom} onChange={(e) => setGenerateFrom(e.target.value)} />
                  <Input label={vi ? 'Đến ngày' : 'To'} type="date" value={generateTo} onChange={(e) => setGenerateTo(e.target.value)} />
                </div>
              </div>
              <div>
                <FieldLabel step="3">{vi ? 'Bấm nút để tạo' : 'Press to create'}</FieldLabel>
                <Button
                  className="w-full py-3 text-sm font-bold"
                  disabled={generateMutation.isPending || !generateUserId}
                  onClick={() => void handleGenerate()}
                >
                  {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  {vi ? 'Tạo lịch ngay' : 'Create now'}
                </Button>
                {!generateUserId && (
                  <p className="mt-1.5 text-center text-xs text-[var(--text-muted)]">
                    {vi ? 'Hãy chọn nhân viên ở bước 1 trước nhé' : 'Please pick staff in step 1 first'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign modal — 3 steps */}
      {showAssign && (
        <ModalShell
          title={vi ? 'Gán ca mới' : 'New shift'}
          subtitle={vi ? 'Chỉ 3 bước là xong!' : 'Only 3 steps!'}
          onClose={() => setShowAssign(false)}
          footer={
            <>
              <Button variant="secondary" className="flex-1 py-3 text-sm font-bold" onClick={() => setShowAssign(false)}>
                {vi ? 'Để sau' : 'Later'}
              </Button>
              <Button
                className="flex-[2] py-3 text-sm font-bold"
                disabled={assignMutation.isPending || bulkAssignMutation.isPending}
                onClick={() => void handleAssign()}
              >
                {(assignMutation.isPending || bulkAssignMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
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
              ).map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setAssignMode(m.id)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-bold transition-all ${
                      assignMode === m.id
                        ? 'bg-[var(--bg-card)] text-sky-600 shadow-xs dark:text-sky-400'
                        : 'text-[var(--text-muted)]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {m.label}
                  </button>
                );
              })}
            </div>

            <div>
              <FieldLabel step="1">{vi ? 'Ai làm ca này?' : 'Who works?'}</FieldLabel>
              {assignMode === 'single' ? (
                <SearchableSelect
                  options={userOptions}
                  value={assignUserId}
                  onChange={setAssignUserId}
                  placeholder={vi ? 'Bấm để chọn nhân viên...' : 'Click to pick staff...'}
                />
              ) : (
                <MultiSearchableSelect options={userOptions} values={assignUserIds} onChange={setAssignUserIds} placeholder={vi ? 'Bấm để chọn nhiều người...' : 'Click to pick people...'} />
              )}
            </div>

            <div>
              <FieldLabel step="2">{vi ? 'Làm ngày nào?' : 'Which day?'}</FieldLabel>
              <Input type="date" value={assignDate} onChange={(e) => setAssignDate(e.target.value)} />
              <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                {vi ? 'Đang chọn: ' : 'Selected: '}<b className="text-[var(--text-primary)]">{weekdayFull(parseWorkDateValue(assignDate).getDay(), language)}, {formatDisplayDate(assignDate)}</b>
              </p>
            </div>

            <div>
              <FieldLabel step="3">{vi ? 'Làm giờ nào?' : 'What hours?'}</FieldLabel>
              <div className="mb-2 grid grid-cols-2 gap-1.5">
                {QUICK_SHIFTS.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => pickQuickShift(q.start, q.end, vi ? q.titleVi : q.titleEn, { setStart: setAssignStart, setEnd: setAssignEnd, setTitle: setAssignTitle })}
                    className={`rounded-xl border-2 px-2 py-2.5 text-xs font-bold transition-all ${
                      assignStart === q.start && assignEnd === q.end
                        ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400'
                        : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-sky-500/50'
                    }`}
                  >
                    {vi ? q.labelVi : q.labelEn}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Input label={vi ? 'Bắt đầu' : 'Start'} type="time" value={assignStart} onChange={(e) => setAssignStart(e.target.value)} />
                <Input label={vi ? 'Kết thúc' : 'End'} type="time" value={assignEnd} onChange={(e) => setAssignEnd(e.target.value)} />
              </div>
              <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <Input
                  label={vi ? 'Tên ca (không bắt buộc)' : 'Shift name (optional)'}
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  placeholder={vi ? 'Ví dụ: Ca sáng...' : 'E.g. Morning shift...'}
                />
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{vi ? 'Hình thức làm việc' : 'Work mode'}</label>
                  <Select
                    value={assignWorkMode}
                    onChange={setAssignWorkMode}
                    options={WORK_MODE_OPTIONS}
                  />
                </div>
              </div>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Edit modal — same 3 steps, prefilled */}
      {editing && (
        <ModalShell
          title={vi ? 'Sửa ca làm việc' : 'Edit shift'}
          subtitle={`${displayNameOf(editing.userId, editing.userName)} • ${formatDisplayDate(editing.workDate)}`}
          onClose={() => setEditing(null)}
          footer={
            <>
              <Button variant="secondary" className="flex-1 py-3 text-sm font-bold" onClick={() => setEditing(null)}>
                {vi ? 'Để sau' : 'Later'}
              </Button>
              <Button className="flex-[2] py-3 text-sm font-bold" disabled={updateMutation.isPending} onClick={() => void handleUpdate()}>
                {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {vi ? 'Xong — Lưu lại' : 'Done — Save'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-[var(--bg-tertiary)] px-4 py-3">
              <Avatar name={displayNameOf(editing.userId, editing.userName)} src={editing.userAvatar} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                  {displayNameOf(editing.userId, editing.userName)}
                </p>
                <p className="font-mono-code text-xs text-[var(--text-muted)]">
                  {editing.startTime}–{editing.endTime} • {formatDisplayDate(editing.workDate)}
                </p>
              </div>
            </div>
            <div>
              <FieldLabel step="1">{vi ? 'Đổi ngày (nếu cần)' : 'Change day (if needed)'}</FieldLabel>
              <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
            </div>
            <div>
              <FieldLabel step="2">{vi ? 'Đổi giờ' : 'Change hours'}</FieldLabel>
              <div className="mb-2 grid grid-cols-2 gap-1.5">
                {QUICK_SHIFTS.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => pickQuickShift(q.start, q.end, vi ? q.titleVi : q.titleEn, { setStart: setEditStart, setEnd: setEditEnd, setTitle: setEditTitle })}
                    className="rounded-xl border border-[var(--border-color)] px-2 py-2 text-xs font-bold text-[var(--text-secondary)] hover:border-sky-500 hover:text-sky-600"
                  >
                    {vi ? q.labelVi : q.labelEn}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Input label={vi ? 'Bắt đầu' : 'Start'} type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
                <Input label={vi ? 'Kết thúc' : 'End'} type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
              </div>
            </div>
            <div>
              <FieldLabel step="3">{vi ? 'Tên ca, trạng thái & điểm danh' : 'Name, status & attendance'}</FieldLabel>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder={vi ? 'Tên ca...' : 'Shift name...'} />
              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{vi ? 'Nơi làm' : 'Where'}</label>
                  <Select
                    value={editWorkMode}
                    onChange={setEditWorkMode}
                    options={[
                      { value: 'office', label: resolveWorkModeLabel('office') },
                      { value: 'remote', label: resolveWorkModeLabel('remote') },
                      { value: 'half_day', label: resolveWorkModeLabel('half_day') },
                    ]}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{t('table.status')}</label>
                  <Select
                    value={editStatus}
                    onChange={setEditStatus}
                    options={[
                      { value: 'published', label: t('schedules.published') },
                      { value: 'cancelled', label: t('schedules.cancelled') },
                    ]}
                  />
                </div>
              </div>
              <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{vi ? 'Điểm danh' : 'Attendance'}</label>
                  <Select
                    value={editAttendanceStatus}
                    onChange={setEditAttendanceStatus}
                    options={ATTENDANCE_STATUS_OPTIONS}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{vi ? 'Điểm check-in (≤ 1km)' : 'Check-in location'}</label>
                  <Select
                    value={editCheckInLocationId}
                    onChange={setEditCheckInLocationId}
                    options={CHECKIN_LOCATIONS.map((loc) => ({ value: loc.id, label: loc.shortName }))}
                  />
                </div>
              </div>
              <div className="mt-2.5">
                <Input
                  label={vi ? 'Ghi chú điểm danh' : 'Attendance note'}
                  value={editAttendanceNote}
                  onChange={(e) => setEditAttendanceNote(e.target.value)}
                  placeholder={vi ? 'Lý do đi muộn / về sớm...' : 'Late / early leave note...'}
                />
              </div>
              {(editing.checkInAt || editing.checkOutAt) && (
                <p className="mt-2 font-mono-code text-xs text-[var(--text-muted)]">
                  Check-in: {formatCheckTime(editing.checkInAt)} • Check-out: {formatCheckTime(editing.checkOutAt)}
                  {(editing.workedMinutes ?? 0) > 0 ? ` • Thực làm: ${formatHours(editing.workedMinutes ?? 0)}` : ''}
                  {(editing.lateMinutes ?? 0) > 0 ? ` • Đi trễ: ${editing.lateMinutes} phút` : ''}
                </p>
              )}
            </div>
          </div>
        </ModalShell>
      )}

      <ConfirmModal
        isOpen={Boolean(deleting)}
        title={vi ? 'Xoá ca này?' : 'Delete this shift?'}
        message={
          deleting
            ? vi
              ? `Ca của ${displayNameOf(deleting.userId, deleting.userName)} ngày ${formatDisplayDate(deleting.workDate)} (${deleting.startTime}–${deleting.endTime}) sẽ bị xoá. Bạn chắc chứ?`
              : `Shift of ${displayNameOf(deleting.userId, deleting.userName)} on ${formatDisplayDate(deleting.workDate)} will be deleted. Sure?`
            : t('schedules.deleteMessage')
        }
        type="danger"
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await removeMutation.mutateAsync(deleting.id);
            toast.success(t('schedules.deleteSuccess'));
          } catch (error) {
            toast.error(getErrorMessage(error, t('schedules.deleteFailed')));
          } finally {
            setDeleting(null);
          }
        }}
        onCancel={() => setDeleting(null)}
      />
      <ConfirmModal
        isOpen={Boolean(deletingTemplate)}
        title={t('schedules.deleteTemplateTitle')}
        message={t('schedules.deleteTemplateMessage')}
        type="danger"
        onConfirm={async () => {
          if (!deletingTemplate) return;
          try {
            await removeTemplateMutation.mutateAsync(deletingTemplate.id);
            toast.success(t('schedules.deleteSuccess'));
          } catch (error) {
            toast.error(getErrorMessage(error, t('schedules.deleteFailed')));
          } finally {
            setDeletingTemplate(null);
          }
        }}
        onCancel={() => setDeletingTemplate(null)}
      />
    </div>
  );
}
