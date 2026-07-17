import { useState, useEffect, useRef } from 'react';
import { Key, Camera, Loader2 } from 'lucide-react';
import { AvatarCropperModal } from './components/AvatarCropperModal';
import api from '../../services/api';
import { API_ROUTES } from '../../services/apiRoutes';
import { Button } from '../../components/ui';
import { useAuthStore } from '../../stores';
import { userService } from '../../services/authService';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Profile Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('other');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      // Format birthday for input type="date" if needed, assuming user.birthday is ISO string or YYYY-MM-DD
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
    
    // Read the file for the cropper
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setUser(updatedUser as any);
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
        birthday: birthday || undefined,
        gender,
        avatar: avatarUrl || undefined
      });
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
    if (newPassword.length < 8) {
      toast.error('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      setIsSavingPassword(true);
      await userService.updateProfile({ 
        currentPassword, 
        password: newPassword 
      });
      toast.success('Đổi mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Cập nhật mật khẩu thành công');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Mật khẩu cũ không chính xác hoặc có lỗi xảy ra');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Hồ sơ cá nhân</h2>
        <p className="text-[var(--text-secondary)] mt-1">Cập nhật thông tin tài khoản và bảo mật.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Thông tin cá nhân */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-5 mb-6 border-b border-[var(--border-color)] pb-6">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName || 'Avatar'}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {(fullName || user?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {avatarUploading && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}

              <button
                type="button"
                disabled={avatarUploading}
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-full flex items-center justify-center transition-colors"
                aria-label="Đổi ảnh đại diện"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
            </div>

            <div>
              <p className="text-[15px] font-medium text-[var(--text-primary)]">
                {fullName || "Chưa cập nhật tên"}
              </p>
              <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
                {user?.email}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                JPG, PNG, GIF, WEBP - max 10MB
              </p>
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
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--text-primary)]">Số điện thoại</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại"
                className="w-full px-4 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-[var(--text-primary)]">Địa chỉ</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Nhập địa chỉ"
                className="w-full px-4 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--text-primary)]">Ngày sinh</label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full px-4 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--text-primary)]">Giới tính</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other')}
                className="w-full px-4 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-start">
            <Button onClick={handleUpdateProfile} disabled={isSavingProfile}>
              Lưu thay đổi
            </Button>
          </div>
        </div>

        {selectedImage && (
          <AvatarCropperModal
            imageSrc={selectedImage}
            onClose={() => setSelectedImage(null)}
            onCropComplete={handleUploadAvatar}
          />
        )}

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
