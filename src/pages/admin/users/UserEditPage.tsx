import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { UserCog } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Select, Badge, PageHeader } from '../../../components/ui';
import { useUserDetailQuery, useUpdateUserRoleMutation, useUpdateUserStatusMutation } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';


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

export default function UserEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useTranslation();

  const returnPath = (location.state as { from?: string } | undefined)?.from || (id ? `/users/${id}` : '/users');

  const { data: userRaw, isLoading } = useUserDetailQuery(id ?? null);
  const user = (userRaw as { data?: import('../../../types').User } | undefined)?.data ?? (userRaw as import('../../../types').User | undefined);

  const updateRoleMutation = useUpdateUserRoleMutation();
  const updateStatusMutation = useUpdateUserStatusMutation();

  const [editRole, setEditRole] = useState<string>('user');
  const [editStatus, setEditStatus] = useState<string>('active');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setEditRole(user.role);
      setEditStatus(user.status);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    setIsSaving(true);
    try {
      if (editRole !== user.role) {
        await updateRoleMutation.mutateAsync({ id, role: editRole });
      }
      if (editStatus !== user.status) {
        await updateStatusMutation.mutateAsync({ id, status: editStatus });
      }
      toast.success(language === 'vi' ? 'Cập nhật người dùng thành công' : 'User updated successfully');
      navigate(returnPath);
    } catch (error) {
      toast.error(getErrorMessage(error, language === 'vi' ? 'Cập nhật người dùng thất bại' : 'Failed to update user'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto text-center py-24">
        <p className="text-sm text-[var(--text-muted)]">
          {language === 'vi' ? 'Không tìm thấy người dùng.' : 'User not found.'}
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/users')}>
          {language === 'vi' ? 'Quay lại danh sách' : 'Back to list'}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <PageHeader
        breadcrumbs={[
          { label: language === 'vi' ? 'Quản lý User' : 'User Management', href: '/users' },
          ...(returnPath.includes('/users/')
            ? [{ label: user.fullName || user.email, href: `/users/${id}` }]
            : []),
          { label: language === 'vi' ? 'Chỉnh sửa' : 'Edit' },
        ]}
        title={language === 'vi' ? 'Chỉnh sửa User' : 'Edit User'}
        subtitle={language === 'vi' ? 'Cập nhật vai trò và trạng thái của người dùng.' : 'Update user role and status.'}
      
        actions={
          <Button variant="secondary" onClick={() => navigate(returnPath)} className="px-4">
            {language === 'vi' ? 'Quay lại' : 'Go Back'}
          </Button>
        }
      />

      <form onSubmit={handleSave}>
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm">
          {/* Card Header */}
          <div className="p-5 border-b border-[var(--border-color)] flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-500">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {language === 'vi' ? 'Thông tin chỉnh sửa' : 'Edit Information'}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {language === 'vi' ? 'Chỉ có thể chỉnh sửa Vai trò và Trạng thái.' : 'Only Role and Status can be modified.'}
              </p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* User Info Banner */}
            <div className="bg-gradient-to-r from-sky-500/5 to-transparent rounded-xl p-4 border border-[var(--border-color)] flex items-center gap-4">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-12 h-12 rounded-xl object-cover border border-[var(--border-color)] shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-500 font-bold text-lg shrink-0">
                  {(user.fullName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                  {user.fullName || (language === 'vi' ? 'Chưa cập nhật tên' : 'Name not set')}
                </p>
                <p className="text-xs font-mono-code text-[var(--text-muted)] truncate">{user.email}</p>
                <p className="text-xs font-mono-code text-[var(--text-muted)] mt-0.5">#{user.id?.slice(-8)}</p>
              </div>
            </div>

            {/* Role & Status selects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[var(--text-primary)]">
                  {language === 'vi' ? 'Vai trò' : 'Role'}
                </label>
                <Select
                  value={editRole}
                  onChange={setEditRole}
                  options={[
                    { value: 'user', label: 'User' },
                    { value: 'super_admin', label: 'Super Admin' },
                  ]}
                  className="w-full"
                />
                <p className="text-xs text-[var(--text-muted)]">
                  {language === 'vi' ? 'Hiện tại:' : 'Current:'}{' '}
                  <Badge variant={user.role === 'super_admin' ? 'info' : 'default'} mono>
                    {user.role === 'super_admin' ? 'SUPER_ADMIN' : 'USER'}
                  </Badge>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[var(--text-primary)]">
                  {language === 'vi' ? 'Trạng thái' : 'Status'}
                </label>
                <Select
                  value={editStatus}
                  onChange={setEditStatus}
                  options={[
                    { value: 'active', label: language === 'vi' ? 'Hoạt động' : 'Active' },
                    { value: 'inactive', label: language === 'vi' ? 'Không hoạt động' : 'Inactive' },
                    { value: 'pending_verification', label: language === 'vi' ? 'Chờ xác thực' : 'Pending Verification' },
                    { value: 'suspended', label: language === 'vi' ? 'Đình chỉ' : 'Suspended' },
                  ]}
                  className="w-full"
                />
                <p className="text-xs text-[var(--text-muted)]">
                  {language === 'vi' ? 'Hiện tại:' : 'Current:'}{' '}
                  <Badge variant={
                    user.status === 'active' ? 'success' :
                    user.status === 'pending_verification' ? 'warning' : 'danger'
                  } mono>
                    {user.status.toUpperCase()}
                  </Badge>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)]/30 flex justify-end gap-3 rounded-b-2xl">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(returnPath)}
              className="px-6"
            >
              {language === 'vi' ? 'Hủy' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={isSaving} className="px-6">
              {isSaving
                ? (language === 'vi' ? 'Đang lưu...' : 'Saving...')
                : (language === 'vi' ? 'Lưu thay đổi' : 'Save Changes')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
