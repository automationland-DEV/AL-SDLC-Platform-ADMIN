import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Upload } from 'lucide-react';
import { Button, Card, Badge, Table, TableRow, TableCell } from '../../components/ui';
import { useUsersStore } from '../../stores';
import type { User, UserRole, UserStatus } from '../../types';

export default function UsersPage() {
  const { users, total, page, totalPages, isLoading, search, fetchUsers, setSearch, deleteUser, updateUserRole, updateUserStatus, importUsersCsv } = useUsersStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<string>('user');
  const [editStatus, setEditStatus] = useState<string>('active');
  const [isSaving, setIsSaving] = useState(false);

  // CSV Import States
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    insertedCount: number;
    skippedCount: number;
    errors: string[];
    message?: string;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setImportResult(null);
      setImportError(null);
    }
  };

  const handleImportSubmit = async () => {
    if (!selectedFile) return;
    setIsImporting(true);
    setImportError(null);
    setImportResult(null);
    try {
      const res = await importUsersCsv(selectedFile);
      setImportResult({
        ...res,
        message: `Import thành công. Đã tạo ${res.insertedCount} tài khoản, bỏ qua ${res.skippedCount} tài khoản.`
      });
      setSelectedFile(null);
    } catch (err: any) {
      console.error(err);
      setImportError(err.response?.data?.message || err.message || 'Lỗi khi import file CSV');
    } finally {
      setIsImporting(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleSearch = () => {
    setSearch(searchTerm);
    fetchUsers(1, searchTerm);
  };

  const handlePageChange = (newPage: number) => {
    fetchUsers(newPage, search);
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditStatus(user.status);
    setShowModal(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      if (editRole !== selectedUser.role) {
        await updateUserRole(selectedUser.id, editRole);
      }
      if (editStatus !== selectedUser.status) {
        await updateUserStatus(selectedUser.id, editStatus);
      }
      setShowModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to update user:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa user này?')) {
      await deleteUser(id);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Quản lý Users</h2>
          <p className="text-[var(--text-secondary)] mt-1">Tổng cộng {total} users</p>
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
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
            />
          </div>
          <Button variant="secondary" onClick={handleSearch}>Tìm kiếm</Button>
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
            <Table headers={['ID', 'Tên', 'Email', 'Vai trò', 'Trạng thái', 'Ngày tạo', 'Thao tác']}>
              {users.map((user) => (
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
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="text-[var(--text-secondary)]">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-primary-600"
                        title="Xem"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditClick(user)}
                        className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-primary-600"
                        title="Sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
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

            {/* Empty state */}
            {users.length === 0 && !isLoading && (
              <div className="text-center py-12 text-[var(--text-secondary)]">
                <p>Không tìm thấy user nào.</p>
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

      {/* Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4">
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">
              {selectedUser ? 'Chỉnh sửa User' : 'Thêm User mới'}
            </h3>

            {selectedUser ? (
              <div className="space-y-4">
                {/* User Info */}
                <div className="bg-[var(--bg-tertiary)] rounded-lg p-3">
                  <p className="text-sm text-[var(--text-secondary)]">Email: {selectedUser.email}</p>
                  <p className="text-sm text-[var(--text-secondary)]">Tên: {selectedUser.fullName || '-'}</p>
                </div>

                {/* Role Select */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Vai trò</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
                  >
                    <option value="user">User</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                {/* Status Select */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Trạng thái</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                    <option value="pending_verification">Chờ xác thực</option>
                    <option value="suspended">Đình chỉ</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
                  <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? 'Đang lưu...' : 'Lưu'}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Form tạo user mới sẽ được thêm vào đây.
              </p>
            )}

            {!selectedUser && (
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowModal(false)}>Đóng</Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg m-4 !p-6">
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">
              Import Users từ CSV
            </h3>
            
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Chọn file CSV xuất ra từ hệ thống HRM chứa thông tin nhân viên để tạo tài khoản SDLC.
              </p>

              <div className="border-2 border-dashed border-[var(--border-color)] rounded-lg p-6 flex flex-col items-center justify-center bg-[var(--bg-tertiary)] hover:bg-[var(--hover-bg)] transition cursor-pointer relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isImporting}
                />
                <Upload className="w-8 h-8 text-[var(--text-muted)] mb-2" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {selectedFile ? selectedFile.name : 'Click để chọn file CSV'}
                </span>
                <span className="text-xs text-[var(--text-muted)] mt-1">
                  Định dạng hỗ trợ: .csv
                </span>
              </div>

              {importResult && (
                <div className={`p-4 rounded-lg text-sm ${
                  importResult.success ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}>
                  <p className="font-semibold">{importResult.message}</p>
                  <p className="mt-1">
                    Đã tạo thành công: <strong>{importResult.insertedCount}</strong> tài khoản. <br/>
                    Đã bỏ qua (đã có tài khoản hoặc lỗi): <strong>{importResult.skippedCount}</strong>.
                  </p>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-red-500/10 max-h-32 overflow-y-auto space-y-1">
                      <p className="text-xs font-semibold">Chi tiết lỗi/bỏ qua:</p>
                      {importResult.errors.map((err, idx) => (
                        <p key={idx} className="text-xs text-red-400">• {err}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {importError && (
                <div className="p-3 bg-red-500/10 text-red-500 text-sm rounded-lg border border-red-500/20">
                  {importError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setShowImportModal(false);
                    setSelectedFile(null);
                    setImportResult(null);
                    setImportError(null);
                  }}
                  disabled={isImporting}
                >
                  Hủy
                </Button>
                <Button 
                  onClick={handleImportSubmit} 
                  disabled={!selectedFile || isImporting}
                >
                  {isImporting ? 'Đang import...' : 'Bắt đầu Import'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
