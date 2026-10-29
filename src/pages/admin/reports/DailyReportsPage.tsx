import { useMemo, useState } from 'react';
import {
  Briefcase,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';
import {
  Badge,
  Button,
  Input,
  PageHeader,
  Select,
} from '../../../components/ui';
import { useDailyReportWorkspacesQuery, useDailyReportsQuery } from '../../../hooks/queries';
import { useDebounce } from '../../../hooks/useDebounce';
import { useTranslation } from '../../../i18n/useTranslation';
import type {
  AdminDailyReport,
  AdminReporterGroup,
  AdminWorkspaceReportGroup,
} from '../../../types/dailyReport';

const formatDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** Nội dung báo cáo được lưu dạng HTML, hiển thị lại ở dạng văn bản thuần. */
const ReportContent = ({ report }: { report: AdminDailyReport }) => {
  const hasContent = Boolean(report.plainText || report.content);

  return (
    <div className="space-y-3">
      {hasContent ? (
        <div className="whitespace-pre-wrap rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-3.5 py-3 text-xs leading-relaxed text-[var(--text-primary)]">
          {report.plainText || report.content.replace(/<[^>]*>/g, ' ')}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-[var(--border-color)] px-3.5 py-3 text-center text-xs text-[var(--text-muted)]">
          Báo cáo trống, không có nội dung.
        </p>
      )}

      {report.taskKeys.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Task đã liên kết
          </p>
          <div className="flex flex-wrap gap-1.5">
            {report.taskKeys.map((key, index) => (
              <span
                key={`${key}-${index}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-[11px] text-sky-600 dark:text-sky-400"
              >
                <span className="font-mono-code font-bold">{key}</span>
                <span className="text-[var(--text-secondary)]">
                  {report.taskTitles[index]}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {report.media.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Tệp đính kèm ({report.media.length})
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {report.media.map((media) => (
              <a
                key={media.publicId}
                href={media.url}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-lg border border-[var(--border-color)] transition hover:border-sky-500"
              >
                {media.type === 'image' ? (
                  <img
                    src={media.url}
                    alt={media.name || 'Tệp đính kèm'}
                    className="h-20 w-full object-cover"
                  />
                ) : (
                  <video src={media.url} controls className="h-20 w-full bg-black object-cover" />
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {report.replies.length > 0 && (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            <MessageSquare className="h-3 w-3" />
            Phản hồi ({report.replies.length})
          </p>
          <div className="space-y-2">
            {report.replies.map((reply) => (
              <div
                key={reply.id}
                className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    {reply.authorName || 'Thành viên'}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {formatDateTime(reply.createdAt)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-xs text-[var(--text-secondary)]">
                  {reply.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/** Nhóm theo người báo cáo bên trong một workspace. */
const ReporterRow = ({ group }: { group: AdminReporterGroup }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-t border-[var(--border-color)] first:border-t-0">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[var(--bg-hover)]"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
        )}

        {group.reporterAvatar ? (
          <img
            src={group.reporterAvatar}
            alt=""
            className="h-8 w-8 shrink-0 rounded-lg border border-[var(--border-color)] object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 text-xs font-bold text-sky-500">
            {(group.reporterName || 'U').charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
            {group.reporterName || 'Người dùng'}
          </p>
          <p className="font-mono-code text-[10px] text-[var(--text-muted)]">
            {group.reporterId}
          </p>
        </div>

        <Badge variant="info">{group.total} báo cáo</Badge>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)] px-4 py-3">
          {group.reports.map((report) => (
            <div
              key={report.id}
              className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-3.5"
            >
              <div className="mb-2.5 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                  <CalendarDays className="h-3.5 w-3.5 text-sky-500" />
                  {formatDate(report.reportDate)}
                </span>
                <span className="font-mono-code text-[10px] text-[var(--text-muted)]">
                  Nộp lúc {formatDateTime(report.submittedAt ?? report.updatedAt)}
                </span>
              </div>
              <ReportContent report={report} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/** Nhóm theo workspace — cấp cao nhất của dữ liệu báo cáo trong admin. */
const WorkspaceRow = ({ group }: { group: AdminWorkspaceReportGroup }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-t border-[var(--border-color)] first:border-t-0">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-[var(--bg-hover)]"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
        )}

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-500">
          <Briefcase className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[var(--text-primary)]">
            {group.workspaceName || 'Workspace đã xoá'}
          </p>
          <p className="font-mono-code text-[10px] text-[var(--text-muted)]">
            {group.workspaceKey || group.workspaceId}
          </p>
        </div>

        <span className="hidden items-center gap-1.5 text-xs text-[var(--text-muted)] sm:flex">
          <Users className="h-3.5 w-3.5" />
          {group.reporters.length} người báo cáo
        </span>
        <Badge variant="info">{group.total} báo cáo</Badge>
      </button>

      {expanded && (
        <div>
          {group.reporters.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-[var(--text-muted)]">
              Workspace này chưa có báo cáo nào.
            </p>
          ) : (
            group.reporters.map((reporter) => (
              <ReporterRow key={reporter.reporterId} group={reporter} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Trang "Dữ liệu báo cáo" trong admin.
 *
 * Dữ liệu được trình bày theo thứ tự workspace → người báo cáo, mỗi báo cáo
 * mở ra để admin xem toàn bộ nội dung, task đã liên kết, media và phản hồi.
 */
export default function DailyReportsPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [workspaceFilter, setWorkspaceFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data: workspaceOptions } = useDailyReportWorkspacesQuery();

  const params = useMemo(
    () => ({
      workspaceId: workspaceFilter || undefined,
      search: debouncedSearch.trim() || undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
      limit: 200,
    }),
    [workspaceFilter, debouncedSearch, fromDate, toDate],
  );

  const { data, isLoading, isFetching, refetch } = useDailyReportsQuery(params);

  const workspaces = data?.workspaces ?? [];
  const total = data?.total ?? 0;

  const workspaceSelectOptions = useMemo(
    () => [
      { value: '', label: 'Tất cả workspace' },
      ...(workspaceOptions ?? []).map((workspace) => ({
        value: workspace.id,
        label: workspace.name,
      })),
    ],
    [workspaceOptions],
  );

  return (
    <div className="h-full min-h-0 flex flex-col font-sans">
      <PageHeader
        breadcrumbs={[{ label: 'Admin' }, { label: t('nav.reports') }]}
        title={t('reports.title')}
        subtitle={t('reports.subtitle', { count: total })}
        actions={
          <Button
            variant="secondary"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {t('common.refresh')}
          </Button>
        }
      />

      {/* Bộ lọc */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t('reports.searchPlaceholder')}
            className="pl-9"
          />
        </div>

        <Select
          options={workspaceSelectOptions}
          value={workspaceFilter}
          onChange={setWorkspaceFilter}
          className="min-w-[200px]"
        />

        <div className="w-[150px]">
          <Input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />
        </div>
        <span className="text-xs text-[var(--text-muted)]">→</span>
        <div className="w-[150px]">
          <Input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
          />
        </div>
      </div>

      {/* Danh sách */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-xs text-[var(--text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('common.loading')}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <FileText className="h-8 w-8 text-[var(--text-muted)]" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {t('reports.emptyTitle')}
            </p>
            <p className="text-xs text-[var(--text-muted)]">{t('reports.emptyHint')}</p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {workspaces.map((group) => (
              <WorkspaceRow key={group.workspaceId} group={group} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
