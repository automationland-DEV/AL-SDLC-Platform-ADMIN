import { Fragment, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  CalendarClock,
  CalendarDays,
  Clock,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  Wand2,
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
  Table,
  TableCell,
  TableRow,
} from '../../../components/ui';
import { useDebounce } from '../../../hooks/useDebounce';
import { useTranslation } from '../../../i18n/useTranslation';
import { userService } from '../../../services/authService';
import {
  formatDisplayDate,
  resolveWorkModeLabel,
  todayIsoDate,
  WEEKDAY_LABELS,
  WORK_MODE_OPTIONS,
  type AdminWorkScheduleItem,
  type AdminWorkScheduleTemplate,
} from '../../../services/workScheduleService';
import {
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

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
      {children}
    </div>
  );
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

function getMonthKey(workDate: string): string {
  return workDate.slice(0, 7);
}

function getScheduleMinutes(item: AdminWorkScheduleItem): number {
  const [sh, sm] = item.startTime.split(':').map(Number);
  const [eh, em] = item.endTime.split(':').map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;
  return Math.max(0, eh * 60 + em - (sh * 60 + sm));
}

export default function WorkSchedulesPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<MainTab>('schedules');
  type ScheduleView = 'all' | 'user' | 'week' | 'month';

  // ─── Filters ───
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [filterUserId, setFilterUserId] = useState('');
  const [from, setFrom] = useState(todayIsoDate(-7));
  const [to, setTo] = useState(todayIsoDate(30));
  const [status, setStatus] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState('');
  const [scheduleView, setScheduleView] = useState<ScheduleView>('user');

  // ─── Assign modal ───
  const [showAssign, setShowAssign] = useState(false);
  const [assignMode, setAssignMode] = useState<'single' | 'bulk'>('single');
  const [assignUserId, setAssignUserId] = useState('');
  const [assignUserIds, setAssignUserIds] = useState<string[]>([]);
  const [assignDate, setAssignDate] = useState(todayIsoDate(1));
  const [assignStart, setAssignStart] = useState('08:00');
  const [assignEnd, setAssignEnd] = useState('17:00');
  const [assignTitle, setAssignTitle] = useState('');
  const [assignWorkMode, setAssignWorkMode] = useState('office');

  // ─── Edit modal ───
  const [editing, setEditing] = useState<AdminWorkScheduleItem | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editWorkMode, setEditWorkMode] = useState('office');

  // ─── Delete ───
  const [deleting, setDeleting] = useState<AdminWorkScheduleItem | null>(null);

  // ─── Templates ───
  const [templateUserId, setTemplateUserId] = useState('');
  const [templateWeekday, setTemplateWeekday] = useState('1');
  const [templateStart, setTemplateStart] = useState('08:00');
  const [templateEnd, setTemplateEnd] = useState('17:00');
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateWorkMode, setTemplateWorkMode] = useState('office');
  const [editingTemplate, setEditingTemplate] = useState<AdminWorkScheduleTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<AdminWorkScheduleTemplate | null>(null);

  // ─── Generate ───
  const [generateUserId, setGenerateUserId] = useState('');
  const [generateFrom, setGenerateFrom] = useState(todayIsoDate(0));
  const [generateTo, setGenerateTo] = useState(todayIsoDate(30));

  const { data: allUsers = [], isLoading: usersLoading } = useAllUsers();

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
    () => [{ value: '', label: t('schedules.allUsers') }, ...userOptions],
    [t, userOptions],
  );

  const listParams = useMemo(
    () => ({
      userId: filterUserId || undefined,
      from: from || undefined,
      to: to || undefined,
      status: status || undefined,
      workMode: workModeFilter || undefined,
      page,
      limit: 20,
    }),
    [filterUserId, from, to, status, workModeFilter, page],
  );

  const { data: listData, isLoading, isFetching, refetch } = useWorkSchedulesQuery(listParams);
  const schedules = useMemo(() => listData?.items ?? [], [listData]);
  const total = listData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / (listData?.limit ?? 20)));

  const userById = useMemo(() => {
    const map = new Map<string, (typeof allUsers)[number]>();
    (allUsers ?? []).forEach((u) => {
      if (u?.id) map.set(u.id, u);
    });
    return map;
  }, [allUsers]);

  const filteredSchedules = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase();
    if (!keyword) return schedules;
    return schedules.filter((item) => {
      const name = (item.userName || '').toLowerCase();
      return (
        name.includes(keyword) ||
        (item.title || '').toLowerCase().includes(keyword) ||
        item.workDate.includes(keyword)
      );
    });
  }, [schedules, debouncedSearch]);

  const sortedSchedules = useMemo(
    () =>
      filteredSchedules.slice().sort((a, b) => {
        if (a.workDate !== b.workDate) return a.workDate < b.workDate ? -1 : 1;
        if (a.startTime !== b.startTime) return a.startTime < b.startTime ? -1 : 1;
        return (a.userName || '').localeCompare(b.userName || '', 'vi');
      }),
    [filteredSchedules],
  );

  const schedulesByUser = useMemo(() => {
    const groups = new Map<string, { userId: string; displayName: string; items: AdminWorkScheduleItem[]; minutes: number }>();
    for (const item of sortedSchedules) {
      const displayName = item.userName || userById.get(item.userId)?.fullName || userById.get(item.userId)?.email || 'Nhân viên';
      if (!groups.has(item.userId)) {
        groups.set(item.userId, { userId: item.userId, displayName, items: [], minutes: 0 });
      }
      const group = groups.get(item.userId)!;
      group.items.push(item);
      group.minutes += getScheduleMinutes(item);
    }
    return [...groups.values()].sort((a, b) => a.displayName.localeCompare(b.displayName, 'vi'));
  }, [sortedSchedules, userById]);

  const schedulesByWeek = useMemo(() => {
    const groups = new Map<string, { weekStart: string; weekEnd: string; items: AdminWorkScheduleItem[]; minutes: number }>();
    for (const item of sortedSchedules) {
      const weekStart = getWeekStartIso(item.workDate);
      const weekEnd = addDaysIso(weekStart, 6);
      if (!groups.has(weekStart)) groups.set(weekStart, { weekStart, weekEnd, items: [], minutes: 0 });
      const group = groups.get(weekStart)!;
      group.items.push(item);
      group.minutes += getScheduleMinutes(item);
    }
    return [...groups.values()].sort((a, b) => (a.weekStart < b.weekStart ? -1 : 1));
  }, [sortedSchedules]);

  const schedulesByMonth = useMemo(() => {
    const groups = new Map<string, { monthKey: string; items: AdminWorkScheduleItem[]; minutes: number }>();
    for (const item of sortedSchedules) {
      const monthKey = getMonthKey(item.workDate);
      if (!groups.has(monthKey)) groups.set(monthKey, { monthKey, items: [], minutes: 0 });
      const group = groups.get(monthKey)!;
      group.items.push(item);
      group.minutes += getScheduleMinutes(item);
    }
    return [...groups.values()].sort((a, b) => (a.monthKey < b.monthKey ? -1 : 1));
  }, [sortedSchedules]);

  const totalMinutes = useMemo(
    () => sortedSchedules.reduce((sum, item) => sum + getScheduleMinutes(item), 0),
    [sortedSchedules],
  );

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

  const userNameOf = (item: AdminWorkScheduleItem) => item.userName || '—';

  const openEdit = (item: AdminWorkScheduleItem) => {
    setEditing(item);
    setEditDate(item.workDate);
    setEditStart(item.startTime);
    setEditEnd(item.endTime);
    setEditTitle(item.title || '');
    setEditStatus(item.status);
    setEditWorkMode(item.workMode || 'office');
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
          workMode: assignWorkMode || undefined,
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
          workMode: assignWorkMode || undefined,
        });
        toast.success(t('schedules.bulkSuccess', { count: result.length }));
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
        },
      });
      toast.success(t('schedules.updateSuccess'));
      setEditing(null);
    } catch (error) {
      toast.error(getErrorMessage(error, t('schedules.updateFailed')));
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

  const tabs: Array<{ id: MainTab; label: string; icon: typeof CalendarDays }> = [
    { id: 'schedules', label: `${t('schedules.tabSchedules')} (${total})`, icon: CalendarDays },
    { id: 'templates', label: t('schedules.tabTemplates'), icon: Clock },
    { id: 'generate', label: t('schedules.tabGenerate'), icon: Wand2 },
  ];

  const statusBadge = (value: string) =>
    value === 'published' ? (
      <Badge variant="success">{t('schedules.published')}</Badge>
    ) : (
      <Badge variant="danger">{t('schedules.cancelled')}</Badge>
    );

  const workModeBadge = (value?: string | null) => (
    <Badge variant="info">{resolveWorkModeLabel(value)}</Badge>
  );

  const renderScheduleRow = (item: AdminWorkScheduleItem) => (
    <TableRow key={item.id}>
      <TableCell>
        <div className="flex items-center gap-2.5">
          {item.userAvatar ? (
            <img src={item.userAvatar} alt="" className="h-8 w-8 rounded-lg border border-[var(--border-color)] object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-xs font-bold text-sky-500">
              {(item.userName || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs font-semibold">{userNameOf(item)}</span>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-xs font-semibold">{formatDisplayDate(item.workDate)}</span>
        <span className="ml-2 rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5 font-mono-code text-[10px] text-[var(--text-muted)]">
          {item.source === 'template' ? t('schedules.fromTemplate') : t('schedules.manual')}
        </span>
      </TableCell>
      <TableCell className="font-mono-code text-xs">
        {item.startTime} - {item.endTime}
      </TableCell>
      <TableCell className="max-w-[220px] truncate text-xs text-[var(--text-secondary)]">
        {item.title || '—'}
      </TableCell>
      <TableCell>{workModeBadge(item.workMode)}</TableCell>
      <TableCell>{statusBadge(item.status)}</TableCell>
      <TableCell>
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => openEdit(item)}
            title={t('common.edit')}
            className="cursor-pointer rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-sky-500"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeleting(item)}
            title={t('common.delete')}
            className="cursor-pointer rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-rose-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="flex h-full min-h-0 flex-col font-sans">
      <PageHeader
        breadcrumbs={[{ label: 'Admin' }, { label: t('schedules.title') }]}
        title={t('schedules.title')}
        subtitle={t('schedules.subtitle', { count: total })}
        actions={
          <>
            <Button variant="secondary" onClick={() => void refetch()} disabled={isFetching}>
              {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {t('common.refresh')}
            </Button>
            <Button onClick={() => setShowAssign(true)}>
              <Plus className="h-3.5 w-3.5" />
              {t('schedules.assign')}
            </Button>
          </>
        }
      />

      {/* Tabs */}
      <div className="mb-4 flex w-fit items-center gap-1 rounded-lg bg-[var(--bg-tertiary)] p-1">
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-colors ${
                tab === item.id
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === 'schedules' && (
        <SectionCard>
          <div className="grid grid-cols-1 gap-2.5 border-b border-[var(--border-color)] p-3 md:grid-cols-12">
            <div className="relative md:col-span-3">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder={t('schedules.searchPlaceholder')}
                className="pl-9"
              />
            </div>
            <div className="md:col-span-2">
              <SearchableSelect
                options={filterUserOptions}
                value={filterUserId}
                onChange={(v) => {
                  setFilterUserId(v);
                  setPage(1);
                }}
                placeholder={t('schedules.allUsers')}
              />
            </div>
            <div className="flex items-center gap-2 md:col-span-3">
              <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
              <span className="text-xs text-[var(--text-muted)]">→</span>
              <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
            </div>
            <div className="md:col-span-2">
              <Select
                value={status}
                onChange={(v) => {
                  setStatus(v);
                  setPage(1);
                }}
                options={[
                  { value: '', label: t('schedules.allStatus') },
                  { value: 'published', label: t('schedules.published') },
                  { value: 'cancelled', label: t('schedules.cancelled') },
                ]}
              />
            </div>
            <div className="md:col-span-2">
              <Select
                value={workModeFilter}
                onChange={(v) => {
                  setWorkModeFilter(v);
                  setPage(1);
                }}
                options={[
                  { value: '', label: t('schedules.allWorkModes') },
                  ...WORK_MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
                ]}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-color)] px-3 py-2.5">
            <div className="flex w-fit items-center gap-1 rounded-lg bg-[var(--bg-tertiary)] p-1">
              {(
                [
                  { id: 'user', label: t('schedules.viewUser') },
                  { id: 'week', label: t('schedules.viewWeek') },
                  { id: 'month', label: t('schedules.viewMonth') },
                  { id: 'all', label: t('schedules.viewAll') },
                ] as Array<{ id: ScheduleView; label: string }>
              ).map((view) => (
                <button
                  key={view.id}
                  onClick={() => setScheduleView(view.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    scheduleView === view.id
                      ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </div>
            <p className="font-mono-code text-xs text-[var(--text-muted)]">
              {sortedSchedules.length} ca • {(totalMinutes / 60).toFixed(1)} giờ
            </p>
          </div>

          <Table
            headers={[
              t('schedules.colUser'),
              t('schedules.colDate'),
              t('schedules.colTime'),
              t('schedules.colShift'),
              t('schedules.colWorkMode'),
              t('schedules.colStatus'),
              { label: t('table.actions'), align: 'center' },
            ]}
          >
            {isLoading ? null : sortedSchedules.length === 0 ? (
              <TableRow key="empty">
                <TableCell colSpan={7}>
                  <div className="flex flex-col items-center gap-2 py-14 text-center">
                    <CalendarClock className="h-8 w-8 text-[var(--text-muted)]" />
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{t('schedules.emptyTitle')}</p>
                    <p className="text-xs text-[var(--text-muted)]">{t('schedules.emptyHint')}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : scheduleView === 'all' ? (
              sortedSchedules.map((item) => renderScheduleRow(item))
            ) : scheduleView === 'user' ? (
              schedulesByUser.map((group) => (
                <Fragment key={group.userId}>
                  <TableRow key={`${group.userId}-header`}>
                    <TableCell colSpan={7}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[var(--text-primary)]">{group.displayName}</span>
                        <span className="font-mono-code text-[11px] text-[var(--text-muted)]">
                          {group.items.length} ca • {(group.minutes / 60).toFixed(1)} giờ
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                  {group.items.map((item) => renderScheduleRow(item))}
                </Fragment>
              ))
            ) : scheduleView === 'week' ? (
              schedulesByWeek.map((group) => (
                <Fragment key={group.weekStart}>
                  <TableRow key={`${group.weekStart}-header`}>
                    <TableCell colSpan={7}>
                      <div className="flex flex-wrap items-center gap-2">
                        <CalendarDays className="h-3.5 w-3.5 text-sky-500" />
                        <span className="text-xs font-bold text-[var(--text-primary)]">
                          Tuần {formatDisplayDate(group.weekStart)} → {formatDisplayDate(group.weekEnd)}
                        </span>
                        <span className="font-mono-code text-[11px] text-[var(--text-muted)]">
                          {group.items.length} ca • {(group.minutes / 60).toFixed(1)} giờ
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                  {group.items.map((item) => renderScheduleRow(item))}
                </Fragment>
              ))
            ) : (
              schedulesByMonth.map((group) => (
                <Fragment key={group.monthKey}>
                  <TableRow key={`${group.monthKey}-header`}>
                    <TableCell colSpan={7}>
                      <div className="flex flex-wrap items-center gap-2">
                        <CalendarDays className="h-3.5 w-3.5 text-sky-500" />
                        <span className="text-xs font-bold text-[var(--text-primary)]">Tháng {group.monthKey}</span>
                        <span className="font-mono-code text-[11px] text-[var(--text-muted)]">
                          {group.items.length} ca • {(group.minutes / 60).toFixed(1)} giờ
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                  {group.items.map((item) => renderScheduleRow(item))}
                </Fragment>
              ))
            )}
          </Table>

          {!isLoading && sortedSchedules.length === 0 && null}

          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-14 text-xs text-[var(--text-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('common.loading')}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-[var(--border-color)] px-4 py-3">
            <p className="font-mono-code text-xs text-[var(--text-muted)]">
              {t('documents.page')} {page} / {totalPages} ({t('documents.total')} {total} {t('documents.records')})
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                {t('documents.prevPage')}
              </Button>
              <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                {t('documents.nextPage')}
              </Button>
            </div>
          </div>
        </SectionCard>
      )}

      {tab === 'templates' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SectionCard>
            <div className="border-b border-[var(--border-color)] p-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {editingTemplate ? t('schedules.editTemplate') : t('schedules.newTemplate')}
              </h3>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">{t('schedules.templateHint')}</p>
            </div>
            <div className="space-y-3 p-4">
              {!editingTemplate && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    {t('schedules.colUser')}
                  </label>
                  <SearchableSelect
                    options={userOptions}
                    value={templateUserId}
                    onChange={setTemplateUserId}
                    placeholder={t('schedules.pickUser')}
                  />
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  {t('schedules.colWeekday')}
                </label>
                <Select
                  value={templateWeekday}
                  onChange={setTemplateWeekday}
                  options={[1, 2, 3, 4, 5, 6, 0].map((d) => ({ value: String(d), label: WEEKDAY_LABELS[d] }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Input label={t('schedules.colStart')} type="time" value={templateStart} onChange={(e) => setTemplateStart(e.target.value)} />
                <Input label={t('schedules.colEnd')} type="time" value={templateEnd} onChange={(e) => setTemplateEnd(e.target.value)} />
              </div>
              <Input
                label={t('schedules.colShift')}
                value={templateTitle}
                onChange={(e) => setTemplateTitle(e.target.value)}
                placeholder={t('schedules.shiftPlaceholder')}
              />
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  {t('schedules.colWorkMode')}
                </label>
                <Select
                  value={templateWorkMode}
                  onChange={setTemplateWorkMode}
                  options={WORK_MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
                />
              </div>
              <div className="flex gap-2 pt-1">
                {editingTemplate && (
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      setEditingTemplate(null);
                      setTemplateTitle('');
                      setTemplateWorkMode('office');
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                )}
                <Button
                  className="flex-1"
                  disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                  onClick={() => void handleSaveTemplate()}
                >
                  {(createTemplateMutation.isPending || updateTemplateMutation.isPending) && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  {t('common.save')}
                </Button>
              </div>
            </div>
          </SectionCard>

          <div className="lg:col-span-2">
            <SectionCard>
              <div className="flex flex-wrap items-center gap-2.5 border-b border-[var(--border-color)] p-3">
                <div className="min-w-[220px] flex-1">
                  <SearchableSelect
                    options={filterUserOptions}
                    value={templateUserId}
                    onChange={setTemplateUserId}
                    placeholder={t('schedules.allUsers')}
                  />
                </div>
                <span className="font-mono-code text-xs text-[var(--text-muted)]">
                  {templates.length} {t('schedules.templateUnit')}
                </span>
              </div>
              {templatesQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-14 text-xs text-[var(--text-muted)]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('common.loading')}
                </div>
              ) : templates.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-14 text-center">
                  <Clock className="h-8 w-8 text-[var(--text-muted)]" />
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{t('schedules.noTemplate')}</p>
                  <p className="text-xs text-[var(--text-muted)]">{t('schedules.noTemplateHint')}</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-color)]">
                  {templates.map((tpl) => (
                    <div key={tpl.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-xs font-bold text-sky-500">
                        {WEEKDAY_LABELS[tpl.weekday]?.charAt(0) ?? '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-[var(--text-primary)]">
                          {WEEKDAY_LABELS[tpl.weekday]} · {tpl.startTime} - {tpl.endTime} · {resolveWorkModeLabel(tpl.workMode)}
                        </p>
                        <p className="truncate text-[11px] text-[var(--text-muted)]">
                          {tpl.userName || ''} {tpl.title ? `· ${tpl.title}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          updateTemplateMutation.mutate(
                            { id: tpl.id, payload: { isActive: !tpl.isActive } },
                            { onError: (e) => toast.error(getErrorMessage(e, t('schedules.templateSaveFailed'))) },
                          )
                        }
                        className={`relative h-5.5 w-10 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors ${
                          tpl.isActive ? 'bg-emerald-500' : 'bg-[var(--border-color)]'
                        }`}
                        style={{ height: 22 }}
                        title={tpl.isActive ? t('schedules.active') : t('schedules.inactive')}
                      >
                        <span
                          className={`block h-[18px] w-[18px] rounded-full bg-white shadow transition-transform ${
                            tpl.isActive ? 'translate-x-[18px]' : 'translate-x-0'
                          }`}
                        />
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
                        className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-sky-500"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingTemplate(tpl)}
                        className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      )}

      {tab === 'generate' && (
        <SectionCard>
          <div className="border-b border-[var(--border-color)] p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
              <Users className="h-4 w-4 text-sky-500" />
              {t('schedules.generateTitle')}
            </h3>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">{t('schedules.generateHint')}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                {t('schedules.colUser')}
              </label>
              <SearchableSelect
                options={userOptions}
                value={generateUserId}
                onChange={setGenerateUserId}
                placeholder={t('schedules.pickUser')}
              />
            </div>
            <Input label={t('schedules.colFrom')} type="date" value={generateFrom} onChange={(e) => setGenerateFrom(e.target.value)} />
            <Input label={t('schedules.colTo')} type="date" value={generateTo} onChange={(e) => setGenerateTo(e.target.value)} />
          </div>
          <div className="flex justify-end border-t border-[var(--border-color)] p-4">
            <Button disabled={generateMutation.isPending || !generateUserId} onClick={() => void handleGenerate()}>
              {generateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
              {t('schedules.generateNow')}
            </Button>
          </div>
        </SectionCard>
      )}

      {/* ─── Assign modal ─── */}
      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onClick={() => setShowAssign(false)}>
          <div
            className="w-full max-w-md rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-[var(--border-color)] p-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">{t('schedules.assignTitle')}</h3>
            </div>
            <div className="space-y-3 p-4">
              <div className="flex gap-1 rounded-lg bg-[var(--bg-tertiary)] p-1">
                {(
                  [
                    { id: 'single', label: t('schedules.single') },
                    { id: 'bulk', label: t('schedules.bulk') },
                  ] as Array<{ id: 'single' | 'bulk'; label: string }>
                ).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setAssignMode(m.id)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold ${
                      assignMode === m.id
                        ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs'
                        : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {assignMode === 'single' ? (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    {t('schedules.colUser')}
                  </label>
                  <SearchableSelect
                    options={userOptions}
                    value={assignUserId}
                    onChange={setAssignUserId}
                    placeholder={t('schedules.pickUser')}
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    {t('schedules.pickedCount', { count: assignUserIds.length })}
                  </label>
                  <MultiSearchableSelect options={userOptions} values={assignUserIds} onChange={setAssignUserIds} placeholder={t('schedules.pickUser')} />
                </div>
              )}

              <Input label={t('schedules.colDate')} type="date" value={assignDate} onChange={(e) => setAssignDate(e.target.value)} />
              <div className="grid grid-cols-2 gap-2.5">
                <Input label={t('schedules.colStart')} type="time" value={assignStart} onChange={(e) => setAssignStart(e.target.value)} />
                <Input label={t('schedules.colEnd')} type="time" value={assignEnd} onChange={(e) => setAssignEnd(e.target.value)} />
              </div>
              <Input
                label={t('schedules.colShift')}
                value={assignTitle}
                onChange={(e) => setAssignTitle(e.target.value)}
                placeholder={t('schedules.shiftPlaceholder')}
              />
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  {t('schedules.colWorkMode')}
                </label>
                <Select
                  value={assignWorkMode}
                  onChange={setAssignWorkMode}
                  options={WORK_MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="secondary" className="flex-1" onClick={() => setShowAssign(false)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  className="flex-1"
                  disabled={assignMutation.isPending || bulkAssignMutation.isPending || usersLoading}
                  onClick={() => void handleAssign()}
                >
                  {(assignMutation.isPending || bulkAssignMutation.isPending) && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  {t('schedules.assign')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit modal ─── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onClick={() => setEditing(null)}>
          <div
            className="w-full max-w-md rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-[var(--border-color)] p-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">{t('schedules.editTitle')}</h3>
            </div>
            <div className="space-y-3 p-4">
              <Input label={t('schedules.colDate')} type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
              <div className="grid grid-cols-2 gap-2.5">
                <Input label={t('schedules.colStart')} type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
                <Input label={t('schedules.colEnd')} type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
              </div>
              <Input label={t('schedules.colShift')} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  {t('schedules.colWorkMode')}
                </label>
                <Select
                  value={editWorkMode}
                  onChange={setEditWorkMode}
                  options={WORK_MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  {t('table.status')}
                </label>
                <Select
                  value={editStatus}
                  onChange={setEditStatus}
                  options={[
                    { value: 'published', label: t('schedules.published') },
                    { value: 'cancelled', label: t('schedules.cancelled') },
                  ]}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="secondary" className="flex-1" onClick={() => setEditing(null)}>
                  {t('common.cancel')}
                </Button>
                <Button className="flex-1" disabled={updateMutation.isPending} onClick={() => void handleUpdate()}>
                  {updateMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {t('common.save')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete confirms ─── */}
      <ConfirmModal
        isOpen={Boolean(deleting)}
        title={t('schedules.deleteTitle')}
        message={t('schedules.deleteMessage')}
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
