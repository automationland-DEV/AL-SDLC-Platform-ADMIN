/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from 'react';
import { Key, Camera, Loader2, Edit2, ShieldCheck } from 'lucide-react';
import { AvatarCropperModal } from './components/AvatarCropperModal';
import api from '../../services/api';
import { API_ROUTES } from '../../services/apiRoutes';
import { Button, Select, DatePicker } from '../../components/ui';
import { useAuthStore } from '../../stores';
import { userService } from '../../services/authService';
import toast from 'react-hot-toast';
import type { AuthUser } from '../../types';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('other');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setBirthday(user.birthday ? user.birthday.split('T')[0] : '');
      setGender(user.gender || 'other');
      setAvatarUrl(user.avatar || '');
    }
  }, [user]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa là 10MB');
      return;
    }
    
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setSelectedImage(reader.result?.toString() || null);
    });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUploadAvatar = async (croppedFile: File) => {
    try {
      setSelectedImage(null);
      setAvatarUploading(true);
      const formData = new FormData();
      formData.append('file', croppedFile);
      
      const response = await api.post(API_ROUTES.IMAGES.UPLOAD, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const imageUrl = response.data?.data?.url || response.data?.url || response.data?.imageUrl;
      if (imageUrl) {
        setAvatarUrl(imageUrl);
        const updatedUser = await userService.updateProfile({ avatar: imageUrl });
        setUser(updatedUser as unknown as AuthUser);
        toast.success('Cập nhật ảnh đại diện thành công');
      } else {
        throw new Error('Upload failed: No image URL returned');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Lỗi khi tải ảnh lên');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      toast.error('Vui lòng nhập họ và tên');
      return;
    }

    try {
      setIsSavingProfile(true);
      const updatedUser = await userService.updateProfile({
        fullName,
        phone,
        address,
        birthday,
        gender,
      });

      setUser(updatedUser as unknown as AuthUser);
      toast.success('Cập nhật thông tin thành công');
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Lỗi khi cập nhật thông tin');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Vui lòng điền đầy đủ thông tin mật khẩu');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu mới không trùng khớp');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    try {
      setIsSavingPassword(true);
      await userService.updateProfile({
        currentPassword,
        password: newPassword,
      });

      toast.success('Đổi mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Change password error:', error);
      toast.error('Lỗi khi đổi mật khẩu (Mật khẩu hiện tại có thể không đúng)');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto min-h-0 space-y-6 w-full font-sans pr-1">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">Hồ sơ Quản trị viên (Admin Profile)</h2>
        <p className="text-xs text-[var(--text-muted)] font-mono-code mt-0.5">Quản lý thông tin định danh và bảo mật tài khoản hệ thống</p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-[var(--border-color)] mb-6">
            <div className="relative group shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-20 h-20 rounded-xl object-cover border-2 border-[var(--border-color)] shadow-xs"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-sky-500/10 border-2 border-sky-500/30 flex items-center justify-center font-mono-code font-bold text-2xl text-sky-500 shadow-xs">
                  {fullName ? fullName.charAt(0).toUpperCase() : 'A'}
                </div>
              )}
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute inset-0 bg-slate-950/60 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                title="Thay đổi ảnh đại diện"
              >
                {avatarUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
            </div>

            <div className="text-center sm:text-left min-w-0 flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  {fullName || 'Administrator'}
                </h3>
                <span className="px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400 font-mono-code text-[10px] font-bold">
                  {user?.role || 'SUPER_ADMIN'}
                </span>
              </div>
              <p className="text-xs font-mono-code text-[var(--text-muted)] mt-1 truncate">
                {user?.email}
              </p>
            </div>
            
            <div className="sm:ml-auto">
              {!isEditingProfile && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setIsEditingProfile(true)}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Chỉnh sửa hồ sơ
                </Button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={`block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] ${!isEditingProfile ? 'select-none pointer-events-none' : ''}`}>Họ và tên</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên"
                disabled={!isEditingProfile}
                className={`w-full px-3.5 py-2 border border-[var(--border-color)] rounded-lg text-xs font-medium focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 bg-[var(--bg-input)] text-[var(--text-primary)] transition-all ${!isEditingProfile ? 'opacity-60 cursor-not-allowed pointer-events-none select-none' : ''}`}
              />
            </div>
            <div className="space-y-1.5">
              <label className={`block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] ${!isEditingProfile ? 'select-none pointer-events-none' : ''}`}>Email hệ thống</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3.5 py-2 border border-[var(--border-color)] rounded-lg text-xs font-mono-code bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed pointer-events-none select-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className={`block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] ${!isEditingProfile ? 'select-none pointer-events-none' : ''}`}>Ngày sinh</label>
              <DatePicker
                value={birthday}
                onChange={(val) => setBirthday(val)}
                className="w-full text-xs"
                disabled={!isEditingProfile}
              />
            </div>
            <div className="space-y-1.5">
              <label className={`block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] ${!isEditingProfile ? 'select-none pointer-events-none' : ''}`}>Giới tính</label>
              <Select
                value={gender}
                onChange={(val) => setGender(val as 'male' | 'female' | 'other')}
                options={[
                  { value: 'male', label: 'Nam' },
                  { value: 'female', label: 'Nữ' },
                  { value: 'other', label: 'Khác' }
                ]}
                className="w-full"
                disabled={!isEditingProfile}
              />
            </div>
            <div className="space-y-1.5">
              <label className={`block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] ${!isEditingProfile ? 'select-none pointer-events-none' : ''}`}>Số điện thoại</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại"
                disabled={!isEditingProfile}
                className={`w-full px-3.5 py-2 border border-[var(--border-color)] rounded-lg text-xs font-mono-code focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 bg-[var(--bg-input)] text-[var(--text-primary)] transition-all ${!isEditingProfile ? 'opacity-60 cursor-not-allowed pointer-events-none select-none' : ''}`}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className={`block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] ${!isEditingProfile ? 'select-none pointer-events-none' : ''}`}>Địa chỉ liên hệ</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Nhập địa chỉ"
                disabled={!isEditingProfile}
                className={`w-full px-3.5 py-2 border border-[var(--border-color)] rounded-lg text-xs focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 bg-[var(--bg-input)] text-[var(--text-primary)] transition-all ${!isEditingProfile ? 'opacity-60 cursor-not-allowed pointer-events-none select-none' : ''}`}
              />
            </div>
          </div>
          {isEditingProfile && (
            <div className="mt-6 flex justify-end gap-2.5 pt-4 border-t border-[var(--border-color)]">
              <Button variant="secondary" size="sm" onClick={() => setIsEditingProfile(false)} disabled={isSavingProfile}>
                Hủy
              </Button>
              <Button size="sm" onClick={() => { handleUpdateProfile(); }} disabled={isSavingProfile}>
                {isSavingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Lưu thay đổi
              </Button>
            </div>
          )}
        </div>

        {selectedImage && (
          <AvatarCropperModal
            imageSrc={selectedImage}
            onClose={() => setSelectedImage(null)}
            onCropComplete={handleUploadAvatar}
          />
        )}

        {/* Change Password Panel */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[var(--border-color)]">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center shrink-0">
              <Key size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">Đổi mật khẩu bảo mật</h4>
              <p className="text-xs text-[var(--text-muted)]">Cập nhật mật khẩu mã hóa để bảo vệ quyền truy cập Portal.</p>
            </div>
          </div>
          
          {user?.googleId ? (
            <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-2">
              <ShieldCheck size={16} className="shrink-0" />
              Tài khoản của bạn đang xác thực qua Google SSO. Bạn không cần thay đổi mật khẩu tại đây.
            </div>
          ) : (
            <div className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2 border border-[var(--border-color)] rounded-lg text-xs font-mono-code focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 bg-[var(--bg-input)] text-[var(--text-primary)] transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2 border border-[var(--border-color)] rounded-lg text-xs font-mono-code focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 bg-[var(--bg-input)] text-[var(--text-primary)] transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2 border border-[var(--border-color)] rounded-lg text-xs font-mono-code focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 bg-[var(--bg-input)] text-[var(--text-primary)] transition-all"
                />
              </div>
              <div className="pt-2">
                <Button variant="danger" size="sm" onClick={handleUpdatePassword} disabled={isSavingPassword}>
                  {isSavingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Cập nhật mật khẩu
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
