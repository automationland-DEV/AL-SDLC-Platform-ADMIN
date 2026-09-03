import { useState } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import {
  Edit,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  Copy,
  Check,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Badge, PageHeader } from '../../../components/ui';
import { useUserDetailQuery } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import type { UserRole, UserStatus, User } from '../../../types';

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
      {labels[status] || status?.toUpperCase() || 'UNKNOWN'}
    </Badge>
  );
};

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useTranslation();
  const { data: userRaw, isLoading } = useUserDetailQuery(id ?? null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const returnPath = (location.state as { from?: string } | undefined)?.from || '/users';

  const user = (userRaw as { data?: User } | undefined)?.data ?? (userRaw as User | undefined);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(language === 'vi' ? `Đã sao chép ${field}` : `Copied ${field}`);
    setTimeout(() => setCopiedField(null), 2000);
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
      <div className="max-w-3xl mx-auto text-center py-24">
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

  const formatGender = (gender?: string) => {
    if (gender === 'male') return language === 'vi' ? 'Nam' : 'Male';
    if (gender === 'female') return language === 'vi' ? 'Nữ' : 'Female';
    if (gender === 'other') return language === 'vi' ? 'Khác' : 'Other';
    return null;
  };

  const emptyPlaceholder = (
    <span className="text-xs text-[var(--text-muted)] italic font-normal">
      {language === 'vi' ? 'Chưa cập nhật' : 'Not provided'}
    </span>
  );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
      <PageHeader
        breadcrumbs={[
          { label: language === 'vi' ? 'Quản lý User' : 'User Management', href: '/users' },
          { label: language === 'vi' ? 'Chi tiết User' : 'User Detail' },
        ]}
        title={language === 'vi' ? 'Chi tiết người dùng' : 'User Detail'}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate(returnPath)}>
              <ArrowLeft className="w-4 h-4" />
              {language === 'vi' ? 'Quay lại' : 'Back'}
            </Button>
            <Link to={`/users/${id}/edit`} state={{ from: `/users/${id}` }}>
              <Button size="sm">
                <Edit className="w-4 h-4" />
                {language === 'vi' ? 'Chỉnh sửa' : 'Edit'}
              </Button>
            </Link>
          </div>
        }
      />

      {/* Hero Profile Card */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent">
          <div className="flex items-center gap-5">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.fullName || 'Avatar'}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-md shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-bold text-3xl flex items-center justify-center shadow-md shrink-0 select-none">
                {(user.fullName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-[var(--text-primary)] truncate">
                  {user.fullName || (language === 'vi' ? 'Chưa cập nhật họ tên' : 'Name not set')}
                </h2>
                <div className="flex items-center gap-1.5">
                  {getRoleBadge(user.role)}
                  {getStatusBadge(user.status, language)}
                </div>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-1 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>{user.email}</span>
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs font-mono text-[var(--text-muted)]">
                <span>ID: #{user.id?.slice(-8) || id?.slice(-8)}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(user.id || id || '', 'ID')}
                  className="hover:text-sky-500 transition-colors p-0.5"
                  title="Copy full ID"
                >
                  {copiedField === 'ID' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 border-[var(--border-color)] pt-4 sm:pt-0">
            <span className="text-xs text-[var(--text-muted)]">
              {language === 'vi' ? 'Tham gia từ:' : 'Member since:'}
            </span>
            <span className="text-xs font-medium text-[var(--text-primary)]">
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Details Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Contact Information */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border-color)]">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {language === 'vi' ? 'Thông tin liên hệ' : 'Contact Information'}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                {language === 'vi' ? 'Email, điện thoại và địa chỉ' : 'Email, phone and address'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] min-w-[120px]">
                <Mail className="w-3.5 h-3.5" />
                <span>Email:</span>
              </div>
              <div className="text-sm font-medium text-[var(--text-primary)] text-right break-all flex items-center gap-2">
                <span>{user.email}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(user.email, 'Email')}
                  className="hover:text-sky-500 text-[var(--text-muted)] transition-colors"
                  title="Copy email"
                >
                  {copiedField === 'Email' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] min-w-[120px]">
                <Phone className="w-3.5 h-3.5" />
                <span>{language === 'vi' ? 'Số điện thoại:' : 'Phone:'}</span>
              </div>
              <div className="text-sm font-medium text-[var(--text-primary)] text-right">
                {user.phone ? user.phone : emptyPlaceholder}
              </div>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] min-w-[120px]">
                <MapPin className="w-3.5 h-3.5" />
                <span>{language === 'vi' ? 'Địa chỉ:' : 'Address:'}</span>
              </div>
              <div className="text-sm font-medium text-[var(--text-primary)] text-right max-w-xs">
                {user.address ? user.address : emptyPlaceholder}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Personal Information */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border-color)]">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {language === 'vi' ? 'Thông tin cá nhân' : 'Personal Information'}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                {language === 'vi' ? 'Ngày sinh, giới tính và hồ sơ' : 'Birthday, gender and profile'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] min-w-[120px]">
                <Calendar className="w-3.5 h-3.5" />
                <span>{language === 'vi' ? 'Ngày sinh:' : 'Birthday:'}</span>
              </div>
              <div className="text-sm font-medium text-[var(--text-primary)] text-right">
                {user.birthday ? new Date(user.birthday).toLocaleDateString('vi-VN') : emptyPlaceholder}
              </div>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] min-w-[120px]">
                <Users className="w-3.5 h-3.5" />
                <span>{language === 'vi' ? 'Giới tính:' : 'Gender:'}</span>
              </div>
              <div className="text-sm font-medium text-[var(--text-primary)] text-right">
                {formatGender(user.gender) || emptyPlaceholder}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: System & Security Details */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border-color)]">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {language === 'vi' ? 'Thông tin hệ thống' : 'System Information'}
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              {language === 'vi' ? 'Mã định danh, mốc thời gian tạo và cập nhật' : 'Identifiers, creation and update timestamps'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)]/50 border border-[var(--border-color)] space-y-1">
            <p className="text-xs text-[var(--text-muted)] font-medium">
              {language === 'vi' ? 'ID hệ thống đầy đủ' : 'Full System ID'}
            </p>
            <p className="text-xs font-mono text-[var(--text-primary)] truncate" title={user.id || id}>
              {user.id || id}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)]/50 border border-[var(--border-color)] space-y-1">
            <p className="text-xs text-[var(--text-muted)] font-medium">
              {language === 'vi' ? 'Ngày khởi tạo' : 'Created At'}
            </p>
            <p className="text-xs font-mono text-[var(--text-primary)]">
              {user.createdAt ? new Date(user.createdAt).toLocaleString('vi-VN') : '-'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-tertiary)]/50 border border-[var(--border-color)] space-y-1">
            <p className="text-xs text-[var(--text-muted)] font-medium">
              {language === 'vi' ? 'Cập nhật lần cuối' : 'Last Updated'}
            </p>
            <p className="text-xs font-mono text-[var(--text-primary)]">
              {user.updatedAt ? new Date(user.updatedAt).toLocaleString('vi-VN') : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
