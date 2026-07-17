import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Settings,
  LogOut,
  Activity,
  MessageSquare,
} from 'lucide-react';
import { useAuthStore } from '../../stores';
import ThemeSwitcher from '../ThemeSwitcher';
import AdminNotificationBell from '../AdminNotificationBell';

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/users', label: 'Quản lý Users', icon: Users },
    { path: '/workspaces', label: 'Quản lý Workspaces', icon: Briefcase },
    { path: '/documents', label: 'Quản lý Documents', icon: FileText },
    { path: '/chat-channels', label: 'Chat Channels', icon: MessageSquare },
    { path: '/activity', label: 'Nhật ký hoạt động', icon: Activity },
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
            <div className="flex items-center flex-shrink-0">
              <span className="grid h-11 w-11 flex-shrink-0 place-items-center p-1">
                <img src="/logo.png" alt="SDLC Logo" className="h-9 w-9 rounded-[8px] object-contain" />
              </span>
              <span className="flex flex-col text-base font-bold leading-[0.95] tracking-tight text-[#2563EB] dark:text-[#60A5FA] whitespace-nowrap">
                <span className="text-2xl font-black">SDLC</span>
                <span>ADMIN</span>
              </span>
            </div>
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
            <Link
              to="/settings"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                location.pathname.startsWith('/settings')
                  ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300 font-medium'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? 'Cài đặt' : undefined}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>Cài đặt</span>}
            </Link>
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
            <ThemeSwitcher variant="compact" />

            {/* Admin Notifications */}
            <AdminNotificationBell />

            {/* User Info Dropdown */}
            <div className="relative border-l border-[var(--border-color)] pl-4 flex justify-end" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 focus:outline-none hover:opacity-80 transition-opacity"
              >
                {user?.avatar && !imgError ? (
                  <img
                    src={user.avatar}
                    alt={user.fullName || user.email}
                    className="w-8 h-8 rounded-full border border-[var(--border-color)] object-cover shrink-0"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center border border-[var(--border-color)] shrink-0">
                    <span className="text-sm font-medium text-primary-600 dark:text-primary-300">
                      {user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'A'}
                    </span>
                  </div>
                )}
                <div className="hidden md:flex items-center gap-2">
                  <p className="text-sm font-medium text-[var(--text-primary)] whitespace-nowrap truncate max-w-[150px]">
                    {user?.fullName || user?.email}
                  </p>
                  <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
              </button>
                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-64 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-lg py-2 z-50 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* User Info Header */}
                    <div className="px-4 py-2 flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                          {user?.fullName || 'Người dùng'}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>

                    <div className="h-px bg-[var(--border-color)] my-1" />

                    {/* Menu Items */}
                    <Link
                      to="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-colors"
                    >
                      <Settings className="w-4 h-4 text-[var(--text-secondary)]" />
                      Cài đặt
                    </Link>

                    <div className="h-px bg-[var(--border-color)] my-1" />

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
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
