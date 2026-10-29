import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  HardDrive,
  Images,
  Paperclip,
  Newspaper,
  FileText,
  Search,
  Settings,
  X,
  Loader2,
  AlertCircle,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { Button, Table, TableRow, TableCell, Badge, Input, PageHeader } from '../../../components/ui';
import { useDebounce } from '../../../hooks/useDebounce';
import { useTranslation } from '../../../i18n/useTranslation';
import {
  useStorageOverviewQuery,
  useStorageUsersQuery,
  useStorageUserMediaQuery,
  useDeleteUserMediaMutation,
  useSetUserQuotaMutation,
  useClearUserQuotaMutation,
} from '../../../hooks/queries';
import { formatBytes, type AdminStorageUserItem, type StorageMediaItem, type StorageSourceType } from '../../../services/storageService';

const GB = 1024 * 1024 * 1024;

function barColor(percent: number): string {
  if (percent >= 90) return 'bg-red-500';
  if (percent >= 70) return 'bg-amber-500';
  return 'bg-blue-600';
}

function QuotaModal({
  user,
  defaultQuotaBytes,
  onClose,
}: {
  user: AdminStorageUserItem;
  defaultQuotaBytes: number;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const setQuota = useSetUserQuotaMutation();
  const clearQuota = useClearUserQuotaMutation();
  const initialGb = user.customQuota && user.quotaBytes > 0 ? user.quotaBytes / GB : defaultQuotaBytes / GB;
  const [gb, setGb] = useState<string>(String(Math.round(initialGb * 100) / 100));
  const [unlimited, setUnlimited] = useState(user.customQuota && user.quotaBytes === 0);

  const handleSave = async () => {
    try {
      const quotaBytes = unlimited ? 0 : Math.max(0, Math.floor(Number(gb) * GB));
      if (!unlimited && (!Number.isFinite(quotaBytes) || quotaBytes <= 0)) {
        toast.error(t('storage.invalidQuota'));
        return;
      }
      await setQuota.mutateAsync({ userId: user.userId, quotaBytes });
      toast.success(t('storage.quotaSaved'));
      onClose();
    } catch {
      toast.error(t('storage.quotaSaveFailed'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-white dark:bg-[#1e1e1e] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">{t('storage.setQuota')}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="text-sm text-gray-500 mb-1">{user.email}</div>
        <div className="text-sm mb-4">
          {t('storage.usedOf', {
            used: formatBytes(user.usedBytes),
            quota: user.quotaBytes === 0 ? t('storage.unlimited') : formatBytes(user.quotaBytes),
          })}
        </div>
        <label className="flex items-center gap-2 text-sm mb-3">
          <input type="checkbox" checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} />
          {t('storage.unlimited')}
        </label>
        {!unlimited && (
          <div className="flex items-center gap-2 mb-4">
            <Input
              type="number"
              min={0}
              step={0.5}
              value={gb}
              onChange={(e) => setGb(e.target.value)}
            />
            <span className="text-sm text-gray-500">GB</span>
          </div>
        )}
        <div className="flex justify-between gap-2">
          {user.customQuota ? (
            <Button
              variant="secondary"
              disabled={clearQuota.isPending}
              onClick={async () => {
                try {
                  await clearQuota.mutateAsync(user.userId);
                  toast.success(t('storage.quotaReset'));
                  onClose();
                } catch {
                  toast.error(t('storage.quotaSaveFailed'));
                }
              }}
            >
              {t('storage.resetDefault')}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button disabled={setQuota.isPending} onClick={handleSave}>
              {setQuota.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MediaDrawer({ user, onClose }: { user: AdminStorageUserItem; onClose: () => void }) {
  const { t } = useTranslation();
  const [source, setSource] = useState<StorageSourceType | undefined>(undefined);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const { data, isLoading } = useStorageUserMediaQuery(user.userId, { limit: 48, source });
  const deleteMutation = useDeleteUserMediaMutation();

  const itemKey = (item: StorageMediaItem) => `${item.source}:${item.id}`;
  const toggleSelect = (item: StorageMediaItem) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const key = itemKey(item);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const items = data?.items ?? [];
  const selectedItems = items.filter((item) => selected.has(itemKey(item)));

  const handleDelete = async () => {
    try {
      const result = await deleteMutation.mutateAsync(
        selectedItems.map((item) => ({ source: item.source, id: item.id })),
      );
      setSelected(new Set());
      setConfirming(false);
      if (result.skipped > 0) {
        toast.success(t('storage.deletePartial', { deleted: result.deleted, skipped: result.skipped }));
      } else {
        toast.success(t('storage.deleteSuccess', { deleted: result.deleted }));
      }
    } catch {
      toast.error(t('storage.deleteFailed'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-xl h-full bg-white dark:bg-[#1e1e1e] shadow-xl overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold">{t('storage.userMedia')}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="text-sm text-gray-500 mb-4">{user.email} · {formatBytes(user.usedBytes)}</div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {(
            [
              { value: undefined, label: t('storage.filterAll') },
              { value: 'image', label: t('storage.srcImage') },
              { value: 'attachment', label: t('storage.srcAttachment') },
              { value: 'feed', label: t('storage.srcFeed') },
              { value: 'daily-report', label: t('storage.srcReport') },
            ] as Array<{ value?: StorageSourceType; label: string }>
          ).map((f) => (
            <button
              key={f.label}
              onClick={() => { setSource(f.value); setSelected(new Set()); }}
              className={`px-3 py-1.5 rounded-full text-xs border ${
                source === f.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'text-gray-500 border-gray-200 dark:border-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
          {selected.size > 0 && (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="ml-auto px-3 py-1.5 rounded-full text-xs bg-red-600 text-white hover:bg-red-700 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('storage.deleteSelected', { count: selected.size })}
            </button>
          )}
        </div>
        {confirming && selected.size > 0 && (
          <div className="mb-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-sm">
            <div className="font-medium text-red-700 dark:text-red-400 mb-2">
              {t('storage.deleteConfirm', { count: selected.size })}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="danger"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? t('storage.deleting') : t('storage.confirmDelete')}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setConfirming(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500">{t('storage.noMedia')}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((item) => {
              const key = itemKey(item);
              const checked = selected.has(key);
              return (
                <div
                  key={`${item.source}-${item.id}`}
                  className={`relative rounded-lg border overflow-hidden transition-colors ${checked ? 'border-blue-600 ring-2 ring-blue-600/30' : 'border-gray-200 dark:border-white/10'}`}
                  title={`${item.name} · ${formatBytes(item.size)}`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSelect(item)}
                    aria-pressed={checked}
                    className={`absolute top-2 left-2 z-10 w-5 h-5 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white/90 dark:bg-black/60 border-gray-300 text-transparent hover:border-blue-600'}`}
                    title={checked ? t('storage.deselect') : t('storage.selectDelete')}
                  >
                    <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M2 6.5 4.5 9 10 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <a href={item.url} target="_blank" rel="noreferrer" className="group block">
                    <div className="aspect-square bg-gray-50 dark:bg-white/5 flex items-center justify-center overflow-hidden">
                      {item.mimeType.startsWith('video/') ? (
                        <video src={item.url} className="w-full h-full object-cover" preload="metadata" />
                      ) : item.mimeType.startsWith('image/') ? (
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <Paperclip className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="p-2 flex items-center gap-1">
                      <div className="min-w-0">
                        <div className="truncate text-xs">{item.name}</div>
                        <div className="text-[11px] text-gray-500">{formatBytes(item.size)}</div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 ml-auto shrink-0 text-gray-400 opacity-0 group-hover:opacity-100" />
                    </div>
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StoragePage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [onlyOver80, setOnlyOver80] = useState(false);
  const [quotaUser, setQuotaUser] = useState<AdminStorageUserItem | null>(null);
  const [mediaUser, setMediaUser] = useState<AdminStorageUserItem | null>(null);

  const overview = useStorageOverviewQuery();
  const users = useStorageUsersQuery({
    page,
    search: debouncedSearch || undefined,
    minPercentUsed: onlyOver80 ? 80 : undefined,
  });

  const items = users.data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((users.data?.total ?? 0) / (users.data?.limit ?? 20)));
  const ov = overview.data;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: t('storage.title') }]}
        title={t('storage.title')}
        subtitle={t('storage.subtitle')}
      />

      {overview.isError ? (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" /> {t('storage.loadFailed')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {(
            [
              { icon: HardDrive, label: t('storage.totalUsed'), value: ov ? formatBytes(ov.usedBytes) : '—', loading: overview.isLoading },
              { icon: Images, label: t('storage.srcImage'), value: ov ? formatBytes(ov.breakdown.imageBytes) : '—', loading: overview.isLoading },
              { icon: Paperclip, label: t('storage.srcAttachment'), value: ov ? formatBytes(ov.breakdown.attachmentBytes) : '—', loading: overview.isLoading },
              { icon: Newspaper, label: t('storage.srcFeed'), value: ov ? formatBytes(ov.breakdown.feedBytes) : '—', loading: overview.isLoading },
              { icon: FileText, label: t('storage.srcReport'), value: ov ? formatBytes(ov.breakdown.dailyReportBytes) : '—', loading: overview.isLoading },
            ]
          ).map(({ icon: Icon, label, value, loading }) => (
            <div key={label} className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1e1e1e] p-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Icon className="w-4 h-4 text-blue-600" /> {label}
              </div>
              <div className="mt-1 text-xl font-semibold">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : value}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1e1e1e]">
        <div className="p-4 flex flex-wrap items-center gap-3 border-b border-gray-200 dark:border-white/10">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-9"
              placeholder={t('storage.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={onlyOver80}
              onChange={(e) => {
                setOnlyOver80(e.target.checked);
                setPage(1);
              }}
            />
            {t('storage.onlyOver80')}
          </label>
        </div>

        <Table
          headers={[t('storage.colUser'), t('storage.colUsed'), t('storage.colQuota'), t('storage.colDetail'), t('storage.colActions')]}
        >
          {(users.isLoading ? [] : items).map((user) => (
            <TableRow key={user.userId}>
              <TableCell>
                <div className="font-medium">{user.fullName || user.email}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </TableCell>
              <TableCell>
                <div className="min-w-[160px]">
                  <div className="text-sm">
                    {formatBytes(user.usedBytes)}
                    <span className="text-gray-400">
                      {' / '}
                      {user.quotaBytes === 0 ? t('storage.unlimited') : formatBytes(user.quotaBytes)}
                    </span>
                  </div>
                  {user.quotaBytes > 0 && (
                    <div className="h-1.5 mt-1 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor(user.percentUsed)}`}
                        style={{ width: `${Math.min(100, user.percentUsed)}%` }}
                      />
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {user.customQuota ? (
                  <Badge variant="warning">{t('storage.custom')}</Badge>
                ) : (
                  <Badge variant="default">{t('storage.default')}</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="text-xs text-gray-500">
                  {t('storage.srcImage')}: {formatBytes(user.breakdown.imageBytes)} ·{' '}
                  {t('storage.srcAttachment')}: {formatBytes(user.breakdown.attachmentBytes)}
                </div>
                <div className="text-xs text-gray-500">
                  {t('storage.srcFeed')}: {formatBytes(user.breakdown.feedBytes)} ·{' '}
                  {t('storage.srcReport')}: {formatBytes(user.breakdown.dailyReportBytes)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setMediaUser(user)}>
                    {t('storage.viewMedia')}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setQuotaUser(user)}>
                    <Settings className="w-3.5 h-3.5 mr-1" />
                    {t('storage.setQuota')}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>

        {!users.isLoading && items.length === 0 && (
          <div className="p-10 text-center text-sm text-gray-500">{t('storage.noUsers')}</div>
        )}

        <div className="p-4 flex items-center justify-between border-t border-gray-200 dark:border-white/10">
          <div className="text-xs text-gray-500">
            {t('storage.pageOf', { page, total: totalPages })}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              ←
            </Button>
            <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              →
            </Button>
          </div>
        </div>
      </div>

      {quotaUser && (
        <QuotaModal
          user={quotaUser}
          defaultQuotaBytes={users.data?.defaultQuotaBytes ?? GB * 2}
          onClose={() => setQuotaUser(null)}
        />
      )}
      {mediaUser && <MediaDrawer user={mediaUser} onClose={() => setMediaUser(null)} />}
    </div>
  );
}
