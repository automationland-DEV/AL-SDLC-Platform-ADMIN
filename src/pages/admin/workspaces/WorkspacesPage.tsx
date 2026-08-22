import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, Archive, RotateCcw, Users, Briefcase, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useTranslation } from '../../../i18n/useTranslation';
import { Button, Badge, Table, TableRow, TableCell, ConfirmModal } from '../../../components/ui';
import type { Workspace } from '../../../types';
import toast from 'react-hot-toast';
import {
  useWorkspacesQuery,
  useDeleteWorkspaceMutation,
  useArchiveWorkspaceMutation,
  useRestoreWorkspaceMutation,
} from '../../../hooks/queries';

export default function WorkspacesPage() {
  const navigate = useNavigate();
  const { data: workspacesRaw = [], isLoading } = useWorkspacesQuery();

  const deleteWorkspaceMutation = useDeleteWorkspaceMutation();
  const archiveWorkspaceMutation = useArchiveWorkspaceMutation();
  const restoreWorkspaceMutation = useRestoreWorkspaceMutation();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
    type: 'danger'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'createdAt', direction: 'desc' });

  const workspaces = useMemo(() => {
    if (Array.isArray(workspacesRaw)) return workspacesRaw as Workspace[];
    if (workspacesRaw && typeof workspacesRaw === 'object') {
      const obj = workspacesRaw as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data as Workspace[];
      if (Array.isArray(obj.workspaces)) return obj.workspaces as Workspace[];
    }
    return [];
  }, [workspacesRaw]);
  const absoluteTotal = workspaces.length;

  const processedWorkspaces = useMemo(() => {
    let result = [...workspaces];

    if (statusFilter === 'deleted') {
      result = result.filter(ws => ws.deletedAt != null);
    } else if (statusFilter === 'archived') {
      result = result.filter(ws => ws.status === 'archived' && ws.deletedAt == null);
    } else if (statusFilter !== 'all') {
      result = result.filter(ws => ws.status === statusFilter && ws.deletedAt == null);
    } else {
      result = result.filter(ws => ws.deletedAt == null);
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(ws =>
        ws.name.toLowerCase().includes(query) ||
        (ws.description && ws.description.toLowerCase().includes(query)) ||
        (ws.key && ws.key.toLowerCase().includes(query))
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        if (sortConfig.key === 'createdAt') {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        return 0;
      });
    }

    return result;
  }, [workspaces, statusFilter, searchTerm, sortConfig]);

  const totalPagesClient = Math.ceil(processedWorkspaces.length / itemsPerPage) || 1;
  const paginatedWorkspaces = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedWorkspaces.slice(start, start + itemsPerPage);
  }, [processedWorkspaces, currentPage]);

  const handleFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleAddClick = () => navigate('/workspaces/new');
  const handleEditClick = (ws: Workspace) => navigate(`/workspaces/${ws._id}/edit`);
  const handleViewClick = (ws: Workspace) => navigate(`/workspaces/${ws._id}`);

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa Workspace',
      message: 'Bạn có chắc chắn muốn xóa workspace này? Tất cả dữ liệu dự án liên quan có thể bị ảnh hưởng.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteWorkspaceMutation.mutateAsync(id);
          toast.success('Xóa workspace thành công');
        } catch (error) {
          console.error('Failed to delete workspace:', error);
          toast.error('Xóa workspace thất bại');
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleArchive = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Lưu trữ Workspace',
      message: 'Bạn có chắc chắn muốn chuyển workspace này sang trạng thái lưu trữ?',
      type: 'warning',
      onConfirm: async () => {
        try {
          await archiveWorkspaceMutation.mutateAsync(id);
          toast.success('Đã lưu trữ workspace');
        } catch (error) {
          console.error('Failed to archive workspace:', error);
          toast.error('Lưu trữ workspace thất bại');
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleRestore = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Khôi phục Workspace',
      message: 'Bạn có chắc chắn muốn khôi phục workspace này hoạt động trở lại?',
      type: 'info',
      onConfirm: async () => {
        try {
          await restoreWorkspaceMutation.mutateAsync(id);
          toast.success('Đã khôi phục workspace');
        } catch (error) {
          console.error('Failed to restore workspace:', error);
          toast.error('Khôi phục workspace thất bại');
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const { t, language } = useTranslation();

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3 font-sans">
      {/* Header */}
      <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">{t('workspaces.title')}</h2>
          <p className="text-xs text-[var(--text-muted)] font-mono-code mt-0.5">{t('workspaces.subtitle', { count: absoluteTotal })}</p>
        </div>
        <Button size="sm" onClick={handleAddClick}>
          <Plus className="w-4 h-4" />
          {t('workspaces.createBtn')}
        </Button>
      </div>

      {/* Filters Toolbar */}
      <div className="shrink-0 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-2.5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder={t('workspaces.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-mono-code transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', labelKey: 'workspaces.tabAll' as const },
              { id: 'active', labelKey: 'workspaces.tabActive' as const },
              { id: 'archived', labelKey: 'workspaces.tabArchived' as const },
              { id: 'deleted', labelKey: 'workspaces.tabDeleted' as const },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleFilterChange(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-180 cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-[var(--text-secondary)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Workspace List Container */}
      <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-sky-500 border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:flex flex-col flex-1 min-h-0 overflow-y-auto">
              <Table 
                fixedLayout
                headers={[
                  { label: 'KEY_ID', className: 'w-[8%]' },
                  { label: t('table.name'), className: 'w-[16%]' },
                  { label: t('table.description'), className: 'w-[20%]' },
                  { label: t('table.owner'), className: 'w-[16%]' },
                  { label: t('table.members'), align: 'center', className: 'w-[8%]' },
                  { label: t('table.status'), align: 'center', className: 'w-[10%]' },
                  { 
                    label: (
                      <div 
                        className="flex items-center justify-center gap-1 cursor-pointer hover:text-sky-500 transition-colors"
                        onClick={() => {
                          setSortConfig(prev => {
                            if (prev?.key === 'createdAt') {
                              return { key: 'createdAt', direction: prev.direction === 'asc' ? 'desc' : 'asc' };
                            }
                            return { key: 'createdAt', direction: 'desc' };
                          });
                        }}
                      >
                        {language === 'vi' ? 'Ngày tạo' : 'Created At'}
                        {sortConfig?.key === 'createdAt' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        ) : <ArrowUpDown size={14} className="opacity-50" />}
                      </div>
                    ),
                    align: 'center', 
                    className: 'w-[14%]' 
                  },
                  { label: t('table.actions'), align: 'center', className: 'w-[8%]' }
                ]}
              >
                {paginatedWorkspaces.map((ws) => (
                  <TableRow key={ws._id}>
                    <TableCell className="font-mono-code text-xs text-sky-600 dark:text-sky-400 font-bold">
                      {ws.key || `#${ws._id?.slice(-4)}`}
                    </TableCell>
                    <TableCell className="max-w-0">
                      <span className="font-bold text-xs text-[var(--text-primary)] truncate block" title={ws.name}>
                        {ws.name}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-0">
                      <span className="text-xs text-[var(--text-muted)] truncate block" title={ws.description || ''}>
                        {ws.description || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-0">
                      {ws.ownerId ? (
                        <div className="flex items-center gap-2.5">
                          {typeof ws.ownerId === 'object' && ws.ownerId.avatar ? (
                            <img src={ws.ownerId.avatar} alt="" className="w-6 h-6 rounded-md object-cover border border-[var(--border-color)] shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded-md bg-violet-500/10 border border-violet-500/30 flex items-center justify-center font-mono-code font-bold text-[10px] text-violet-500 shrink-0">
                              {typeof ws.ownerId === 'object'
                                ? (ws.ownerId.fullName || ws.ownerId.email || '?').charAt(0).toUpperCase()
                                : '?'}
                            </div>
                          )}
                          <div className="truncate min-w-0">
                            <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                              {typeof ws.ownerId === 'object' ? ws.ownerId.fullName || ws.ownerId.email : 'Unknown'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)] font-mono-code">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-mono-code text-xs text-[var(--text-secondary)]">
                      <div className="inline-flex items-center gap-1">
                        <Users size={14} className="text-[var(--text-muted)]" />
                        <span>{ws.members?.filter((m: { userId?: unknown }) => m.userId)?.length || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {ws.deletedAt ? (
                        <Badge variant="danger" mono>{t('status.deleted')}</Badge>
                      ) : (
                        <Badge variant={ws.status === 'active' || !ws.status ? 'success' : 'default'} mono>
                          {ws.status === 'archived' ? t('status.archived') : t('status.active')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-xs text-[var(--text-secondary)] font-mono-code">
                      {ws.createdAt ? `${new Date(ws.createdAt).getDate()}/${new Date(ws.createdAt).getMonth() + 1}/${new Date(ws.createdAt).getFullYear()}` : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewClick(ws)}
                          className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-sky-500 transition-colors cursor-pointer"
                          title="Xem"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleEditClick(ws)}
                          className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-amber-500 transition-colors cursor-pointer"
                          title="Sửa"
                        >
                          <Edit size={15} />
                        </button>
                        {!ws.deletedAt && (
                          ws.status === 'archived' ? (
                            <button
                              onClick={() => handleRestore(ws._id)}
                              className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-emerald-500 transition-colors cursor-pointer"
                              title="Khôi phục"
                            >
                              <RotateCcw size={15} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleArchive(ws._id)}
                              className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-amber-500 transition-colors cursor-pointer"
                              title="Lưu trữ"
                            >
                              <Archive size={15} />
                            </button>
                          )
                        )}
                        <button
                          onClick={() => handleDelete(ws._id)}
                          className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-rose-500 transition-colors cursor-pointer"
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

            {/* Mobile Responsive Cards Grid (<768px) */}
            <div className="block md:hidden flex-1 min-h-0 overflow-y-auto divide-y divide-[var(--border-color)]">
              {paginatedWorkspaces.map((ws) => (
                <div key={ws._id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center font-mono-code font-bold text-xs text-violet-500 shrink-0">
                        {ws.key?.slice(0, 2).toUpperCase() || 'WS'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">{ws.name}</p>
                        <p className="text-[11px] font-mono-code text-sky-500">{ws.key || ws._id}</p>
                      </div>
                    </div>
                    {ws.deletedAt ? (
                      <Badge variant="danger" mono>{t('status.deleted')}</Badge>
                    ) : (
                      <Badge variant={ws.status === 'active' || !ws.status ? 'success' : 'default'} mono>
                        {ws.status === 'archived' ? t('status.archived') : t('status.active')}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-[var(--text-muted)] line-clamp-2">{ws.description || 'Chưa có mô tả'}</p>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--border-color)]">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono-code text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                        <Users size={12} /> {ws.members?.length || 0} members
                      </span>
                      <span className="font-mono-code text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                        {ws.createdAt ? `${new Date(ws.createdAt).getDate()}/${new Date(ws.createdAt).getMonth() + 1}/${new Date(ws.createdAt).getFullYear()}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleViewClick(ws)}><Eye size={14} /></Button>
                      <Button variant="secondary" size="sm" onClick={() => handleEditClick(ws)}><Edit size={14} /></Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(ws._id)}><Trash2 size={14} /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {processedWorkspaces.length === 0 && !isLoading && (
              <div className="text-center py-16 text-[var(--text-muted)] space-y-2">
                <Briefcase className="w-10 h-10 mx-auto stroke-1" />
                <p className="text-xs font-medium">
                  {language === 'vi' ? 'Không tìm thấy workspace nào tương ứng.' : 'No matching workspaces found.'}
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPagesClient > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-[var(--border-color)] gap-3 bg-[var(--bg-tertiary)]/30">
                <p className="text-xs font-mono-code text-[var(--text-muted)]">
                  {language === 'vi' ? 'Trang' : 'Page'} {currentPage} / {totalPagesClient} ({language === 'vi' ? 'Tổng' : 'Total'} {processedWorkspaces.length} {language === 'vi' ? 'kết quả' : 'results'})
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    {language === 'vi' ? 'Trang trước' : 'Previous'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage >= totalPagesClient}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    {language === 'vi' ? 'Trang sau' : 'Next'}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirm Modal (kept as modal — instant action) */}
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
