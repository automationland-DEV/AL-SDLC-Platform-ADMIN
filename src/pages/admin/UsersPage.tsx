
import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Upload, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Badge, Table, TableRow, TableCell, ConfirmModal, Select } from '../../components/ui';
import type { User, UserRole, UserStatus } from '../../types';
import { UserFormModal } from './components/users/UserFormModal';
import { UserViewModal } from './components/users/UserViewModal';
import { UserImportModal } from './components/users/UserImportModal';
import {
  useUsersQuery,
  useCreateUserMutation,
  useDeleteUserMutation,
  useUpdateUserRoleMutation,
  useUpdateUserStatusMutation,
  useImportUsersCsvMutation,
} from '../../hooks/queries';

// Helper for safe error extraction
const getErrorMessage = (error: unknown, defaultMsg: string) => {
  try {
    const errObj = error as Record<string, unknown>;
    const response = errObj?.response as Record<string, unknown>;
    const data = response?.data as Record<string, unknown>;
    
    const msg = data?.message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return String(msg[0]);
    
    const err = data?.error;
    if (typeof err === 'string') return err;
    if (typeof errObj?.message === 'string') return errObj.message;
    
    return defaultMsg;
  } catch {
    return defaultMsg;
  }
};

export default function UsersPage() {
  // ─── UI State (Zustand removed, all local) ────────────────────────────────
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'createdAt', direction: 'asc' | 'desc' } | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
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
    onConfirm: () => { },
    type: 'danger'
  });

  // ─── Server State (React Query) ────────────────────────────────────────────
  const { data, isLoading } = useUsersQuery({
    page,
    search: debouncedSearch || undefined,
    role: filterRole !== 'all' ? filterRole : undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
  });

  const createUserMutation = useCreateUserMutation();
  const deleteUserMutation = useDeleteUserMutation();
  const updateRoleMutation = useUpdateUserRoleMutation();
  const updateStatusMutation = useUpdateUserStatusMutation();
  const importCsvMutation = useImportUsersCsvMutation();

  // Derived data with full format fallback
  const parseUsersResponse = (raw: unknown) => {
    let users: User[] = [];
    let total = 0;
    let totalPages = 1;

    if (Array.isArray(raw)) {
      users = raw as User[];
      total = users.length;
      totalPages = 1;
    } else if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>;
      if (Array.isArray(obj.data)) {
        users = obj.data as User[];
      } else if (Array.isArray(obj.users)) {
        users = obj.users as User[];
      }

      if (typeof obj.total === 'number') {
        total = obj.total;
      } else if (obj.pagination && typeof obj.pagination === 'object') {
        const pag = obj.pagination as Record<string, unknown>;
        if (typeof pag.total === 'number') total = pag.total;
        if (typeof pag.totalPages === 'number') totalPages = pag.totalPages;
      } else {
        total = users.length;
      }

      if (typeof obj.totalPages === 'number') {
        totalPages = obj.totalPages;
      }
    }

    return { users, absoluteTotal: total, totalPages };
  };

  const { users, absoluteTotal, totalPages } = parseUsersResponse(data);

  // ─── Search debounce ───────────────────────────────────────────────────────
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
    const id = setTimeout(() => setDebouncedSearch(value), 500);
    return () => clearTimeout(id);
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleViewClick = async (user: User) => {
    setViewedUser(user);
    setShowViewModal(true);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleSaveChanges = async (userId: string, role: string, status: string) => {
    if (!selectedUser) return;
    try {
      if (role !== selectedUser.role) {
        await updateRoleMutation.mutateAsync({ id: userId, role });
      }
      if (status !== selectedUser.status) {
        await updateStatusMutation.mutateAsync({ id: userId, status });
      }
      setSelectedUser(null);
      toast.success('Cập nhật người dùng thành công');
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error(getErrorMessage(error, 'Cập nhật người dùng thất bại'));
      throw error;
    }
  };

  const handleCreateUser = async (userData: { email: string; password?: string; fullName?: string; role: string; status: string }) => {
    try {
      await createUserMutation.mutateAsync(userData as Partial<User>);
      toast.success('Tạo người dùng thành công');
    } catch (error) {
      console.error('Failed to create user:', error);
      toast.error(getErrorMessage(error, 'Tạo người dùng thất bại'));
      throw error;
    }
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa User',
      message: 'Bạn có chắc chắn muốn xóa user này? Hành động này không thể hoàn tác.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteUserMutation.mutateAsync(id);
          toast.success('Xóa người dùng thành công');
        } catch (error) {
          console.error('Failed to delete user:', error);
          toast.error(getErrorMessage(error, 'Xóa người dùng thất bại'));
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleImport = async (file: File) => {
    try {
      const result = await importCsvMutation.mutateAsync(file);
      return result;
    } catch (error) {
      console.error('Failed to import users:', error);
      throw error;
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    const variants: Record<UserStatus, 'success' | 'danger' | 'warning' | 'default'> = {
      active: 'success',
      inactive: 'danger',
      pending_verification: 'warning',
      suspended: 'danger',
    };
    const labels: Record<UserStatus, string> = {
      active: 'Hoạt động',
      inactive: 'Không hoạt động',
      pending_verification: 'Chờ xác thực',
      suspended: 'Đình chỉ',
    };
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  const getRoleBadge = (role: UserRole) => {
    return (
      <Badge variant={role === 'super_admin' ? 'danger' : 'default'}>
        {role === 'super_admin' ? 'Super Admin' : 'User'}
      </Badge>
    );
  };

  const getProcessedUsers = () => {
    const processed = [...users];

    // Sort
    if (sortConfig) {
      processed.sort((a, b) => {
        if (sortConfig.key === 'name') {
          const nameA = (a.fullName || a.email).toLowerCase();
          const nameB = (b.fullName || b.email).toLowerCase();
          if (nameA < nameB) return sortConfig.direction === 'asc' ? -1 : 1;
          if (nameA > nameB) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        }
        if (sortConfig.key === 'createdAt') {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        return 0;
      });
    }

    return processed;
  };

  const processedUsers = getProcessedUsers();

  const handleSort = (key: 'name' | 'createdAt') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key: 'name' | 'createdAt') => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 inline-block opacity-50" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 inline-block" /> : <ChevronDown className="w-3 h-3 ml-1 inline-block" />;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Quản lý Users</h2>
          <p className="text-[var(--text-secondary)] mt-1">Tổng cộng {absoluteTotal} users</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button variant="secondary" onClick={() => setShowImportModal(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import từ CSV
          </Button>
          <Button onClick={() => { setSelectedUser(null); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] px-4 py-2.5">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
            />
          </div>
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
            <Select
              value={filterRole}
              onChange={(val) => {
                setFilterRole(val);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'Tất cả vai trò' },
                { value: 'user', label: 'User' },
                { value: 'super_admin', label: 'Super Admin' }
              ]}
              className="w-full sm:w-auto flex-1 sm:min-w-[160px] md:min-w-[180px]"
            />
            <Select
              value={filterStatus}
              onChange={(val) => {
                setFilterStatus(val);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'active', label: 'Hoạt động' },
                { value: 'inactive', label: 'Không hoạt động' },
                { value: 'pending_verification', label: 'Chờ xác thực' },
                { value: 'suspended', label: 'Đình chỉ' }
              ]}
              className="w-full sm:w-auto flex-1 sm:min-w-[180px] md:min-w-[200px]"
            />
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
                  { label: <button key="name" className="flex items-center font-semibold hover:text-primary-600 transition-colors uppercase" onClick={() => handleSort('name')}>Tên {renderSortIcon('name')}</button>, className: 'w-[25%]' },
                  { label: 'Email', className: 'w-[25%]' },
                  { label: 'Vai trò', align: 'center', className: 'w-[10%]' },
                  { label: 'Trạng thái', align: 'center', className: 'w-[15%]' },
                  { label: <button key="created" className="flex items-center justify-center w-full font-semibold hover:text-primary-600 transition-colors uppercase" onClick={() => handleSort('createdAt')}>Ngày tạo {renderSortIcon('createdAt')}</button>, align: 'center', className: 'w-[10%]' },
                  { label: 'Thao tác', align: 'center', className: 'w-[7%]' }
                ]}
              >
              {processedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="text-[var(--text-muted)]">#{user.id?.slice(-6)}</TableCell>
                  <TableCell className="max-w-0">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600 dark:text-primary-300">
                            {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                          </span>
                        </div>
                      )}
                      <div className="font-medium text-[var(--text-primary)] truncate flex-1 min-w-0" title={user.fullName}>{user.fullName}</div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-0">
                    <div className="text-[var(--text-secondary)] truncate" title={user.email}>{user.email}</div>
                  </TableCell>
                  <TableCell className="text-center">{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="text-center">{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="text-[var(--text-secondary)] text-center">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleViewClick(user)}
                        className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-primary-600 cursor-pointer"
                        title="Xem"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditClick(user)}
                        className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-primary-600 cursor-pointer"
                        title="Sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
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

            {/* Empty state */}
            {processedUsers.length === 0 && !isLoading && (
              <div className="text-center py-12 text-[var(--text-secondary)]">
                <p>Không tìm thấy user nào phù hợp.</p>
              </div>
            )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-2.5 border-t border-[var(--border-color)] gap-3 sm:gap-0">
                <p className="text-sm text-[var(--text-secondary)] text-center sm:text-left">
                  Trang {page} / {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Form Modal */}
      <UserFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        selectedUser={selectedUser}
        onSave={handleSaveChanges}
        onCreate={handleCreateUser}
      />

      <UserImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />

      <UserViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        user={viewedUser}
      />

      {/* Confirm Modal */}
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
