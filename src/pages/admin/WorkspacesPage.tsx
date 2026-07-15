/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Archive, RotateCcw, Users } from 'lucide-react';
import { Button, Card, Badge, Table, TableRow, TableCell } from '../../components/ui';
import { useWorkspacesStore } from '../../stores';
import type { Workspace } from '../../types';

export default function WorkspacesPage() {
  const {
    workspaces, absoluteTotal, isLoading,
    fetchWorkspaces, setFilter, deleteWorkspace, archiveWorkspace, restoreWorkspace,
    createWorkspace, updateWorkspace
  } = useWorkspacesStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal & form states
  const [showModal, setShowModal] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  
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
  const [workspaceMembers, setWorkspaceMembers] = useState<{ userId: any; role: string }[]>([]);

  useEffect(() => {
    fetchWorkspaces(1);
  }, [fetchWorkspaces]);

  const processedWorkspaces = workspaces.filter(ws => {
    const matchesSearch = ws.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ws.description && ws.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const totalPagesClient = Math.ceil(processedWorkspaces.length / itemsPerPage);
  const paginatedWorkspaces = processedWorkspaces.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleFilterChange = (status: string) => {
    setStatusFilter(status);
    setFilter(status);
    setCurrentPage(1);
    fetchWorkspaces(1, status);
  };

  const handleAddClick = () => {
    setSelectedWorkspace(null);
    setName('');
    setKey('');
    setDescription('');
    setFormError('');
    setShowModal(true);
  };

  const handleEditClick = (ws: Workspace) => {
    setSelectedWorkspace(ws);
    setName(ws.name);
    setKey(ws.key);
    setDescription(ws.description || '');
    setFormError('');
    setShowModal(true);
  };

  const handleViewClick = (ws: Workspace) => {
    setViewedWorkspace(ws);
    // Filter out members where userId is null (deleted users)
    const validMembers = (ws.members || []).filter((m: any) => m.userId);
    setWorkspaceMembers(validMembers);
    setShowViewModal(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !key.trim()) {
      setFormError('Vui lòng nhập đầy đủ Tên và Key');
      return;
    }
    setFormError('');
    setIsSaving(true);
    try {
      if (selectedWorkspace) {
        await updateWorkspace(selectedWorkspace._id, { name, key, description });
      } else {
        await createWorkspace({ name, key, description });
      }
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save workspace:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Lưu trữ Workspace',
      message: 'Bạn có chắc chắn muốn lưu trữ workspace này? Workspace sẽ bị ẩn khỏi danh sách hoạt động.',
      type: 'warning',
      onConfirm: async () => {
        await archiveWorkspace(id);
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
        await restoreWorkspace(id);
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
        await deleteWorkspace(id);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
      <Card className="!p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
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
          <div className="flex items-center gap-2">
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
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
          </div>
        ) : (
          <>
            <Table headers={['ID', 'Tên Workspace', 'Mô tả', 'Chủ sở hữu', { label: 'Thành Viên', align: 'center' }, 'Trạng thái', 'Thao tác']}>
              {paginatedWorkspaces.map((ws) => (
                <TableRow key={ws._id}>
                  <TableCell className="text-[var(--text-muted)]">#{ws._id?.slice(-6)}</TableCell>
                  <TableCell>
                    <span className="font-medium truncate block max-w-[250px] text-[var(--text-primary)]" title={ws.name}>{ws.name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[var(--text-secondary)] truncate block max-w-[200px]" title={ws.description || ''}>{ws.description || '-'}</span>
                  </TableCell>
                  <TableCell>
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
                        <span className="text-sm text-[var(--text-primary)]">
                          {typeof ws.ownerId === 'object'
                            ? ws.ownerId.fullName || ws.ownerId.email || 'Unknown'
                            : 'Unknown'}
                        </span>
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1 text-[var(--text-secondary)] w-full">
                      <Users className="w-4 h-4" />
                      {ws.members?.filter((m: any) => m.userId)?.length || 0}
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

            {/* Pagination */}
            {totalPagesClient > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-color)]">
                <p className="text-sm text-[var(--text-secondary)]">
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
      </Card>

      {/* Workspace Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">
              {selectedWorkspace ? 'Chỉnh sửa Workspace' : 'Tạo Workspace mới'}
            </h3>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg text-sm">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Tên Workspace *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Project Alpha"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
                />
              </div>

              {/* Key Input */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Key (slug) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: alpha"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Mô tả</label>
                <textarea
                  placeholder="Mô tả về workspace này..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)] h-24"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Đang lưu...' : 'Lưu'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* View Workspace Modal */}
      {showViewModal && viewedWorkspace && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl m-4">
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">
              Chi tiết Workspace
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-color)]">
                <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center overflow-hidden">
                  <span className="text-xl font-bold text-primary-600 dark:text-primary-300">
                    {viewedWorkspace.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)] text-lg">{viewedWorkspace.name}</h4>
                  <p className="text-sm text-[var(--text-secondary)]">Key: {viewedWorkspace.key}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div className="col-span-2">
                  <span className="text-[var(--text-muted)] block text-xs mb-2">Chủ sở hữu</span>
                  {viewedWorkspace.ownerId ? (
                    <div className="flex items-center gap-2">
                      {typeof viewedWorkspace.ownerId === 'object' && viewedWorkspace.ownerId.avatar ? (
                        <img src={viewedWorkspace.ownerId.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600 dark:text-primary-300">
                            {typeof viewedWorkspace.ownerId === 'object'
                              ? (viewedWorkspace.ownerId.fullName || viewedWorkspace.ownerId.email || '?').charAt(0).toUpperCase()
                              : '?'}
                          </span>
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium text-[var(--text-primary)]">
                          {typeof viewedWorkspace.ownerId === 'object'
                            ? viewedWorkspace.ownerId.fullName || 'Chưa cập nhật tên'
                            : 'Unknown'}
                        </span>
                        {typeof viewedWorkspace.ownerId === 'object' && viewedWorkspace.ownerId.email && (
                          <span className="text-xs text-[var(--text-muted)]">{viewedWorkspace.ownerId.email}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[var(--text-primary)]">-</span>
                  )}
                </div>
                <div className="col-span-2 border-t border-[var(--border-color)] pt-3">
                  <span className="text-[var(--text-muted)] block text-xs mb-1">Mô tả</span>
                  <span className="text-[var(--text-primary)] font-medium">{viewedWorkspace.description || '-'}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block text-xs mb-1">Trạng thái</span>
                  <Badge variant={viewedWorkspace.status === 'active' || !viewedWorkspace.status ? 'success' : 'default'}>
                    {viewedWorkspace.status === 'archived' ? 'Đã lưu trữ' : 'Hoạt động'}
                  </Badge>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block text-xs mb-1">ID Workspace</span>
                  <span className="text-[var(--text-primary)]">{viewedWorkspace._id}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                <h4 className="font-semibold text-sm mb-3 text-[var(--text-primary)] flex items-center gap-2">
                  <Users className="w-4 h-4" /> Thành viên ({workspaceMembers.length})
                </h4>
                {workspaceMembers.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto pr-2 space-y-2">
                    {workspaceMembers.map((member: any) => (
                      <div key={member.userId?._id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                            {member.userId?.avatar ? (
                              <img src={member.userId.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-medium text-primary-600">
                                {(member.userId?.fullName || member.userId?.email || '?').charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--text-primary)]">{member.userId?.fullName || 'Unknown'}</p>
                            <p className="text-xs text-[var(--text-muted)]">{member.userId?.email}</p>
                          </div>
                        </div>
                        <Badge variant="default">
                          {member.role === 'owner' ? 'Owner' : member.role === 'admin' ? 'Admin' : 'Member'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-secondary)] text-center py-2">Không có thành viên nào.</p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => setShowViewModal(false)}>Đóng</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

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
