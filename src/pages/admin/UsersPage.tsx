/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Upload, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, Badge, Table, TableRow, TableCell, ConfirmModal } from '../../components/ui';
import { useUsersStore } from '../../stores';
import { userService } from '../../services';
import type { User, UserRole, UserStatus } from '../../types';
import { UserFormModal } from './components/users/UserFormModal';
import { UserViewModal } from './components/users/UserViewModal';
import { UserImportModal } from './components/users/UserImportModal';

// Helper for safe error extraction
const getErrorMessage = (error: any, defaultMsg: string) => {
  try {
    const msg = error?.response?.data?.message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return String(msg[0]);
    const err = error?.response?.data?.error;
    if (typeof err === 'string') return err;
    if (typeof error?.message === 'string') return error.message;
    return defaultMsg;
  } catch (e) {
    return defaultMsg;
  }
};

export default function UsersPage() {
  const { users, absoluteTotal, page, totalPages, isLoading, search, fetchUsers, setSearch, createUser, deleteUser, updateUserRole, updateUserStatus, importUsersCsv } = useUsersStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Filtering and Sorting States
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'createdAt', direction: 'asc' | 'desc' } | null>(null);

  // View User Modal State
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewedUser, setViewedUser] = useState<User | null>(null);

  // Confirm Modal State
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

  // CSV Import State
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm !== search) {
        setSearch(searchTerm);
        fetchUsers(1, searchTerm, filterRole, filterStatus);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, search, filterRole, filterStatus, fetchUsers, setSearch]);

  const handleViewClick = async (user: User) => {
    try {
      const fullUser = await userService.getUserById(user.id);
      setViewedUser(fullUser);
    } catch (error) {
      console.error('Failed to load full user details:', error);
      setViewedUser(user);
    }
    setShowViewModal(true);
  };

  const handlePageChange = (newPage: number) => {
    fetchUsers(newPage, search, filterRole, filterStatus);
  };

  
  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleSaveChanges = async (userId: string, role: string, status: string) => {
    if (!selectedUser) return;
    try {
      if (role !== selectedUser.role) {
        await updateUserRole(userId, role);
      }
      if (status !== selectedUser.status) {
        await updateUserStatus(userId, status);
      }
      setSelectedUser(null);
      toast.success('Cập nhật người dùng thành công');
    } catch (error: any) {
      console.error('Failed to update user:', error);
      toast.error(getErrorMessage(error, 'Cập nhật người dùng thất bại'));
      throw error;
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      await createUser(userData);
      toast.success('Tạo người dùng thành công');
    } catch (error: any) {
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
          await deleteUser(id);
          toast.success('Xóa người dùng thành công');
        } catch (error: any) {
          console.error('Failed to delete user:', error);
          toast.error(getErrorMessage(error, 'Xóa người dùng thất bại'));
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
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
    let processed = [...users];

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Quản lý Users</h2>
          <p className="text-[var(--text-secondary)] mt-1">Tổng cộng {absoluteTotal} users</p>
        </div>
        <div className="flex items-center gap-3">
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
      <Card className="!p-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
            />
          </div>
          <div className="flex w-full md:w-auto gap-3">
            <select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                fetchUsers(1, searchTerm, e.target.value, filterStatus);
              }}
              className="px-3 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)] flex-1 md:w-36"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="user">User</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                fetchUsers(1, searchTerm, filterRole, e.target.value);
              }}
              className="px-3 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)] flex-1 min-w-[180px] md:min-w-[200px]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
              <option value="pending_verification">Chờ xác thực</option>
              <option value="suspended">Đình chỉ</option>
            </select>
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
            <Table headers={[
              { label: 'ID', className: 'w-24' },
              { label: <button key="name" className="flex items-center font-semibold hover:text-primary-600 transition-colors uppercase" onClick={() => handleSort('name')}>Tên {renderSortIcon('name')}</button>, className: 'w-64' },
              { label: 'Email', className: 'w-64' },
              { label: 'Vai trò', align: 'center', className: 'w-32' },
              { label: 'Trạng thái', align: 'center', className: 'w-40' },
              { label: <button key="created" className="flex items-center justify-center w-full font-semibold hover:text-primary-600 transition-colors uppercase" onClick={() => handleSort('createdAt')}>Ngày tạo {renderSortIcon('createdAt')}</button>, align: 'center', className: 'w-48' },
              { label: 'Thao tác', align: 'center', className: 'w-24' }
            ]}>
              {processedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="text-[var(--text-muted)]">#{user.id?.slice(-6)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600 dark:text-primary-300">
                            {(user.fullName || user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="font-medium">{user.fullName || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[var(--text-secondary)]">{user.email}</TableCell>
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
      </Card>

      {/* Modals */}
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
        onImport={importUsersCsv}
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
