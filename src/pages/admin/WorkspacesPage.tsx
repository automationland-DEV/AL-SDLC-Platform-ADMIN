
import { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Archive, RotateCcw, Users } from 'lucide-react';
import { Button, Card, Badge, Table, TableRow, TableCell } from '../../components/ui';
import { userService } from '../../services';
import type { Workspace, User, WorkspaceType } from '../../types';
import toast from 'react-hot-toast';
import { WorkspaceFormModal } from './components/workspaces/WorkspaceFormModal';
import { WorkspaceViewModal } from './components/workspaces/WorkspaceViewModal';
import {
  useWorkspacesQuery,
  useCreateWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useDeleteWorkspaceMutation,
  useArchiveWorkspaceMutation,
  useRestoreWorkspaceMutation,
} from '../../hooks/queries';
import { useQuery } from '@tanstack/react-query';

export default function WorkspacesPage() {
  // ─── Server State (React Query) ─────────────────────────────────────────────
  const { data: workspacesRaw = [], isLoading } = useWorkspacesQuery();
  
  // Fetch users for owner selection — cached separately
  const { data: allUsersRaw } = useQuery({
    queryKey: ['users', 'all-for-form'],
    queryFn: () => userService.getAllUsers({ limit: 1000 }),
    staleTime: 1000 * 60 * 5,
  });
  const allUsers: User[] = useMemo(() => {
    const raw = allUsersRaw as unknown;
    if (Array.isArray(raw)) return raw as User[];
    if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data as User[];
    }
    return [];
  }, [allUsersRaw]);

  const createWorkspaceMutation = useCreateWorkspaceMutation();
  const updateWorkspaceMutation = useUpdateWorkspaceMutation();
  const deleteWorkspaceMutation = useDeleteWorkspaceMutation();
  const archiveWorkspaceMutation = useArchiveWorkspaceMutation();
  const restoreWorkspaceMutation = useRestoreWorkspaceMutation();

  // ─── UI State ───────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal & form states
  const [showModal, setShowModal] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  
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
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewedWorkspace, setViewedWorkspace] = useState<Workspace | null>(null);
  const [workspaceMembers, setWorkspaceMembers] = useState<{ userId: User; role: string }[]>([]);

  // ─── Derived / filtered data from cache ─────────────────────────────────────
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

    // Filter by status
    if (statusFilter === 'deleted') {
      result = result.filter(ws => ws.deletedAt != null);
    } else if (statusFilter === 'archived') {
      result = result.filter(ws => ws.status === 'archived' && ws.deletedAt == null);
    } else if (statusFilter !== 'all') {
      result = result.filter(ws => ws.status === statusFilter && ws.deletedAt == null);
    } else {
      result = result.filter(ws => ws.deletedAt == null);
    }

    // Filter by search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(ws =>
        ws.name.toLowerCase().includes(q) ||
        (ws.description && ws.description.toLowerCase().includes(q))
      );
    }

    return result;
  }, [workspaces, statusFilter, searchTerm]);

  const totalPagesClient = Math.ceil(processedWorkspaces.length / itemsPerPage);
  const paginatedWorkspaces = processedWorkspaces.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleAddClick = () => {
    setSelectedWorkspace(null);
    setShowModal(true);
  };

  const handleEditClick = (ws: Workspace) => {
    setSelectedWorkspace(ws);
    setShowModal(true);
  };

  const handleViewClick = (ws: Workspace) => {
    setViewedWorkspace(ws);
    // Filter out members where userId is null (deleted users)
    const validMembers = (ws.members || []).filter((m: { userId?: unknown; role?: string }) => m.userId);
    setWorkspaceMembers(validMembers as { userId: User; role: string }[]);
    setShowViewModal(true);
  };

  const handleSaveWorkspace = async (id: string | null, data: { name: string; key: string; description: string; ownerId?: string; type?: string; avatar?: string }) => {
    const payload = { ...data, type: data.type as WorkspaceType };
    if (id) {
      await updateWorkspaceMutation.mutateAsync({ id, data: payload });
      toast.success('Cập nhật workspace thành công');
    } else {
      await createWorkspaceMutation.mutateAsync(payload);
      toast.success('Tạo workspace thành công');
    }
    setShowModal(false);
  };

  const handleArchive = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Lưu trữ Workspace',
      message: 'Bạn có chắc chắn muốn lưu trữ workspace này? Workspace sẽ bị ẩn khỏi danh sách hoạt động.',
      type: 'warning',
      onConfirm: async () => {
        await archiveWorkspaceMutation.mutateAsync(id);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleRestore = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Khôi phục Workspace',
      message: 'Bạn có chắc chắn muốn khôi phục workspace này để nó hoạt động trở lại?',
      type: 'info',
      onConfirm: async () => {
        await restoreWorkspaceMutation.mutateAsync(id);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa Workspace',
      message: 'Bạn có chắc chắn muốn xóa workspace này? Hành động này không thể hoàn tác.',
      type: 'danger',
      onConfirm: async () => {
        await deleteWorkspaceMutation.mutateAsync(id);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Quản lý Workspaces</h2>
          <p className="text-[var(--text-secondary)] mt-1">Tổng cộng {absoluteTotal} workspaces</p>
        </div>
        <Button onClick={handleAddClick}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo Workspace
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] px-4 py-2.5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Tìm kiếm workspace..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${statusFilter === 'all'
                ? 'bg-primary-500 text-white shadow-md'
                : 'text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)]'
                }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => handleFilterChange('active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${statusFilter === 'active'
                ? 'bg-green-500 text-white shadow-md'
                : 'text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)]'
                }`}
            >
              Hoạt động
            </button>
            <button
              onClick={() => handleFilterChange('archived')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${statusFilter === 'archived'
                ? 'bg-gray-600 text-white shadow-md'
                : 'text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)]'
                }`}
            >
              Đã lưu trữ
            </button>
            <button
              onClick={() => handleFilterChange('deleted')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${statusFilter === 'deleted'
                ? 'bg-red-500 text-white shadow-md'
                : 'text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)]'
                }`}
            >
              Đã xóa
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--card-bg)] rounded-xl shadow-sm border border-[var(--border-color)] flex flex-col flex-1 min-h-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto min-h-0">
              <Table 
                fixedLayout
                headers={[
                  { label: 'ID', className: 'w-[8%]' },
                  { label: 'Tên Workspace', className: 'w-[20%]' },
                  { label: 'Mô tả', className: 'w-[25%]' },
                  { label: 'Chủ sở hữu', className: 'w-[20%]' },
                  { label: 'Thành Viên', align: 'center', className: 'w-[10%]' },
                  { label: 'Trạng thái', align: 'center', className: 'w-[10%]' },
                  { label: 'Thao tác', align: 'center', className: 'w-[7%]' }
                ]}
              >
              {paginatedWorkspaces.map((ws) => (
                <TableRow key={ws._id}>
                  <TableCell className="text-[var(--text-muted)]">#{ws._id?.slice(-6)}</TableCell>
                  <TableCell className="max-w-0">
                    <div className="font-medium truncate text-[var(--text-primary)]" title={ws.name}>{ws.name}</div>
                  </TableCell>
                  <TableCell className="max-w-0">
                    <div className="text-[var(--text-secondary)] truncate" title={ws.description || ''}>{ws.description || '-'}</div>
                  </TableCell>
                  <TableCell className="max-w-0">
                    {ws.ownerId ? (
                      <div
                        className="flex items-center gap-2"
                        title={typeof ws.ownerId === 'object' && ws.ownerId.email ? ws.ownerId.email : ''}
                      >
                        {typeof ws.ownerId === 'object' && ws.ownerId.avatar ? (
                          <img src={ws.ownerId.avatar} alt="" className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary-600 dark:text-primary-300">
                              {typeof ws.ownerId === 'object'
                                ? (ws.ownerId.fullName || ws.ownerId.email || '?').charAt(0).toUpperCase()
                                : '?'}
                            </span>
                          </div>
                        )}
                      <div className="truncate min-w-0 flex-1" title={typeof ws.ownerId === 'object' ? (ws.ownerId.fullName || ws.ownerId.email) : ''}>
                        <div className="font-medium text-[var(--text-primary)] truncate">{typeof ws.ownerId === 'object' ? ws.ownerId.fullName : 'Unknown'}</div>
                        <div className="text-xs text-[var(--text-muted)] truncate">{typeof ws.ownerId === 'object' ? ws.ownerId.email : ''}</div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[var(--text-muted)] italic">-</span>
                  )}
                </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1 text-[var(--text-secondary)] w-full">
                      <Users className="w-4 h-4" />
                      {ws.members?.filter((m: { userId?: unknown }) => m.userId)?.length || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    {ws.deletedAt ? (
                      <Badge variant="danger">Đã xóa</Badge>
                    ) : (
                      <Badge variant={ws.status === 'active' || !ws.status ? 'success' : 'default'}>
                        {ws.status === 'archived' ? 'Đã lưu trữ' : 'Hoạt động'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleViewClick(ws)}
                        className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-primary-600 cursor-pointer"
                        title="Xem"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditClick(ws)}
                        className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-amber-600 cursor-pointer"
                        title="Sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {!ws.deletedAt && (
                        ws.status === 'archived' ? (
                          <button
                            onClick={() => handleRestore(ws._id)}
                            className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-green-600 cursor-pointer"
                            title="Khôi phục"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchive(ws._id)}
                            className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-orange-600 cursor-pointer"
                            title="Lưu trữ"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )
                      )}
                      <button
                        onClick={() => handleDelete(ws._id)}
                        className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-red-600 cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
            </div>

            {/* Pagination */}
            {totalPagesClient > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-2.5 border-t border-[var(--border-color)] gap-3 sm:gap-0">
                <p className="text-sm text-[var(--text-secondary)] text-center sm:text-left">
                  Trang {currentPage} / {totalPagesClient}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage >= totalPagesClient}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Workspace Modal */}
      <WorkspaceFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        selectedWorkspace={selectedWorkspace}
        users={allUsers}
        onSave={handleSaveWorkspace}
      />

      {/* View Workspace Modal */}
      <WorkspaceViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        workspace={viewedWorkspace}
        members={workspaceMembers}
      />

      {/* Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm m-4">
            <h3 className={`text-lg font-bold mb-3 ${
              confirmModal.type === 'danger' ? 'text-red-600 dark:text-red-400' :
              confirmModal.type === 'warning' ? 'text-orange-600 dark:text-orange-400' :
              'text-primary-600 dark:text-primary-400'
            }`}>
              {confirmModal.title}
            </h3>
            <p className="text-[var(--text-secondary)] mb-6 text-sm">
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>
                Hủy
              </Button>
              <Button 
                variant={confirmModal.type === 'danger' ? 'danger' : 'primary'}
                onClick={confirmModal.onConfirm}
              >
                Xác nhận
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
