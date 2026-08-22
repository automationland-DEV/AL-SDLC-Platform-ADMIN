import { useNavigate, useParams, Link } from 'react-router-dom';
import { Edit, User as UserIcon, Mail, Phone, MapPin, Calendar, Users } from 'lucide-react';
import { Button, Badge, PageHeader } from '../../../components/ui';
import { useUserDetailQuery } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import type { UserRole, UserStatus } from '../../../types';

const getRoleBadge = (role: UserRole) => (
  <Badge variant={role === 'super_admin' ? 'info' : 'default'} mono>
    {role === 'super_admin' ? 'SUPER_ADMIN' : 'USER'}
  </Badge>
);

const getStatusBadge = (status: UserStatus, language: string) => {
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

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { data: userRaw, isLoading } = useUserDetailQuery(id ?? null);

  const user = userRaw as import('../../../types').User | undefined;

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
        <UserIcon className="w-12 h-12 mx-auto text-[var(--text-muted)] stroke-1 mb-3" />
        <p className="text-sm text-[var(--text-muted)]">
          {language === 'vi' ? 'Không tìm thấy người dùng.' : 'User not found.'}
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/users')}>
          {language === 'vi' ? 'Quay lại danh sách' : 'Back to list'}
        </Button>
      </div>
    );
  }

  const infoRows = [
    {
      icon: <Mail className="w-4 h-4" />,
      label: 'Email',
      value: user.email,
    },
    {
      icon: <Phone className="w-4 h-4" />,
      label: language === 'vi' ? 'Số điện thoại' : 'Phone',
      value: user.phone || '-',
    },
    {
      icon: <MapPin className="w-4 h-4" />,
      label: language === 'vi' ? 'Địa chỉ' : 'Address',
      value: user.address || '-',
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      label: language === 'vi' ? 'Ngày sinh' : 'Birthday',
      value: user.birthday ? new Date(user.birthday).toLocaleDateString('vi-VN') : '-',
    },
    {
      icon: <Users className="w-4 h-4" />,
      label: language === 'vi' ? 'Giới tính' : 'Gender',
      value:
        user.gender === 'male'
          ? language === 'vi' ? 'Nam' : 'Male'
          : user.gender === 'female'
          ? language === 'vi' ? 'Nữ' : 'Female'
          : user.gender === 'other'
          ? language === 'vi' ? 'Khác' : 'Other'
          : '-',
    },
  ];

  return (
    <div className="w-full">
      <PageHeader
        breadcrumbs={[
          { label: language === 'vi' ? 'Quản lý User' : 'User Management', href: '/users' },
          { label: language === 'vi' ? 'Chi tiết User' : 'User Detail' },
        ]}
        title={language === 'vi' ? 'Chi tiết người dùng' : 'User Detail'}
        actions={
          <Link to={`/users/${id}/edit`}>
            <Button size="sm">
              <Edit className="w-4 h-4" />
              {language === 'vi' ? 'Chỉnh sửa' : 'Edit'}
            </Button>
          </Link>
        }
      />

      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
        {/* Profile Header */}
        <div className="p-6 flex items-center gap-4 border-b border-[var(--border-color)] bg-gradient-to-r from-sky-500/5 to-transparent">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.fullName}
              className="w-16 h-16 rounded-2xl object-cover border border-[var(--border-color)] shadow-sm shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-500 font-bold text-2xl shrink-0">
              {(user.fullName || user.email).charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-[var(--text-primary)] truncate">
              {user.fullName || (language === 'vi' ? 'Chưa cập nhật tên' : 'Name not set')}
            </h3>
            <p className="text-xs font-mono-code text-[var(--text-muted)] mt-0.5 truncate">
              ID: #{user.id?.slice(-8) || 'N/A'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {getRoleBadge(user.role)}
              {getStatusBadge(user.status, language)}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {infoRows.map((row, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="mt-0.5 w-7 h-7 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] shrink-0">
                {row.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[var(--text-muted)] font-medium mb-0.5">{row.label}</p>
                <p className="text-sm font-medium text-[var(--text-primary)] break-all">{row.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Timestamps */}
        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)]/30 flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-[var(--text-muted)] font-mono-code">
          <span>
            {language === 'vi' ? 'Ngày tạo:' : 'Created:'}{' '}
            <span className="text-[var(--text-secondary)]">
              {user.createdAt ? new Date(user.createdAt).toLocaleString('vi-VN') : '-'}
            </span>
          </span>
          <span className="hidden sm:inline text-[var(--border-color)]">|</span>
          <span>
            {language === 'vi' ? 'Cập nhật cuối:' : 'Updated:'}{' '}
            <span className="text-[var(--text-secondary)]">
              {user.updatedAt ? new Date(user.updatedAt).toLocaleString('vi-VN') : '-'}
            </span>
          </span>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-color)] flex justify-end">
          <Button variant="secondary" onClick={() => navigate('/users')}>
            {language === 'vi' ? 'Quay lại danh sách' : 'Back to list'}
          </Button>
        </div>
      </div>
    </div>
  );
}
