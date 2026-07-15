import { Button, Card, Badge } from '../../../../components/ui';
import type { User, UserRole, UserStatus } from '../../../../types';

interface UserViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export function UserViewModal({ isOpen, onClose, user }: UserViewModalProps) {
  if (!isOpen || !user) return null;

  const getRoleBadge = (role: UserRole) => {
    return (
      <Badge variant={role === 'super_admin' ? 'danger' : 'default'}>
        {role === 'super_admin' ? 'Super Admin' : 'User'}
      </Badge>
    );
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <Card className="w-full max-w-2xl m-4 relative flex flex-col max-h-[90vh]">
        <h3 className="text-lg font-bold mb-6 text-[var(--text-primary)]">
          Chi tiết người dùng
        </h3>
        
        <div className="flex-1 overflow-y-auto space-y-6">
          <div className="flex items-center gap-4">
            {user.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-14 h-14 rounded-xl object-cover border border-[var(--border-color)] shadow-sm" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-xl font-medium text-primary-600 dark:text-primary-300">
                {(user.fullName || user.email).charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h4 className="font-semibold text-lg text-[var(--text-primary)]">{user.fullName || 'Chưa cập nhật tên'}</h4>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">ID: {user.id}</p>
            </div>
          </div>

          <div className="border-t border-[var(--border-color)] pt-5">
            <div className="grid grid-cols-2 gap-y-5 gap-x-4 text-sm text-[var(--text-primary)]">
              <div className="col-span-1">
                <p className="text-[var(--text-muted)] font-medium mb-1.5">Email</p>
                <p className="font-medium text-[var(--text-primary)] break-all">{user.email}</p>
              </div>
              <div className="col-span-1">
                <p className="text-[var(--text-muted)] font-medium mb-1.5">Vai trò</p>
                <div>{getRoleBadge(user.role)}</div>
              </div>
              
              <div className="col-span-1">
                <p className="text-[var(--text-muted)] font-medium mb-1.5">Trạng thái</p>
                <div>{getStatusBadge(user.status)}</div>
              </div>
              <div className="col-span-1">
                <p className="text-[var(--text-muted)] font-medium mb-1.5">Số điện thoại</p>
                <p className="font-medium text-[var(--text-primary)]">{user.phone || '-'}</p>
              </div>

              <div className="col-span-1">
                <p className="text-[var(--text-muted)] font-medium mb-1.5">Ngày sinh</p>
                <p className="font-medium text-[var(--text-primary)]">{user.birthday ? new Date(user.birthday).toLocaleDateString('vi-VN') : '-'}</p>
              </div>
              <div className="col-span-1">
                <p className="text-[var(--text-muted)] font-medium mb-1.5">Giới tính</p>
                <p className="font-medium text-[var(--text-primary)]">
                  {user.gender === 'male' ? 'Nam' : user.gender === 'female' ? 'Nữ' : user.gender === 'other' ? 'Khác' : '-'}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-[var(--text-muted)] font-medium mb-1.5">Địa chỉ</p>
                <p className="font-medium text-[var(--text-primary)]">{user.address || '-'}</p>
              </div>

              <div className="col-span-1">
                <p className="text-[var(--text-muted)] font-medium mb-1.5">Ngày tạo</p>
                <p className="font-medium text-[var(--text-primary)]">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '-'}</p>
              </div>
              <div className="col-span-1">
                <p className="text-[var(--text-muted)] font-medium mb-1.5">Cập nhật cuối</p>
                <p className="font-medium text-[var(--text-primary)]">{user.updatedAt ? new Date(user.updatedAt).toLocaleDateString('vi-VN') : '-'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-[var(--border-color)]">
          <Button onClick={onClose} className="px-6">
            Đóng
          </Button>
        </div>
      </Card>
    </div>
  );
}
