import { AppearanceSettings } from './components/settings/AppearanceSettings';

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Cài đặt</h2>
        <p className="text-[var(--text-secondary)] mt-1">Quản lý cấu hình cá nhân và hệ thống</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AppearanceSettings />
      </div>
    </div>
  );
}
