import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Select, PageHeader } from '../../../components/ui';
import { useCreateUserMutation } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import type { UserRole, UserStatus } from '../../../types';

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

export default function UserNewPage() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const createUserMutation = useCreateUserMutation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('user');
  const [status, setStatus] = useState('active');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error(language === 'vi' ? 'Vui lòng nhập Email' : 'Please input Email');
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      toast.error(language === 'vi' ? 'Email không hợp lệ' : 'Invalid email address');
      return;
    }
    if (!password.trim()) {
      toast.error(language === 'vi' ? 'Vui lòng nhập Mật khẩu' : 'Please input Password');
      return;
    }
    if (password !== confirmPassword) {
      toast.error(language === 'vi' ? 'Mật khẩu nhập lại không khớp' : 'Passwords do not match');
      return;
    }
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordPattern.test(password)) {
      toast.error(
        language === 'vi'
          ? 'Mật khẩu phải dài ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
          : 'Password must be at least 8 characters including uppercase, lowercase, numbers and special characters'
      );
      return;
    }

    setIsSaving(true);
    try {
      await createUserMutation.mutateAsync({
        email,
        password,
        fullName,
        role: role as UserRole,
        status: status as UserStatus,
      } as Parameters<typeof createUserMutation.mutateAsync>[0]);
      toast.success(language === 'vi' ? 'Tạo người dùng thành công' : 'User created successfully');
      navigate('/users');
    } catch (error) {
      toast.error(getErrorMessage(error, language === 'vi' ? 'Tạo người dùng thất bại' : 'Failed to create user'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full">
      <PageHeader
        breadcrumbs={[
          { label: language === 'vi' ? 'Quản lý User' : 'User Management', href: '/users' },
          { label: language === 'vi' ? 'Thêm User mới' : 'Add New User' },
        ]}
        title={language === 'vi' ? 'Thêm User mới' : 'Add New User'}
        subtitle={language === 'vi' ? 'Điền thông tin bên dưới để tạo tài khoản mới.' : 'Fill in information below to create a new account.'}
      
        actions={
          <Button variant="secondary" onClick={() => navigate(-1)} className="px-4">
            {language === 'vi' ? 'Quay lại' : 'Go Back'}
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm">
          {/* Card Header */}
          <div className="p-5 border-b border-[var(--border-color)] flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-500">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {language === 'vi' ? 'Thông tin tài khoản' : 'Account Information'}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {language === 'vi' ? 'Các trường có dấu * là bắt buộc' : 'Fields marked with * are required'}
              </p>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Email - full width */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-sm font-semibold text-[var(--text-primary)]">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="example@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-all text-sm"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[var(--text-primary)]">
                  {language === 'vi' ? 'Mật khẩu' : 'Password'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder={language === 'vi' ? 'Nhập mật khẩu' : 'Enter password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-all text-sm"
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[var(--text-primary)]">
                  {language === 'vi' ? 'Xác nhận mật khẩu' : 'Confirm Password'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder={language === 'vi' ? 'Nhập lại mật khẩu' : 'Re-enter password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-all text-sm"
                />
              </div>

              {/* Full Name - full width */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-sm font-semibold text-[var(--text-primary)]">
                  {language === 'vi' ? 'Họ tên' : 'Full Name'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'vi' ? 'Nguyễn Văn A' : 'John Doe'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-all text-sm"
                />
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[var(--text-primary)]">
                  {language === 'vi' ? 'Vai trò' : 'Role'}
                </label>
                <Select
                  value={role}
                  onChange={setRole}
                  options={[
                    { value: 'user', label: 'User' },
                    { value: 'super_admin', label: 'Super Admin' },
                  ]}
                  className="w-full"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[var(--text-primary)]">
                  {language === 'vi' ? 'Trạng thái' : 'Status'}
                </label>
                <Select
                  value={status}
                  onChange={setStatus}
                  options={[
                    { value: 'active', label: language === 'vi' ? 'Hoạt động' : 'Active' },
                    { value: 'inactive', label: language === 'vi' ? 'Không hoạt động' : 'Inactive' },
                    { value: 'pending_verification', label: language === 'vi' ? 'Chờ xác thực' : 'Pending Verification' },
                    { value: 'suspended', label: language === 'vi' ? 'Đình chỉ' : 'Suspended' },
                  ]}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)]/30 flex justify-end gap-3 rounded-b-2xl">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/users')}
              className="px-6"
            >
              {language === 'vi' ? 'Hủy' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={isSaving} className="px-6">
              {isSaving
                ? (language === 'vi' ? 'Đang tạo...' : 'Creating...')
                : (language === 'vi' ? 'Tạo mới User' : 'Create User')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
