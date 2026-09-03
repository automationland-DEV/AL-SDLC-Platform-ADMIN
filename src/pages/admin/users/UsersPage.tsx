import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, Upload, ArrowUpDown, ChevronUp, ChevronDown, User as UserIcon } from 'lucide-react';
import { useTranslation } from '../../../i18n/useTranslation';
import toast from 'react-hot-toast';
import { Button, Badge, Table, TableRow, TableCell, ConfirmModal, Select } from '../../../components/ui';
import { useDebounce } from '../../../hooks/useDebounce';
import type { User, UserRole, UserStatus } from '../../../types';
import {
  useUsersQuery,
  useDeleteUserMutation,
} from '../../../hooks/queries';

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
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'createdAt', direction: 'asc' | 'desc' } | null>(null);

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

  const { data, isLoading } = useUsersQuery({
    page,
    search: debouncedSearch || undefined,
    role: filterRole !== 'all' ? filterRole : undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
  });

  const deleteUserMutation = useDeleteUserMutation();

  const users = data?.data ?? [];
  const absoluteTotal = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleViewClick = (user: User) => {
    navigate(`/users/${user.id}`, { state: { from: '/users' } });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleEditClick = (user: User) => {
    navigate(`/users/${user.id}/edit`, { state: { from: '/users' } });
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

  const getStatusBadge = (status: UserStatus) => {
    const variants: Record<UserStatus, 'success' | 'danger' | 'warning' | 'default'> = {
      active: 'success',
      inactive: 'danger',
      pending_verification: 'warning',
      suspended: 'danger',
    };
    const labels: Record<UserStatus, string> = {
      active: language === 'vi' ? 'HOẠT ĐỘNG' : 'ACTIVE',
      inactive: language === 'vi' ? 'KHÔNG HOẠT ĐỘNG' : 'INACTIVE',
      pending_verification: language === 'vi' ? 'CHỜ XÁC THỰC' : 'PENDING VERIFICATION',
      suspended: language === 'vi' ? 'ĐÌNH CHỈ' : 'SUSPENDED',
    };
    return (
      <Badge variant={variants[status] || 'default'} mono>
        {labels[status] || status.toUpperCase()}
      </Badge>
    );
  };

  const getRoleBadge = (role: UserRole) => {
    return (
      <Badge variant={role === 'super_admin' ? 'info' : 'default'} mono>
        {role === 'super_admin' ? 'SUPER_ADMIN' : 'USER'}
      </Badge>
    );
  };

  // Server side sorting isn't fully implemented in this component, so we still do client-side for now or just rely on default order
  // Wait, I will keep client-side sorting as it was just to be safe, since backend GET /admin/users doesn't necessarily accept sort in the query
  const getProcessedUsers = () => {
    const processed = [...users];

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
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 inline-block text-sky-500" /> : <ChevronDown className="w-3 h-3 ml-1 inline-block text-sky-500" />;
  };

  const { t, language } = useTranslation();

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3 font-sans">
      {/* Header */}
      <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">{t('users.title')}</h2>
          <p className="text-xs text-[var(--text-muted)] font-mono-code mt-0.5">{t('users.subtitle', { count: absoluteTotal })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button variant="secondary" size="sm" onClick={() => navigate('/users/import', { state: { from: '/users' } })}>
            <Upload className="w-4 h-4" />
            {t('users.importCsv')}
          </Button>
          <Button size="sm" onClick={() => navigate('/users/new', { state: { from: '/users' } })}>
            <Plus className="w-4 h-4" />
            {t('users.addUser')}
          </Button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="shrink-0 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-2.5">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder={t('users.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-mono-code transition-all"
            />
          </div>
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2.5">
            <Select
              value={filterRole}
              onChange={(val) => {
                setFilterRole(val);
                setPage(1);
              }}
              options={[
                { value: 'all', label: language === 'vi' ? 'Tất cả vai trò' : 'All Roles' },
                { value: 'user', label: 'User' },
                { value: 'super_admin', label: 'Super Admin' }
              ]}
              className="w-full sm:w-auto sm:min-w-[150px]"
            />
            <Select
              value={filterStatus}
              onChange={(val) => {
                setFilterStatus(val);
                setPage(1);
              }}
              options={[
                { value: 'all', label: language === 'vi' ? 'Tất cả trạng thái' : 'All Statuses' },
                { value: 'active', label: language === 'vi' ? 'Hoạt động' : 'Active' },
                { value: 'inactive', label: language === 'vi' ? 'Không hoạt động' : 'Inactive' },
                { value: 'pending_verification', label: language === 'vi' ? 'Chờ xác thực' : 'Pending Verification' },
                { value: 'suspended', label: language === 'vi' ? 'Đình chỉ' : 'Suspended' }
              ]}
              className="w-full sm:w-auto sm:min-w-[170px]"
            />
          </div>
        </div>
      </div>

      {/* Main Users Table / Responsive Mobile Cards */}
      <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-sky-500 border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:flex flex-col flex-1 min-h-0 overflow-y-auto">
              <Table 
                fixedLayout
                headers={[
                  { label: 'USER_ID', className: 'w-[12%]' },
                  { label: <button key="name" className="flex items-center font-bold hover:text-sky-500 transition-colors uppercase cursor-pointer" onClick={() => handleSort('name')}>{t('table.name')} {renderSortIcon('name')}</button>, className: 'w-[28%]' },
                  { label: t('table.email'), className: 'w-[26%]' },
                  { label: t('table.role'), align: 'center', className: 'w-[12%]' },
                  { label: t('table.status'), align: 'center', className: 'w-[12%]' },
                  { label: <button key="created" className="flex items-center justify-center w-full font-bold hover:text-sky-500 transition-colors uppercase cursor-pointer" onClick={() => handleSort('createdAt')}>{t('table.createdAt')} {renderSortIcon('createdAt')}</button>, align: 'center', className: 'w-[10%]' },
                  { label: t('table.actions'), align: 'center', className: 'w-[8%]' }
                ]}
              >
                {processedUsers.map((userItem) => (
                  <TableRow key={userItem.id}>
                    <TableCell className="font-mono-code text-xs text-[var(--text-muted)]">
                      #{userItem.id?.slice(-6) || 'N/A'}
                    </TableCell>
                    <TableCell className="max-w-0">
                      <div className="flex items-center gap-3">
                        {userItem.avatar ? (
                          <img src={userItem.avatar} alt="" className="w-8 h-8 rounded-lg object-cover border border-[var(--border-color)] shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center font-mono-code font-bold text-xs text-sky-500 shrink-0">
                            {userItem.fullName ? userItem.fullName.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        <span className="font-semibold text-xs text-[var(--text-primary)] truncate" title={userItem.fullName}>
                          {userItem.fullName || 'Chưa cập nhật'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-0">
                      <span className="font-mono-code text-xs text-[var(--text-secondary)] truncate block" title={userItem.email}>
                        {userItem.email}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">{getRoleBadge(userItem.role)}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(userItem.status)}</TableCell>
                    <TableCell className="font-mono-code text-xs text-[var(--text-muted)] text-center">
                      {userItem.createdAt ? new Date(userItem.createdAt).toLocaleDateString('vi-VN') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewClick(userItem)}
                          className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-sky-500 transition-colors cursor-pointer"
                          title="Xem thông tin"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleEditClick(userItem)}
                          className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-sky-500 transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(userItem.id)}
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
              {processedUsers.map((userItem) => (
                <div key={userItem.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {userItem.avatar ? (
                        <img src={userItem.avatar} alt="" className="w-9 h-9 rounded-lg object-cover border border-[var(--border-color)] shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center font-mono-code font-bold text-xs text-sky-500 shrink-0">
                          {userItem.fullName ? userItem.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">{userItem.fullName || 'Chưa cập nhật'}</p>
                        <p className="text-[11px] font-mono-code text-[var(--text-muted)]">{userItem.email}</p>
                      </div>
                    </div>
                    {getRoleBadge(userItem.role)}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-mono-code text-[11px] text-[var(--text-muted)]">#{userItem.id?.slice(-6)}</span>
                    {getStatusBadge(userItem.status)}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
                    <Button variant="ghost" size="sm" onClick={() => handleViewClick(userItem)}>
                      <Eye size={14} /> Xem
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => handleEditClick(userItem)}>
                      <Edit size={14} /> Sửa
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(userItem.id)}>
                      <Trash2 size={14} /> Xóa
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {processedUsers.length === 0 && !isLoading && (
              <div className="text-center py-16 text-[var(--text-muted)] space-y-2">
                <UserIcon className="w-10 h-10 mx-auto stroke-1" />
                <p className="text-xs font-medium">
                  {language === 'vi' ? 'Không tìm thấy tài khoản người dùng tương ứng.' : 'No matching user accounts found.'}
                </p>
              </div>
            )}

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-[var(--border-color)] gap-3 bg-[var(--bg-tertiary)]/30">
                <p className="text-xs font-mono-code text-[var(--text-muted)]">
                  {language === 'vi' ? 'Trang' : 'Page'} {page} / {totalPages} ({language === 'vi' ? 'Tổng' : 'Total'} {absoluteTotal} {language === 'vi' ? 'bản ghi' : 'records'})
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    {language === 'vi' ? 'Trang trước' : 'Previous'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    {language === 'vi' ? 'Trang sau' : 'Next'}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirm Delete Modal (kept as modal — instant action) */}
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
