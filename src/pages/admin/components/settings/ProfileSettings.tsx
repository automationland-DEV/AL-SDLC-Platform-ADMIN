import { useState, useEffect } from 'react';
import { User, Key } from 'lucide-react';
import { Button } from '../../../../components/ui';
import { useAuthStore } from '../../../../stores';
import { userService } from '../../../../services/authService';
import toast from 'react-hot-toast';

export function ProfileSettings() {
  const { user, setUser } = useAuthStore();
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Profile Form State
  const [fullName, setFullName] = useState('');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
       
      setFullName(user.fullName || '');
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      toast.error('Vui lòng nhập họ và tên');
      return;
    }

    try {
      setIsSavingProfile(true);
      const updatedUser = await userService.updateProfile({ fullName });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setUser(updatedUser as any); // Type cast if needed depending on AuthStore types
      toast.success('Cập nhật thông tin thành công');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Lỗi khi cập nhật thông tin');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (newPassword === currentPassword) {
      toast.error('Mật khẩu mới không được trùng với mật khẩu hiện tại');
      return;
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      toast.error('Mật khẩu mới phải có ít nhất 8 ký tự, 1 chữ in hoa và 1 chữ số');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      setIsSavingPassword(true);
      await userService.updatePassword({
        currentPassword,
        password: newPassword,
      });
      toast.success('Đổi mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Cập nhật mật khẩu thành công');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message;
      let displayMsg = Array.isArray(errorMsg) ? errorMsg[0] : errorMsg;
      if (displayMsg === 'Current password is incorrect.') {
        displayMsg = 'Mật khẩu hiện tại không chính xác';
      }
      toast.error(displayMsg || 'Mật khẩu cũ không chính xác hoặc có lỗi xảy ra');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
      <div>
        <h3 className="text-lg font-bold text-[var(--text-primary)]">Hồ sơ cá nhân</h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Cập nhật thông tin tài khoản và bảo mật.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Thông tin cá nhân */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4 border-b border-[var(--border-color)] pb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-[var(--text-primary)]">Thông tin cơ bản</h4>
              <p className="text-xs text-[var(--text-secondary)]">Thông tin hiển thị công khai trên hệ thống.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--text-primary)]">Họ và tên</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên"
                className="w-full px-4 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--text-primary)]">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-start">
            <Button onClick={handleUpdateProfile} disabled={isSavingProfile}>
              Lưu thay đổi
            </Button>
          </div>
        </div>

        {/* Đổi mật khẩu */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4 border-b border-[var(--border-color)] pb-4">
            <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-[var(--text-primary)]">Đổi mật khẩu</h4>
              <p className="text-xs text-[var(--text-secondary)]">Cập nhật mật khẩu để bảo vệ tài khoản.</p>
            </div>
          </div>
          
          {user?.googleId ? (
            <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-sm">
              Tài khoản của bạn được liên kết với Google. Bạn không thể thay đổi mật khẩu tại đây.
            </div>
          ) : (
            <>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--text-primary)]">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    className="w-full px-4 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--text-primary)]">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    className="w-full px-4 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--text-primary)]">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Xác nhận mật khẩu mới"
                    className="w-full px-4 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-start">
                <Button variant="danger" onClick={handleUpdatePassword} disabled={isSavingPassword}>
                  Cập nhật mật khẩu
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
