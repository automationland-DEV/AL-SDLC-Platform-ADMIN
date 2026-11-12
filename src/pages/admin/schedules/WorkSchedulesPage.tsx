import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CalendarDays, Layers, Loader2, Plus, Sparkles, Wand2 } from 'lucide-react';
import { Button, ConfirmModal, PageHeader } from '../../../components/ui';
import { useDebounce } from '../../../hooks/useDebounce';
import { useTranslation } from '../../../i18n/useTranslation';
import { userService } from '../../../services/authService';
import {
  CHECKIN_LOCATIONS,
  formatDisplayDate,
  todayIsoDate,
  workScheduleService,
  type AdminWorkScheduleItem,
  type AdminWorkScheduleTemplate,
  type AvailabilityResult,
  type WeeklySummaryUser,
} from '../../../services/workScheduleService';
import {
  useAdminCheckInScheduleMutation,
  useAdminCheckOutScheduleMutation,
  useAssignScheduleMutation,
  useBulkAssignScheduleMutation,
  useCopyWeekMutation,
  useCreateWorkScheduleTemplateMutation,
  useGenerateSchedulesMutation,
  useRemoveScheduleMutation,
  useRemoveTemplateMutation,
  useUpdateScheduleMutation,
  useUpdateWorkScheduleTemplateMutation,
  useWorkScheduleTemplatesQuery,
  useWorkSchedulesQuery,
} from '../../../hooks/queries/useWorkSchedulesQuery';
import type { User } from '../../../types';
import AssignShiftModal, { type AssignShiftForm, type AssignShiftSeed } from './components/AssignShiftModal';
import ByMonthView from './components/ByMonthView';
import ByStaffView from './components/ByStaffView';
import EditShiftModal, { type EditShiftForm } from './components/EditShiftModal';
import GenerateTab from './components/GenerateTab';
import ScheduleFilterBar, {
  type ScheduleFilterState,
  type ScheduleViewMode,
} from './components/ScheduleFilterBar';
import SmartToolsTab from './components/SmartToolsTab';
import TableView from './components/TableView';
import TemplatesTab, { type TemplateForm } from './components/TemplatesTab';
import WeekView from './components/WeekView';
import { EmptyState, type StaffOption } from './lib/schedule-ui';
import {
  addDaysIso,
  collectConflictIds,
  getScheduleMinutes,
  getWeekStartIso,
  groupSchedulesByMonth,
  groupSchedulesByUser,
  sortShifts,
} from './lib/schedule-utils';

type MainTab = 'schedules' | 'templates' | 'generate' | 'smart';

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

/**
 * Lấy toàn bộ nhân viên để điền các ô chọn người.
 * Backend giới hạn 100 bản ghi mỗi trang nên phải gom nhiều trang.
 */
function useAllUsers() {
  return useQuery({
    queryKey: ['users', 'select-all'],
    queryFn: async () => {
      const collected: User[] = [];
      const pageSize = 100;
      let page = 1;
      let hasMore = true;

      while (hasMore && page <= 20) {
        const res = await userService.getAllUsers({ limit: pageSize, page });
        const items = res.data ?? [];
        collected.push(...items);
        const total = res.total ?? collected.length;
        hasMore = collected.length < total && items.length > 0;
        page += 1;
      }

      return collected;
    },
    staleTime: 1000 * 60 * 5,
  });
}

const DEFAULT_FILTERS: ScheduleFilterState = {
  search: '',
  userId: '',
  from: todayIsoDate(-7),
  to: todayIsoDate(30),
  status: '',
  attendanceStatus: '',
  workMode: '',
};

