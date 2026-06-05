import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Archive, RotateCcw, Users } from 'lucide-react';
import { Button, Card, Badge, Table, TableRow, TableCell } from '../../components/ui';
import { useWorkspacesStore } from '../../stores';

export default function WorkspacesPage() {
  const {
    workspaces, total, page, totalPages, isLoading,
    fetchWorkspaces, setFilter, deleteWorkspace, archiveWorkspace, restoreWorkspace
  } = useWorkspacesStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchWorkspaces(1);
  }, [fetchWorkspaces]);

  const handleFilterChange = (status: string) => {
    setStatusFilter(status);
    setFilter(status);
    fetchWorkspaces(1, status);
  };

  const handleArchive = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn lưu trữ workspace này?')) {
      await archiveWorkspace(id);
    }
  };

  const handleRestore = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn khôi phục workspace này?')) {
      await restoreWorkspace(id);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa workspace này? Hành động này không thể hoàn tác.')) {
      await deleteWorkspace(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Quản lý Workspaces</h2>
          <p className="text-[var(--text-secondary)] mt-1">Tổng cộng {total} workspaces</p>
        </div>
        <Button>
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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => handleFilterChange('active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'active'
                  ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
              }`}
            >
              Hoạt động
            </button>
            <button
              onClick={() => handleFilterChange('archived')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'archived'
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
              }`}
            >
              Đã lưu trữ
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
            <Table headers={['ID', 'Tên Workspace', 'Mô tả', 'Chủ sở hữu', 'Members', 'Trạng thái', 'Thao tác']}>
              {workspaces.map((ws) => (
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
                      <div className="flex items-center gap-2">
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
                    <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                      <Users className="w-4 h-4" />
                      {ws.members?.length || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ws.status === 'active' || !ws.status ? 'success' : 'default'}>
                      {ws.status === 'archived' ? 'Đã lưu trữ' : 'Hoạt động'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-primary-600"
                        title="Xem"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-primary-600"
                        title="Sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {ws.status === 'archived' ? (
                        <button
                          onClick={() => handleRestore(ws._id)}
                          className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-green-600"
                          title="Khôi phục"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleArchive(ws._id)}
                          className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-orange-600"
                          title="Lưu trữ"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(ws._id)}
                        className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-red-600"
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
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-color)]">
                <p className="text-sm text-[var(--text-secondary)]">
                  Trang {page} / {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => fetchWorkspaces(page - 1)}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => fetchWorkspaces(page + 1)}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
