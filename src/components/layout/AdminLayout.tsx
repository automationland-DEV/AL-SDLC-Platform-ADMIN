import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  ChevronLeft,
  ChevronDown,
  Settings,
  LogOut,
  Activity,
  MessageSquare,
  User,
  ShieldCheck,
  Menu,
} from 'lucide-react';
import { useAuthStore } from '../../stores';
import ThemeSwitcher from '../ThemeSwitcher';
import AdminNotificationBell from '../AdminNotificationBell';
import LanguageSwitcher from '../LanguageSwitcher';
import { useTranslation } from '../../i18n/useTranslation';

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 768);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
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
    { path: '/', labelKey: 'nav.dashboard' as const, icon: LayoutDashboard },
    { path: '/users', labelKey: 'nav.users' as const, icon: Users },
    { path: '/workspaces', labelKey: 'nav.workspaces' as const, icon: Briefcase },
    { path: '/documents', labelKey: 'nav.documents' as const, icon: FileText },
    { path: '/channels', labelKey: 'nav.channels' as const, icon: MessageSquare },
    { path: '/activity', labelKey: 'nav.activity' as const, icon: Activity },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleMobileMenuClick = () => {
    if (window.innerWidth < 768) {
      setCollapsed(true);
    }
  };

  const isTablePage = ['/users', '/workspaces', '/documents', '/channels', '/activity'].includes(location.pathname);
  const currentMenuItem = menuItems.find((item) => item.path === location.pathname);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[var(--bg-primary)] flex font-sans print:h-auto print:w-auto print:overflow-visible print:bg-white">
      {/* Mobile Sidebar Overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full z-50 transition-all duration-250 ease-in-out print:hidden ${
          collapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'translate-x-0 w-64'
        } bg-[var(--bg-card)] border-r border-[var(--border-color)] flex flex-col shadow-sm`}
      >
        {/* Official Brand Logo */}
        <div
          className={`h-16 flex items-center ${
            collapsed ? 'justify-center' : 'justify-between px-4'
          } border-b border-[var(--border-color)] shrink-0`}
        >
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors flex items-center justify-center group cursor-pointer"
              title="Mở rộng menu"
            >
              <img src="/logo.png" alt="SDLC Logo" className="h-8 w-8 rounded-lg object-contain group-hover:scale-105 transition-transform" />
            </button>
          ) : (
            <>
              <Link to="/" className="flex items-center gap-2.5">
                <img src="/logo.png" alt="SDLC Logo" className="h-9 w-9 rounded-lg object-contain shrink-0" />
                <div className="flex flex-col">
                  <span className="font-mono-code text-base font-extrabold tracking-tight text-[var(--text-primary)] leading-none">
                    SDLC<span className="text-sky-500"> ADMIN</span>
                  </span>
                </div>
              </Link>
              <button
                onClick={() => setCollapsed(true)}
                className="hidden md:block p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors cursor-pointer"
                title="Thu gọn menu"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const label = t(item.labelKey);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleMobileMenuClick}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-180 ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-l-2 border-sky-500 font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                } ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Settings & Logout */}
        <div className="p-3 border-t border-[var(--border-color)] shrink-0 space-y-1">
          <Link
            to="/settings"
            onClick={handleMobileMenuClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              location.pathname.startsWith('/settings')
                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            } ${collapsed ? 'justify-center px-0' : ''}`}
            title={collapsed ? t('nav.settings') : undefined}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{t('nav.settings')}</span>}
          </Link>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer ${
              collapsed ? 'justify-center px-0' : ''
            }`}
            title={collapsed ? t('nav.logout') : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{t('nav.logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main
        className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-250 ease-in-out print:m-0 print:p-0 print:h-auto print:overflow-visible print:block ${
          collapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {/* Fixed Header */}
        <header className="h-16 shrink-0 border-b border-[var(--border-color)] flex items-center justify-between px-4 md:px-6 bg-[var(--bg-card)]/90 backdrop-blur-md z-40 print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors shrink-0 cursor-pointer"
              title="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider truncate">
                {currentMenuItem ? t(currentMenuItem.labelKey) : 'Admin Console'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <LanguageSwitcher />
            <ThemeSwitcher variant="compact" />
            <AdminNotificationBell />

            {/* User Menu */}
            <div className="relative border-l border-[var(--border-color)] pl-3" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2.5 focus:outline-none hover:opacity-85 transition-opacity cursor-pointer"
              >
                {user?.avatar && !imgError ? (
                  <img
                    src={user.avatar}
                    alt={user.fullName || user.email}
                    className="w-8 h-8 rounded-lg border border-[var(--border-color)] object-cover shrink-0"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 font-mono-code font-bold text-xs shrink-0">
                    {user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'A'}
                  </div>
                )}
                <div className="hidden md:flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[130px]">
                    {user?.fullName || user?.email}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </div>
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-60 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl py-1.5 z-50 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3.5 py-2.5 border-b border-[var(--border-color)]">
                    <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {user?.fullName || 'Administrator'}
                    </p>
                    <p className="text-[11px] font-mono-code text-[var(--text-muted)] truncate mt-0.5">
                      {user?.email}
                    </p>
                    <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-mono-code">
                      <ShieldCheck size={12} />
                      {user?.role || t('header.userRole')}
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <User className="w-4 h-4 text-[var(--text-secondary)]" />
                      {t('nav.profile')}
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <Settings className="w-4 h-4 text-[var(--text-secondary)]" />
                      {t('nav.settings')}
                    </Link>
                  </div>

                  <div className="border-t border-[var(--border-color)] pt-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('nav.logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Viewport Area */}
        <div
          className={`flex-1 w-full px-4 md:px-6 lg:px-8 print:p-0 print:h-auto print:overflow-visible print:block ${
            isTablePage
              ? 'flex flex-col min-h-0 py-3.5 overflow-hidden'
              : 'py-5 overflow-y-auto'
          }`}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