export default function WorkSchedulesPage() {
  const { t, language } = useTranslation();
  const vi = language === 'vi';

  const [tab, setTab] = useState<MainTab>('schedules');
  const [filters, setFilters] = useState<ScheduleFilterState>(DEFAULT_FILTERS);
  const [view, setView] = useState<ScheduleViewMode>('week');
  const [weekAnchor, setWeekAnchor] = useState(() => getWeekStartIso(todayIsoDate(0)));
  const todayIso = todayIsoDate(0);

  const debouncedSearch = useDebounce(filters.search, 400);

  // ─── Templates ─────────────────────────────────────────────────────────────
  const [templateFilterUserId, setTemplateFilterUserId] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<AdminWorkScheduleTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<AdminWorkScheduleTemplate | null>(null);

  // ─── Smart tools ────────────────────────────────────────────────────────────
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummaryUser[]>([]);
  const [isFetchingSummary, setIsFetchingSummary] = useState(false);
  const [isCopyingWeek, setIsCopyingWeek] = useState(false);

  // ─── Modals ────────────────────────────────────────────────────────────────
  const [showAssign, setShowAssign] = useState(false);
  const [assignSeed, setAssignSeed] = useState({
    userId: '',
    workDate: todayIsoDate(1),
    startTime: '08:30',
    endTime: '17:00',
    title: '',
    workMode: 'office',
  });
  const [editing, setEditing] = useState<AdminWorkScheduleItem | null>(null);
  const [deleting, setDeleting] = useState<AdminWorkScheduleItem | null>(null);

  const { data: allUsers = [] } = useAllUsers();

  const staffOptions = useMemo<StaffOption[]>(
    () =>
      (allUsers ?? []).map((user: User) => ({
        value: user.id,
        label: user.fullName || user.email,
        email: user.email,
        avatar: user.avatar,
        avatarFrame: user.avatarFrame,
      })),
    [allUsers],
  );

  const userById = useMemo(() => {
    const map = new Map<string, User>();
    (allUsers ?? []).forEach((user: User) => {
      if (user?.id) map.set(user.id, user);
    });
    return map;
  }, [allUsers]);

  const displayNameOf = useCallback(
    (userId: string, fallback?: string) =>
      fallback ||
      userById.get(userId)?.fullName ||
      userById.get(userId)?.email ||
      (vi ? 'Nhân viên' : 'Staff'),
    [userById, vi],
  );

  const lookupStaff = useCallback(
    (userId: string) => {
      const user = userById.get(userId);
      if (!user) return undefined;
      return { email: user.email, avatar: user.avatar };
    },
    [userById],
  );

  // ─── Data ──────────────────────────────────────────────────────────────────
  const { data: listData, isLoading, isFetching, refetch } = useWorkSchedulesQuery({
    userId: filters.userId || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
    status: filters.status || undefined,
    workMode: filters.workMode || undefined,
    attendanceStatus: filters.attendanceStatus || undefined,
    page: 1,
    limit: 200,
  });

  const templatesQuery = useWorkScheduleTemplatesQuery(templateFilterUserId || undefined);
  const templates = templatesQuery.data ?? [];

  const schedules = useMemo(() => listData?.items ?? [], [listData]);

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

  const sortedSchedules = useMemo(() => sortShifts(filteredSchedules), [filteredSchedules]);
  const conflictIds = useMemo(() => collectConflictIds(sortedSchedules), [sortedSchedules]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDaysIso(weekAnchor, i)),
    [weekAnchor],
  );
  const weekEnd = weekDays[6];

  const totalMinutes = useMemo(
    () => sortedSchedules.reduce((sum, item) => sum + getScheduleMinutes(item), 0),
    [sortedSchedules],
  );
  const staffCount = useMemo(
    () => new Set(sortedSchedules.map((shift) => shift.userId)).size,
    [sortedSchedules],
  );

  const groupsByUser = useMemo(
    () => groupSchedulesByUser(sortedSchedules, displayNameOf, lookupStaff),
    [sortedSchedules, displayNameOf, lookupStaff],
  );
  const groupsByMonth = useMemo(
    () =>
      groupSchedulesByMonth(sortedSchedules, (monthKey) => {
        const [year, month] = monthKey.split('-');
        return vi ? `Tháng ${month}/${year}` : `Month ${month}/${year}`;
      }),
    [sortedSchedules, vi],
  );

  // ─── Mutations ─────────────────────────────────────────────────────────────
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
  const copyWeekMutation = useCopyWeekMutation();

  const attendancePendingIds = useMemo(() => {
    const ids = new Set<string>();
    if (checkInMutation.isPending && checkInMutation.variables?.id) {
      ids.add(checkInMutation.variables.id);
    }
    if (checkOutMutation.isPending && checkOutMutation.variables?.id) {
      ids.add(checkOutMutation.variables.id);
    }
    return ids;
  }, [
    checkInMutation.isPending,
    checkInMutation.variables,
    checkOutMutation.isPending,
    checkOutMutation.variables,
  ]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleFilterChange = useCallback((patch: Partial<ScheduleFilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleJumpWeek = useCallback((targetStartIso: string) => {
    const start = getWeekStartIso(targetStartIso);
    const end = addDaysIso(start, 6);
    setWeekAnchor(start);
    setFilters((prev) => {
      const next = { ...prev };
      if (!next.from || start < next.from) next.from = start;
      if (!next.to || end > next.to) next.to = end;
      return next;
    });
  }, []);

  const openQuickAssign = useCallback((dateIso?: string, userId?: string) => {
    setAssignSeed((prev) => ({
      ...prev,
      workDate: dateIso ?? prev.workDate,
      userId: userId ?? prev.userId,
      title: '',
    }));
    setShowAssign(true);
  }, []);

  const openEdit = useCallback((item: AdminWorkScheduleItem) => {
    setEditing(item);
  }, []);

  const handleAssign = useCallback(
    async (form: AssignShiftForm) => {
      try {
        if (form.mode === 'bulk') {
          if (form.userIds.length === 0) {
            toast.error(t('schedules.pickUser'));
            return;
          }
          const result = await bulkAssignMutation.mutateAsync({
            userIds: form.userIds,
            workDate: form.workDate,
            startTime: form.startTime,
            endTime: form.endTime,
            title: form.title.trim() || undefined,
            workMode: form.workMode || 'office',
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
        } else {
          if (!form.userId) {
            toast.error(t('schedules.pickUser'));
            return;
          }
          await assignMutation.mutateAsync({
            userId: form.userId,
            workDate: form.workDate,
            startTime: form.startTime,
            endTime: form.endTime,
            title: form.title.trim() || undefined,
            workMode: form.workMode || 'office',
          });
          toast.success(t('schedules.assignSuccess'));
        }
        setShowAssign(false);
        void refetch();
      } catch (error) {
        toast.error(getErrorMessage(error, t('schedules.assignFailed')));
      }
    },
    [assignMutation, bulkAssignMutation, refetch, t, vi],
  );

  const handleUpdate = useCallback(
    async (form: EditShiftForm) => {
      if (!editing) return;
      try {
        await updateMutation.mutateAsync({
          id: editing.id,
          payload: {
            workDate: form.workDate || undefined,
            startTime: form.startTime || undefined,
            endTime: form.endTime || undefined,
            title: form.title,
            status: form.status || undefined,
            workMode: form.workMode || undefined,
            attendanceStatus: form.attendanceStatus || undefined,
            attendanceNote: form.attendanceNote,
            checkInLocationId: form.checkInLocationId || undefined,
          },
        });
        toast.success(t('schedules.updateSuccess'));
        setEditing(null);
      } catch (error) {
        toast.error(getErrorMessage(error, t('schedules.updateFailed')));
      }
    },
    [editing, updateMutation, t],
  );

  const handleCheckIn = useCallback(
    async (item: AdminWorkScheduleItem) => {
      try {
        await checkInMutation.mutateAsync({ id: item.id });
        toast.success(vi ? 'Đã check-in ca làm việc' : 'Checked in shift');
      } catch (error) {
        toast.error(getErrorMessage(error, vi ? 'Không thể check-in' : 'Check-in failed'));
      }
    },
    [checkInMutation, vi],
  );

  const handleCheckOut = useCallback(
    async (item: AdminWorkScheduleItem) => {
      try {
        await checkOutMutation.mutateAsync({ id: item.id });
        toast.success(vi ? 'Đã check-out ca làm việc' : 'Checked out shift');
      } catch (error) {
        toast.error(getErrorMessage(error, vi ? 'Không thể check-out' : 'Check-out failed'));
      }
    },
    [checkOutMutation, vi],
  );

  const handleSaveTemplate = useCallback(
    async (form: TemplateForm) => {
      const targetUserId = editingTemplate ? editingTemplate.userId : form.userId;
      if (!targetUserId) {
        toast.error(t('schedules.pickUser'));
        return;
      }
      try {
        if (editingTemplate) {
          await updateTemplateMutation.mutateAsync({
            id: editingTemplate.id,
            payload: {
              weekday: form.weekday,
              startTime: form.startTime,
              endTime: form.endTime,
              title: form.title.trim() || undefined,
              workMode: form.workMode || undefined,
            },
          });
          toast.success(t('schedules.templateUpdateSuccess'));
        } else {
          await createTemplateMutation.mutateAsync({
            userId: targetUserId,
            weekday: form.weekday,
            startTime: form.startTime,
            endTime: form.endTime,
            title: form.title.trim() || undefined,
            workMode: form.workMode || undefined,
          });
          toast.success(t('schedules.templateCreateSuccess'));
        }
        setEditingTemplate(null);
      } catch (error) {
        toast.error(getErrorMessage(error, t('schedules.templateSaveFailed')));
      }
    },
    [createTemplateMutation, editingTemplate, t, updateTemplateMutation],
  );

  const handleToggleTemplate = useCallback(
    (template: AdminWorkScheduleTemplate) => {
      updateTemplateMutation.mutate(
        { id: template.id, payload: { isActive: !template.isActive } },
        {
          onError: (error) =>
            toast.error(getErrorMessage(error, t('schedules.templateSaveFailed'))),
        },
      );
    },
    [t, updateTemplateMutation],
  );

  const handleGenerate = useCallback(
    async (payload: { userId: string; from: string; to: string }) => {
      if (!payload.userId) {
        toast.error(t('schedules.pickUser'));
        return;
      }
      try {
        const result = await generateMutation.mutateAsync(payload);
        toast.success(
          t('schedules.generateSuccess', { created: result.created, skipped: result.skipped }),
        );
      } catch (error) {
        toast.error(getErrorMessage(error, t('schedules.generateFailed')));
      }
    },
    [generateMutation, t],
  );

  const handleCheckAvailability = useCallback(
    async (params: { userId: string; workDate: string; durationMinutes: number }) => {
      if (!params.userId) {
        toast.error(vi ? 'Vui lòng chọn nhân viên' : 'Please select staff');
        return;
      }
      setIsCheckingAvailability(true);
      try {
        const result = await workScheduleService.availability(params);
        setAvailability(result);
        toast.success(vi ? 'Đã tìm thấy khung giờ' : 'Slots found');
      } catch (error) {
        toast.error(getErrorMessage(error, vi ? 'Không kiểm tra được giờ rảnh' : 'Check failed'));
      } finally {
        setIsCheckingAvailability(false);
      }
    },
    [vi],
  );

  const handleFetchSummary = useCallback(
    async (params: { userId: string; from: string; to: string }) => {
      setIsFetchingSummary(true);
      try {
        const result = await workScheduleService.weeklySummary({
          from: params.from,
          to: params.to,
          userId: params.userId || undefined,
        });
        setWeeklySummary(result);
        toast.success(vi ? 'Đã tổng hợp dữ liệu tuần' : 'Summary loaded');
      } catch (error) {
        toast.error(getErrorMessage(error, vi ? 'Không tổng hợp được dữ liệu' : 'Summary failed'));
      } finally {
        setIsFetchingSummary(false);
      }
    },
    [vi],
  );

  const handleCopyWeek = useCallback(
    async (params: {
      fromWeekStart: string;
      toWeekStart: string;
      userId: string;
      overwrite: boolean;
    }) => {
      setIsCopyingWeek(true);
      try {
        const result = await copyWeekMutation.mutateAsync({
          fromWeekStart: params.fromWeekStart,
          toWeekStart: params.toWeekStart,
          userId: params.userId || undefined,
          overwrite: params.overwrite,
        });
        toast.success(
          vi
            ? `Đã sao chép thành công ${result.created} ca làm việc!`
            : `Copied ${result.created} shifts successfully!`,
        );
        if (result.skipped > 0) {
          toast(
            vi
              ? `Bỏ qua ${result.skipped} ca bị trùng giờ`
              : `Skipped ${result.skipped} conflicting shifts`,
            { icon: 'ℹ️' },
          );
        }
      } catch (error) {
        toast.error(getErrorMessage(error, vi ? 'Sao chép tuần thất bại' : 'Copy failed'));
      } finally {
        setIsCopyingWeek(false);
      }
    },
    [copyWeekMutation, vi],
  );

  const handleAssignSuggestion = useCallback(
    (params: { userId: string; workDate: string; startTime: string; endTime: string }) => {
      setAssignSeed((prev) => ({
        ...prev,
        userId: params.userId,
        workDate: params.workDate,
        startTime: params.startTime,
        endTime: params.endTime,
        title: '',
      }));
      setShowAssign(true);
    },
    [],
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  const tabs: Array<{ id: MainTab; label: string; hint: string; icon: typeof CalendarDays }> = [
    {
      id: 'schedules',
      label: vi ? 'Lịch làm việc' : 'Schedule',
      hint: vi ? 'Xem và gán ca' : 'View & assign',
      icon: CalendarDays,
    },
    {
      id: 'templates',
      label: vi ? 'Ca mẫu lặp lại' : 'Repeating shifts',
      hint: vi ? 'Đặt ca cố định mỗi tuần' : 'Fixed weekly shifts',
      icon: Layers,
    },
    {
      id: 'generate',
      label: vi ? 'Tự tạo lịch' : 'Auto create',
      hint: vi ? 'Sinh lịch từ ca mẫu' : 'Generate from templates',
      icon: Wand2,
    },
    {
      id: 'smart',
      label: vi ? 'Tiện ích thông minh' : 'Smart tools',
      hint: vi ? 'Gợi ý ca, tổng giờ & copy tuần' : 'Slot finder, overtime & copy week',
      icon: Sparkles,
    },
  ];

  const assignInitial: AssignShiftSeed = {
    userId: assignSeed.userId,
    workDate: assignSeed.workDate,
    startTime: assignSeed.startTime,
    endTime: assignSeed.endTime,
    title: assignSeed.title,
    workMode: assignSeed.workMode,
  };

  const editInitial: EditShiftForm = {
    workDate: editing?.workDate ?? '',
    startTime: editing?.startTime ?? '',
    endTime: editing?.endTime ?? '',
    title: editing?.title ?? '',
    status: editing?.status ?? 'published',
    workMode: editing?.workMode ?? 'office',
    attendanceStatus: editing?.attendanceStatus ?? 'pending',
    attendanceNote: editing?.attendanceNote ?? '',
    checkInLocationId: editing?.checkInLocationId ?? CHECKIN_LOCATIONS[0].id,
  };

  return (
    <div className="flex w-full flex-col gap-4 pb-6 font-sans">
      <PageHeader
        breadcrumbs={[{ label: 'Admin' }, { label: vi ? 'Lịch làm việc' : 'Schedules' }]}
        title={vi ? 'Lịch làm việc' : 'Work schedules'}
        subtitle={
          vi
            ? `${sortedSchedules.length} ca • ${(totalMinutes / 60).toFixed(1)} giờ • ${staffCount} nhân viên`
            : `${sortedSchedules.length} shifts • ${(totalMinutes / 60).toFixed(1)}h • ${staffCount} staff`
        }
        actions={
          <Button onClick={() => openQuickAssign()} className="px-5 py-2.5 text-sm font-bold">
            <Plus className="h-4 w-4" />
            {vi ? 'Gán ca mới' : 'New shift'}
          </Button>
        }
      />

      {/* 4 nhóm chức năng */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tabs.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-all ${
                active
                  ? 'border-sky-500 bg-sky-500/[0.07] shadow-sm'
                  : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-sky-500/40'
              }`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  active
                    ? 'bg-sky-600 text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-[var(--text-primary)]">
                  {item.label}
                </span>
                <span className="block truncate text-xs text-[var(--text-muted)]">{item.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      {tab === 'schedules' && (
        <div className="flex w-full flex-col gap-3">
          <ScheduleFilterBar
            filters={filters}
            onChange={handleFilterChange}
            staffOptions={staffOptions}
            view={view}
            onViewChange={setView}
            onRefresh={() => void refetch()}
            isFetching={isFetching}
            vi={vi}
          />

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] py-16 text-sm text-[var(--text-muted)]">
              <Loader2 className="h-5 w-5 animate-spin" />
              {vi ? 'Đang tải lịch...' : 'Loading...'}
            </div>
          ) : (
            <>
              {(listData?.total ?? 0) > sortedSchedules.length && (
                <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                  {vi
                    ? `Đang hiển thị ${sortedSchedules.length}/${listData?.total} ca. Hãy thu hẹp khoảng ngày để xem đầy đủ.`
                    : `Showing ${sortedSchedules.length}/${listData?.total} shifts. Narrow the date range to see all.`}
                </p>
              )}
              {sortedSchedules.length === 0 ? (
                <EmptyState
                  icon="📅"
                  title={vi ? 'Chưa có ca làm việc nào' : 'No shifts yet'}
                  hint={
                    vi
                      ? 'Bấm nút bên dưới để gán ca đầu tiên. Chỉ mất 10 giây!'
                      : 'Press the button below to assign the first shift. Only 10 seconds!'
                  }
                  action={
                    <Button onClick={() => openQuickAssign()} className="mt-1 px-6 py-3 text-sm font-bold">
                      <Plus className="h-4 w-4" />
                      {vi ? 'Gán ca đầu tiên' : 'Assign first shift'}
                    </Button>
                  }
                />
              ) : (
                <>
              {view === 'week' && (
                <WeekView
                  shifts={sortedSchedules}
                  conflictIds={conflictIds}
                  displayNameOf={displayNameOf}
                  weekDays={weekDays}
                  weekAnchor={weekAnchor}
                  weekEnd={weekEnd}
                  todayIso={todayIso}
                  onJumpWeek={handleJumpWeek}
                  onQuickAssign={(dateIso) => openQuickAssign(dateIso)}
                  onEdit={openEdit}
                  onDelete={setDeleting}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                  attendancePendingIds={attendancePendingIds}
                  vi={vi}
                  language={language}
                />
              )}
              {view === 'user' && (
                <ByStaffView
                  groups={groupsByUser}
                  shifts={sortedSchedules}
                  conflictIds={conflictIds}
                  displayNameOf={displayNameOf}
                  onEdit={openEdit}
                  onDelete={setDeleting}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                  attendancePendingIds={attendancePendingIds}
                  vi={vi}
                  language={language}
                />
              )}
              {view === 'month' && (
                <ByMonthView
                  groups={groupsByMonth}
                  shifts={sortedSchedules}
                  conflictIds={conflictIds}
                  displayNameOf={displayNameOf}
                  onEdit={openEdit}
                  onDelete={setDeleting}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                  attendancePendingIds={attendancePendingIds}
                  vi={vi}
                  language={language}
                />
              )}
              {view === 'all' && (
                <TableView
                  shifts={sortedSchedules}
                  conflictIds={conflictIds}
                  displayNameOf={displayNameOf}
                  onEdit={openEdit}
                  onDelete={setDeleting}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                  attendancePendingIds={attendancePendingIds}
                  vi={vi}
                />
              )}
                </>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'templates' && (
        <TemplatesTab
          templates={templates}
          templatesLoading={templatesQuery.isLoading}
          staffOptions={staffOptions}
          filterUserId={templateFilterUserId}
          onFilterUserChange={setTemplateFilterUserId}
          editing={editingTemplate}
          onEditingChange={setEditingTemplate}
          onSubmit={handleSaveTemplate}
          onToggleActive={handleToggleTemplate}
          onDelete={setDeletingTemplate}
          isPending={createTemplateMutation.isPending || updateTemplateMutation.isPending}
          displayNameOf={displayNameOf}
          vi={vi}
          language={language}
        />
      )}

      {tab === 'generate' && (
        <GenerateTab
          staffOptions={staffOptions}
          initialFrom={todayIsoDate(0)}
          initialTo={todayIsoDate(30)}
          isPending={generateMutation.isPending}
          onSubmit={handleGenerate}
          vi={vi}
        />
      )}

      {tab === 'smart' && (
        <SmartToolsTab
          staffOptions={staffOptions}
          lookupStaff={lookupStaff}
          availability={availability}
          onCheckAvailability={handleCheckAvailability}
          availabilityPending={isCheckingAvailability}
          summary={weeklySummary}
          summaryPending={isFetchingSummary}
          onFetchSummary={handleFetchSummary}
          onCopyWeek={handleCopyWeek}
          copyWeekPending={isCopyingWeek}
          onAssignSuggestion={handleAssignSuggestion}
          initialCopyFromWeek={getWeekStartIso(todayIsoDate(-7))}
          initialCopyToWeek={getWeekStartIso(todayIsoDate(0))}
          initialSummaryFrom={getWeekStartIso(todayIsoDate(0))}
          initialSummaryTo={addDaysIso(getWeekStartIso(todayIsoDate(0)), 6)}
          initialSmartDate={todayIsoDate(1)}
          vi={vi}
        />
      )}

      <AssignShiftModal
        open={showAssign}
        onClose={() => setShowAssign(false)}
        staffOptions={staffOptions}
        initial={assignInitial}
        isPending={assignMutation.isPending || bulkAssignMutation.isPending}
        onSubmit={handleAssign}
        vi={vi}
        language={language}
      />

      <EditShiftModal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        staffName={editing ? displayNameOf(editing.userId, editing.userName) : ''}
        staffAvatar={editing?.userAvatar}
        checkInAt={editing?.checkInAt}
        checkOutAt={editing?.checkOutAt}
        workedMinutes={editing?.workedMinutes}
        lateMinutes={editing?.lateMinutes}
        initial={editInitial}
        isPending={updateMutation.isPending}
        onSubmit={handleUpdate}
        vi={vi}
      />

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
