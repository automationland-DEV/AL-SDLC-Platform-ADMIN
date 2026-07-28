/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Button, Select } from '../../../../components/ui';
import { UserPlus, X } from 'lucide-react';
import { useTranslation } from '../../../../i18n/useTranslation';
import type { User, UserRole, UserStatus } from '../../../../types';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser: User | null;
  onSave: (userId: string, role: string, status: string) => Promise<void>;
  onCreate: (userData: { email: string; password?: string; fullName?: string; role: string; status: string }) => Promise<void>;
}

export function UserFormModal({ isOpen, onClose, selectedUser, onSave, onCreate }: UserFormModalProps) {
  const [editRole, setEditRole] = useState<string>('user');
  const [editStatus, setEditStatus] = useState<string>('active');
  
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [newStatus, setNewStatus] = useState('active');
  
  const [isSaving, setIsSaving] = useState(false);
  const { t, language } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      if (selectedUser) {
        setEditRole(selectedUser.role);
        setEditStatus(selectedUser.status);
      } else {
        setNewEmail('');
        setNewPassword('');
        setConfirmPassword('');
        setNewFullName('');
        setNewRole('user');
        setNewStatus('active');
      }
    }
  }, [isOpen, selectedUser]);

  if (!isOpen) return null;

  const handleSaveChanges = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      await onSave(selectedUser.id, editRole, editStatus);
      onClose();
    } catch {
      // Error handled by parent or here
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateUser = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!newEmail.trim()) {
      toast.error(language === 'vi' ? 'Vui lòng nhập Email' : 'Please input Email');
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(newEmail)) {
      toast.error(language === 'vi' ? 'Email không hợp lệ' : 'Invalid email address');
      return;
    }
    if (!newPassword.trim()) {
      toast.error(language === 'vi' ? 'Vui lòng nhập Mật khẩu' : 'Please input Password');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(language === 'vi' ? 'Mật khẩu nhập lại không khớp' : 'Passwords do not match');
      return;
    }
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordPattern.test(newPassword)) {
      toast.error(language === 'vi' 
        ? 'Mật khẩu phải dài ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt' 
        : 'Password must be at least 8 characters long, including uppercase, lowercase, numbers and special characters');
      return;
    }
    
    setIsSaving(true);
    try {
      await onCreate({
        email: newEmail,
        password: newPassword,
        fullName: newFullName,
        role: newRole as UserRole,
        status: newStatus as UserStatus,
      });
      onClose();
    } catch {
      // Error is expected to be handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[95vh] border border-[var(--border-color)] bg-[var(--bg-card)] rounded-2xl transform transition-all">
        
        {/* Premium Header */}
        <div className="p-5 rounded-t-2xl border-b border-[var(--border-color)] flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-sm">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">
                {selectedUser 
                  ? (language === 'vi' ? 'Chỉnh sửa User' : 'Edit User') 
                  : (language === 'vi' ? 'Thêm User mới' : 'Add New User')}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {selectedUser 
                  ? (language === 'vi' ? 'Cập nhật vai trò và trạng thái của người dùng.' : 'Update user role and status.') 
                  : (language === 'vi' ? 'Điền thông tin bên dưới để tạo tài khoản mới.' : 'Fill in information below to create a new account.')}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] transition-colors border border-[var(--border-color)]"
            title="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {selectedUser ? (
            <div className="space-y-4">
              {/* User Info Banner */}
              <div className="bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 rounded-xl p-5 border border-primary-100 dark:border-primary-900/50 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-200 dark:bg-primary-800 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-xl">
                  {(selectedUser.fullName || selectedUser.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-[var(--text-primary)]">
                    {selectedUser.fullName || (language === 'vi' ? 'Chưa cập nhật tên' : 'Name not updated')}
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)]">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">Vai trò</label>
                  <Select
                    value={editRole}
                    onChange={(val) => setEditRole(val)}
                    options={[
                      { value: 'user', label: 'User' },
                      { value: 'super_admin', label: 'Super Admin' }
                    ]}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                    {language === 'vi' ? 'Trạng thái' : 'Status'}
                  </label>
                  <Select
                    value={editStatus}
                    onChange={(val) => setEditStatus(val)}
                    options={[
                      { value: 'active', label: language === 'vi' ? 'Hoạt động' : 'Active' },
                      { value: 'inactive', label: language === 'vi' ? 'Không hoạt động' : 'Inactive' },
                      { value: 'pending_verification', label: language === 'vi' ? 'Chờ xác thực' : 'Pending Verification' },
                      { value: 'suspended', label: language === 'vi' ? 'Đình chỉ' : 'Suspended' }
                    ]}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="example@domain.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-[var(--bg-tertiary)] hover:bg-[var(--input-bg)] text-[var(--text-primary)] transition-all shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  {language === 'vi' ? 'Mật khẩu' : 'Password'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder={language === 'vi' ? 'Nhập mật khẩu' : 'Enter password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-[var(--bg-tertiary)] hover:bg-[var(--input-bg)] text-[var(--text-primary)] transition-all shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  {language === 'vi' ? 'Xác nhận mật khẩu' : 'Confirm Password'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder={language === 'vi' ? 'Nhập lại mật khẩu' : 'Re-enter password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-[var(--bg-tertiary)] hover:bg-[var(--input-bg)] text-[var(--text-primary)] transition-all shadow-sm"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  {language === 'vi' ? 'Họ tên' : 'Full Name'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'vi' ? 'Nguyễn Văn A' : 'John Doe'}
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-[var(--bg-tertiary)] hover:bg-[var(--input-bg)] text-[var(--text-primary)] transition-all shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  {language === 'vi' ? 'Vai trò' : 'Role'}
                </label>
                <Select
                  value={newRole}
                  onChange={(val) => setNewRole(val)}
                  options={[
                    { value: 'user', label: 'User' },
                    { value: 'super_admin', label: 'Super Admin' }
                  ]}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  {language === 'vi' ? 'Trạng thái' : 'Status'}
                </label>
                <Select
                  value={newStatus}
                  onChange={(val) => setNewStatus(val)}
                  options={[
                    { value: 'active', label: language === 'vi' ? 'Hoạt động' : 'Active' },
                    { value: 'inactive', label: language === 'vi' ? 'Không hoạt động' : 'Inactive' },
                    { value: 'pending_verification', label: language === 'vi' ? 'Chờ xác thực' : 'Pending Verification' },
                    { value: 'suspended', label: language === 'vi' ? 'Đình chỉ' : 'Suspended' }
                  ]}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-[var(--border-color)] rounded-b-2xl flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="rounded-xl px-6 font-semibold">
            {t('common.cancel')}
          </Button>
          {selectedUser ? (
            <Button type="button" onClick={handleSaveChanges} disabled={isSaving} className="rounded-xl px-6 font-semibold bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-sm hover:shadow-md transition-all">
              {isSaving ? (language === 'vi' ? 'Đang lưu...' : 'Saving...') : t('common.save')}
            </Button>
          ) : (
            <Button type="button" onClick={(e) => handleCreateUser(e)} disabled={isSaving} className="rounded-xl px-6 font-semibold bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-sm hover:shadow-md transition-all">
              {isSaving ? (language === 'vi' ? 'Đang tạo...' : 'Creating...') : (language === 'vi' ? 'Tạo mới User' : 'Create New User')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
