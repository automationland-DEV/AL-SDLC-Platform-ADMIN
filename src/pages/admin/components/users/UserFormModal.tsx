/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../../../../components/ui';
import { UserPlus, X } from 'lucide-react';
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
      toast.error('Vui lòng nhập Email');
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(newEmail)) {
      toast.error('Email không hợp lệ');
      return;
    }
    if (!newPassword.trim()) {
      toast.error('Vui lòng nhập Mật khẩu');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu nhập lại không khớp');
      return;
    }
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordPattern.test(newPassword)) {
      toast.error('Mật khẩu phải dài ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt');
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
      <div className="w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[95vh] border border-[var(--border-color)] bg-[var(--card-bg)] rounded-2xl transform transition-all">
        
        {/* Premium Header */}
        <div className="p-5 rounded-t-2xl border-b border-[var(--border-color)] flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-sm">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">
                {selectedUser ? 'Chỉnh sửa User' : 'Thêm User mới'}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {selectedUser ? 'Cập nhật vai trò và trạng thái của người dùng.' : 'Điền thông tin bên dưới để tạo tài khoản mới.'}
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
                  <h4 className="font-semibold text-lg text-[var(--text-primary)]">{selectedUser.fullName || 'Chưa cập nhật tên'}</h4>
                  <p className="text-sm text-[var(--text-secondary)]">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">Vai trò</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)] shadow-sm"
                  >
                    <option value="user">User</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">Trạng thái</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)] shadow-sm"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                    <option value="pending_verification">Chờ xác thực</option>
                    <option value="suspended">Đình chỉ</option>
                  </select>
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
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-[var(--bg-tertiary)] hover:bg-[var(--input-bg)] text-[var(--text-primary)] transition-all shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-[var(--bg-tertiary)] hover:bg-[var(--input-bg)] text-[var(--text-primary)] transition-all shadow-sm"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  Họ tên
                </label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-[var(--bg-tertiary)] hover:bg-[var(--input-bg)] text-[var(--text-primary)] transition-all shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">Vai trò</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)] shadow-sm"
                >
                  <option value="user">User</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">Trạng thái</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)] shadow-sm"
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                  <option value="pending_verification">Chờ xác thực</option>
                  <option value="suspended">Đình chỉ</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-[var(--border-color)] rounded-b-2xl flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="rounded-xl px-6 font-semibold">
            Hủy bỏ
          </Button>
          {selectedUser ? (
            <Button type="button" onClick={handleSaveChanges} disabled={isSaving} className="rounded-xl px-6 font-semibold bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-sm hover:shadow-md transition-all">
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          ) : (
            <Button type="button" onClick={(e) => handleCreateUser(e)} disabled={isSaving} className="rounded-xl px-6 font-semibold bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-sm hover:shadow-md transition-all">
              {isSaving ? 'Đang tạo...' : 'Tạo mới User'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
