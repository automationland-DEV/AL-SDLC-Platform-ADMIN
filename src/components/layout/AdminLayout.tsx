import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Shield,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
  Bell,
  Activity,
} from 'lucide-react';
import { useAuthStore } from '../../stores';
import ThemeSwitcher from '../ThemeSwitcher';

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/users', label: 'Quản lý Users', icon: Users },
    { path: '/workspaces', label: 'Quản lý Workspaces', icon: Briefcase },
    { path: '/documents', label: 'Quản lý Documents', icon: FileText },
    { path: '/activity', label: 'Nhật ký hoạt động', icon: Activity },
    { path: '/permissions', label: 'Quản lý Permissions', icon: Shield },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full z-40 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } bg-[var(--card-bg)] border-r border-[var(--border-color)]`}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center justify-between px-4 border-b border-[var(--border-color)]`}>
          {!collapsed && (
            <span className="font-bold text-lg text-primary-600">AL-SDLC Admin</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300 font-medium'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--border-color)]">
          <div className="space-y-1">
            <button
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] transition-colors ${
                collapsed ? 'justify-center' : ''
              }`}
              title={collapsed ? 'Settings' : undefined}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>Cài đặt</span>}
            </button>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${
                collapsed ? 'justify-center' : ''
              }`}
              title={collapsed ? 'Logout' : undefined}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>Đăng xuất</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${
          collapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Header */}
        <header className={`h-16 border-b border-[var(--border-color)] flex items-center justify-between px-6 sticky top-0 z-30 bg-[var(--card-bg)]`}>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              {menuItems.find(item => item.path === location.pathname)?.label || 'Admin'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <ThemeSwitcher variant="compact" />

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors">
              <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Info */}
            <div className="flex items-center gap-3 pl-4 border-l border-[var(--border-color)]">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.fullName || user.email}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600 dark:text-primary-300">
                    {user?.email?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
              )}
              <div className="hidden md:block">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {user?.fullName || user?.email}
                </p>
                <p className="text-xs text-[var(--text-muted)] capitalize">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
