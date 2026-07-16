import { useState } from 'react';
import { User, Monitor } from 'lucide-react';
import { AppearanceSettings } from './components/settings/AppearanceSettings';
import { ProfileSettings } from './components/settings/ProfileSettings';

type TabId = 'appearance' | 'profile';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('appearance');

  const tabs = [
    { id: 'appearance', label: 'Giao diện', icon: Monitor },
    { id: 'profile', label: 'Cá nhân', icon: User },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Cài đặt</h2>
          <p className="text-[var(--text-secondary)] mt-1">Quản lý cấu hình cá nhân và hệ thống</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Menu */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-3 shadow-sm flex flex-col gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'appearance' && <AppearanceSettings />}
          {activeTab === 'profile' && <ProfileSettings />}
        </div>
      </div>
    </div>
  );
}
