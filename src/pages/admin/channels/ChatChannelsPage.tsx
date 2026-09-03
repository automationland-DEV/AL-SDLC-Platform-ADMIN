import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, Eye, MessageSquare } from 'lucide-react';
import { useTranslation } from '../../../i18n/useTranslation';
import toast from 'react-hot-toast';
import { Button, Badge, Table, TableRow, TableCell, SearchableSelect, ConfirmModal } from '../../../components/ui';
import {
  useChannelsQuery,
  useDeleteChannelMutation,
  useWorkspacesQuery,
} from '../../../hooks/queries';
import type { Workspace } from '../../../types';
import { useDebounce } from '../../../hooks/useDebounce';

const ITEMS_PER_PAGE = 20;

export default function ChatChannelsPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [workspaceFilter, setWorkspaceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedSearch = useDebounce(searchInput, 400);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger',
  });

  const { data: channelsResponse, isLoading, isFetching } = useChannelsQuery({
    workspaceId: workspaceFilter !== 'all' ? workspaceFilter : undefined,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    search: debouncedSearch || undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
  });

  const { data: workspacesRaw = [] } = useWorkspacesQuery();
  const deleteChannelMutation = useDeleteChannelMutation();

  const channels = useMemo(() => channelsResponse?.channels ?? [], [channelsResponse]);
  const total = channelsResponse?.total ?? 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE) || 1;

  const workspaces = useMemo(() => {
    if (Array.isArray(workspacesRaw)) return workspacesRaw as Workspace[];
    if (workspacesRaw && typeof workspacesRaw === 'object') {
      const obj = (workspacesRaw as unknown) as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data as Workspace[];
      if (Array.isArray(obj.workspaces)) return obj.workspaces as Workspace[];
    }
    return [];
  }, [workspacesRaw]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    setCurrentPage(1);
  }, []);

  const handleTypeFilterChange = useCallback((type: string) => {
    setTypeFilter(type);
    setCurrentPage(1);
  }, []);

  const handleWorkspaceFilterChange = useCallback((wsId: string) => {
    setWorkspaceFilter(wsId);
    setCurrentPage(1);
  }, []);

  const handleResetFilters = () => {
    setSearchInput('');
    setTypeFilter('all');
    setWorkspaceFilter('all');
    setCurrentPage(1);
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa Channel',
      message: 'Bạn có chắc chắn muốn xóa kênh trao đổi này? Tất cả tin nhắn trao đổi trong kênh sẽ bị xóa vĩnh viễn.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteChannelMutation.mutateAsync(id);
          toast.success('Xóa kênh trò chuyện thành công');
        } catch (error) {
          console.error(error);
          toast.error('Lỗi khi xóa kênh trò chuyện');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const getTypeBadge = (type?: string) => {
    const variants: Record<string, 'info' | 'purple' | 'warning' | 'cyan' | 'default'> = {
      general: 'info',
      announcement: 'purple',
      workspace: 'cyan',
      custom: 'default',
      dm: 'warning',
    };
    const labels: Record<string, string> = {
      general: 'CHUNG',
      announcement: 'THÔNG BÁO',
      workspace: 'DỰ ÁN',
      custom: 'TÙY CHỈNH',
      dm: 'TIN NHẮN TRỰC TIẾP',
    };
    const variantKey = type || 'general';
    const variant = variants[variantKey] || 'default';
    return (
      <Badge variant={variant}>
        {labels[type || 'general'] || (type || 'GENERAL').toUpperCase()}
      </Badge>
    );
  };

  const getWorkspaceName = (wsId?: string | { _id?: string; name?: string; key?: string }) => {
    if (!wsId) return 'GLOBAL';
    if (typeof wsId === 'object') return wsId.name || wsId.key || 'WS';
    const ws = workspaces.find((w) => w._id === wsId);
    return ws ? ws.name : 'WS';
  };

  const { t, language } = useTranslation();

  const hasFilters = searchInput !== '' || typeFilter !== 'all' || workspaceFilter !== 'all';

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3 font-sans">
      {/* Header */}
      <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">{t('channels.title')}</h2>
          <p className="text-xs text-[var(--text-muted)] font-mono-code mt-0.5">
            {language === 'vi' ? `Tổng cộng ${total} kênh` : `Total ${total} channels`}
            {isFetching && !isLoading && (
              <span className="ml-2 text-sky-500">{language === 'vi' ? '· Đang cập nhật...' : '· Updating...'}</span>
            )}
          </p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="shrink-0 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-2.5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder={t('channels.searchPlaceholder')}
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-mono-code transition-all"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <SearchableSelect
              value={workspaceFilter}
              onChange={handleWorkspaceFilterChange}
              options={[
                { value: 'all', label: t('documents.allWorkspaces') },
                ...workspaces.map((w) => ({ value: w._id, label: w.name })),
              ]}
              placeholder={t('documents.allWorkspaces')}
            />
          </div>

          <div className="flex-1 min-w-[180px]">
            <SearchableSelect
              value={typeFilter}
              onChange={handleTypeFilterChange}
              options={[
                { value: 'all', label: t('channels.allTypes') },
                { value: 'general', label: 'General' },
                { value: 'announcement', label: 'Announcement' },
                { value: 'workspace', label: 'Workspace' },
                { value: 'custom', label: 'Custom' },
                { value: 'dm', label: 'Direct Message (DM)' },
              ]}
              placeholder={t('channels.allTypes')}
            />
          </div>

          {hasFilters && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors ml-auto cursor-pointer"
            >
              {t('common.reset')}
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-sky-500 border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:flex flex-col flex-1 min-h-0 overflow-y-auto">
              <Table
                fixedLayout
                headers={[
                  { label: 'CHANNEL_ID', className: 'w-[10%]' },
                  { label: t('table.name'), className: 'w-[25%]' },
                  { label: t('table.type'), align: 'center', className: 'w-[12%]' },
                  { label: 'Workspace', className: 'w-[18%]' },
                  { label: t('table.privacy'), align: 'center', className: 'w-[10%]' },
                  { label: t('table.members'), align: 'center', className: 'w-[10%]' },
                  { label: t('table.createdAt'), align: 'center', className: 'w-[10%]' },
                  { label: t('table.actions'), align: 'center', className: 'w-[7%]' },
                ]}
              >
                {channels.map((channel) => (
                  <TableRow key={channel._id}>
                    <TableCell className="font-mono-code text-xs text-[var(--text-muted)]">
                      #{channel._id?.slice(-6)}
                    </TableCell>
                    <TableCell className="max-w-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-[var(--text-primary)] truncate" title={channel.name}>
                          #{channel.name}
                        </p>
                        {channel.description && (
                          <p className="text-[11px] text-[var(--text-muted)] truncate" title={channel.description}>
                            {channel.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{getTypeBadge(channel.type)}</TableCell>
                    <TableCell className="max-w-0">
                      <span className="text-xs text-[var(--text-secondary)] truncate block" title={getWorkspaceName(channel.workspaceId)}>
                        {getWorkspaceName(channel.workspaceId)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {channel.isPrivate ? (
                        <Badge variant="warning">RIÊNG TƯ</Badge>
                      ) : (
                        <Badge variant="success">CÔNG KHAI</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-mono-code text-xs text-[var(--text-secondary)]">
                      {(channel.type === 'general' || channel.type === 'announcement')
                        ? 'ALL'
                        : (channel.channelMembers?.length || channel.members?.length || 0)}
                    </TableCell>
                    <TableCell className="font-mono-code text-xs text-[var(--text-muted)] text-center">
                      {channel.createdAt ? new Date(channel.createdAt).toLocaleDateString('vi-VN') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => navigate(`/channels/${channel._id}`)}
                          className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-sky-500 transition-colors cursor-pointer"
                          title="Xem thông tin"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => navigate(`/channels/${channel._id}/chat`)}
                          className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-emerald-500 transition-colors cursor-pointer"
                          title="Lịch sử Chat"
                        >
                          <MessageSquare size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(channel._id)}
                          className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-rose-500 transition-colors cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="block md:hidden flex-1 min-h-0 overflow-y-auto divide-y divide-[var(--border-color)]">
              {channels.map((channel) => (
                <div key={channel._id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)]">#{channel.name}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">{getWorkspaceName(channel.workspaceId)}</p>
                    </div>
                    {getTypeBadge(channel.type)}
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--border-color)]">
                    <span className="font-mono-code text-[11px] text-[var(--text-muted)]">#{channel._id?.slice(-6)}</span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/channels/${channel._id}`)}><Eye size={14} /></Button>
                      <Button variant="secondary" size="sm" onClick={() => navigate(`/channels/${channel._id}/chat`)}><MessageSquare size={14} /></Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(channel._id)}><Trash2 size={14} /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {channels.length === 0 && (
              <div className="text-center py-16 text-[var(--text-muted)] space-y-2">
                <MessageSquare className="w-10 h-10 mx-auto stroke-1" />
                <p className="text-xs font-medium">
                  {language === 'vi' ? 'Không tìm thấy kênh trò chuyện nào.' : 'No chat channels found.'}
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-[var(--border-color)] gap-3 bg-[var(--bg-tertiary)]/30">
                <p className="text-xs font-mono-code text-[var(--text-muted)]">
                  {language === 'vi' ? 'Trang' : 'Page'} {currentPage} / {totalPages} ({language === 'vi' ? 'Tổng' : 'Total'} {total} {language === 'vi' ? 'bản ghi' : 'records'})
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || isFetching}
                  >
                    {language === 'vi' ? 'Trang trước' : 'Previous'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || isFetching}
                  >
                    {language === 'vi' ? 'Trang sau' : 'Next'}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
