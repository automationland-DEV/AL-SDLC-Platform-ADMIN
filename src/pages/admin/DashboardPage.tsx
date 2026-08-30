import { Link } from 'react-router-dom';
import {
  Users,
  Briefcase,
  FileText,
  UserPlus,
  BriefcaseIcon,
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronRight,
  Database,
  Lock,
  Cpu,
} from 'lucide-react';

import { useAuthStore } from '../../stores/authStore';
import { useDashboardStatsQuery } from '../../hooks/queries';
import { useTranslation } from '../../i18n/useTranslation';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: statsData, isLoading } = useDashboardStatsQuery();

  const totalUsers = statsData?.totalUsers || 0;
  const totalWorkspaces = statsData?.totalWorkspaces || 0;
  const totalDocuments = statsData?.totalDocuments || 0;
  
  const recentUsers = statsData?.recentUsers || [];
  const recentWorkspaces = statsData?.recentWorkspaces || [];

  const { t, language } = useTranslation();

  const stats = [
    {
      label: language === 'vi' ? 'TỔNG NGUỜI DÙNG' : 'TOTAL USERS',
      value: totalUsers,
      icon: Users,
      link: '/users',
      trend: '+12.5%',
      trendUp: true,
      color: 'sky',
      dateRange: language === 'vi' ? 'vs tháng trước' : 'vs last month'
    },
    {
      label: language === 'vi' ? 'WORKSPACES HOẠT ĐỘNG' : 'ACTIVE WORKSPACES',
      value: totalWorkspaces,
      icon: Briefcase,
      link: '/workspaces',
      trend: '+8.4%',
      trendUp: true,
      color: 'violet',
      dateRange: language === 'vi' ? 'vs tháng trước' : 'vs last month'
    },
    {
      label: language === 'vi' ? 'TÀI LIỆU DỰ ÁN' : 'PROJECT DOCUMENTS',
      value: totalDocuments,
      icon: FileText,
      link: '/documents',
      trend: '+15.3%',
      trendUp: true,
      color: 'emerald',
      dateRange: language === 'vi' ? 'vs tháng trước' : 'vs last month'
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (language === 'en') {
      if (hour < 12) return 'Good morning';
      if (hour < 18) return 'Good afternoon';
      return 'Good evening';
    }
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const formatDate = () => {
    return new Date().toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-[var(--bg-tertiary)] rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]" />
          <div className="h-80 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto min-h-0 space-y-6 text-[var(--text-primary)] font-sans pr-1">
      {/* Console Hero Banner */}
      <div className="relative overflow-hidden bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 md:p-8 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[var(--text-muted)] text-xs font-mono-code uppercase tracking-wider mb-1">
              {formatDate()}
            </p>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              {getGreeting()}, <span className="text-sky-500 font-mono-code">{user?.fullName?.split(' ').pop() || 'Admin'}</span>
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {language === 'vi' ? 'Bảng điều khiển giám sát telemetry và quản trị vòng đời phát triển phần mềm (SDLC).' : 'Telemetry monitoring and software development life cycle (SDLC) administration console.'}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;

          let borderAccent = 'border-[var(--border-color)] hover:border-sky-500/50';
          let iconBg = 'bg-sky-500/10 text-sky-500';

          if (stat.color === 'violet') {
            borderAccent = 'border-[var(--border-color)] hover:border-violet-500/50';
            iconBg = 'bg-violet-500/10 text-violet-500';
          } else if (stat.color === 'emerald') {
            borderAccent = 'border-[var(--border-color)] hover:border-emerald-500/50';
            iconBg = 'bg-emerald-500/10 text-emerald-500';
          }

          return (
            <Link key={stat.label} to={stat.link} className="group block focus:outline-none">
              <div className={`bg-[var(--bg-card)] border ${borderAccent} rounded-xl p-5 shadow-xs hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col justify-between`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                      {stat.label}
                    </span>
                    <span className="text-3xl font-black font-mono-code text-[var(--text-primary)]">
                      {stat.value || '0'}
                    </span>
                  </div>
                  <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center font-bold shrink-0`}>
                    <Icon size={20} />
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
                  <div className={`flex items-center gap-1 font-mono-code font-bold ${stat.trendUp ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                    {stat.trendUp ? (
                      <TrendingUp size={14} />
                    ) : (
                      <TrendingDown size={14} />
                    )}
                    <span>{stat.trend}</span>
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {stat.dateRange}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Activity Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users Card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 px-5 border-b border-[var(--border-color)] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                {language === 'vi' ? 'NGƯỜI DÙNG MỚI ĐĂNG KÝ' : 'RECENTLY REGISTERED USERS'}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {language === 'vi' ? 'Tài khoản thành viên mới trong hệ thống' : 'New member accounts in system'}
              </p>
            </div>
            <Link
              to="/users"
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              {t('dashboard.viewAll')} <ChevronRight size={14} />
            </Link>
          </div>

          <div className="p-3 divide-y divide-[var(--border-color)] flex-1">
            {recentUsers.length > 0 ? (
              recentUsers.map((u) => {
                const fallbackId = (u.id || (u as { _id?: string })._id || '0000').toString();
                const displayName = u.fullName || `User #${fallbackId.slice(-4)}`;

                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {u.avatar ? (
                        <img src={u.avatar} alt={displayName} className="w-8 h-8 rounded-lg object-cover border border-[var(--border-color)] shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-mono-code font-bold text-xs shrink-0">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate group-hover:text-sky-500 transition-colors">
                          {displayName}
                        </p>
                        <p className="text-[11px] font-mono-code text-[var(--text-muted)] truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase shrink-0 ${u.role === 'super_admin'
                      ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                      : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                      }`}>
                      {u.role === 'super_admin' ? 'SUPER_ADMIN' : 'USER'}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                {language === 'vi' ? 'Chưa có dữ liệu người dùng' : 'No user data available'}
              </div>
            )}
          </div>
        </div>

        {/* Recent Workspaces Card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 px-5 border-b border-[var(--border-color)] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                {language === 'vi' ? 'WORKSPACES CẬP NHẬT GẦN ĐÂY' : 'RECENTLY UPDATED WORKSPACES'}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {language === 'vi' ? 'Không gian làm việc dự án active' : 'Active project workspaces'}
              </p>
            </div>
            <Link
              to="/workspaces"
              className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              {t('dashboard.viewAll')} <ChevronRight size={14} />
            </Link>
          </div>

          <div className="p-3 divide-y divide-[var(--border-color)] flex-1">
            {recentWorkspaces.length > 0 ? (
              recentWorkspaces.map((ws) => (
                <div
                  key={ws._id}
                  className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-500 flex items-center justify-center font-mono-code font-bold text-xs shrink-0">
                      {ws.key?.slice(0, 2).toUpperCase() || 'WS'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate group-hover:text-violet-500 transition-colors">
                        {ws.name}
                      </p>
                      <p className="text-[11px] font-mono-code text-[var(--text-muted)] truncate">
                        {ws.members?.length || 0} members • Key: {ws.key || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase shrink-0 ${ws.status === 'active' || !ws.status
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                    }`}>
                    {ws.status === 'active' || !ws.status ? 'HOẠT ĐỘNG' : 'LƯU TRỮ'}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                {t('dashboard.noWorkspaces')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions & Technical Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions Card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 px-5 border-b border-[var(--border-color)]">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              {language === 'vi' ? 'PHÍM TẮT QUẢN TRỊ DEVOPS' : 'DEVOPS ADMIN SHORTCUTS'}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {language === 'vi' ? 'Thực thi tác vụ nhanh trong hệ thống' : 'Quick system action shortcuts'}
            </p>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <Link
              to="/users"
              className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-color)] hover:border-sky-500/40 hover:bg-sky-500/5 transition-all group cursor-pointer"
            >
              <div className="p-2 bg-sky-500/10 rounded-md text-sky-500 group-hover:scale-105 transition-transform shrink-0">
                <UserPlus size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">{t('nav.users')}</p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {language === 'vi' ? 'Thêm & Phân quyền' : 'Add & Permissions'}
                </p>
              </div>
            </Link>

            <Link
              to="/workspaces"
              className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-color)] hover:border-violet-500/40 hover:bg-violet-500/5 transition-all group cursor-pointer"
            >
              <div className="p-2 bg-violet-500/10 rounded-md text-violet-500 group-hover:scale-105 transition-transform shrink-0">
                <BriefcaseIcon size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">{t('workspaces.createBtn')}</p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {language === 'vi' ? 'Không gian dự án' : 'Project space'}
                </p>
              </div>
            </Link>

            <Link
              to="/documents"
              className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-color)] hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group cursor-pointer"
            >
              <div className="p-2 bg-emerald-500/10 rounded-md text-emerald-500 group-hover:scale-105 transition-transform shrink-0">
                <FileText size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">{language === 'vi' ? 'Tài liệu Kho' : 'Document Storage'}</p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {language === 'vi' ? 'Tải lên & Lưu trữ' : 'Upload & Manage'}
                </p>
              </div>
            </Link>

            <Link
              to="/activity"
              className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-color)] hover:border-amber-500/40 hover:bg-amber-500/5 transition-all group cursor-pointer"
            >
              <div className="p-2 bg-amber-500/10 rounded-md text-amber-500 group-hover:scale-105 transition-transform shrink-0">
                <Activity size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">Audit Terminal</p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {language === 'vi' ? 'Nhật ký sự kiện' : 'System Event logs'}
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* System Telemetry Status */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 px-5 border-b border-[var(--border-color)]">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">{t('dashboard.telemetryTitle')}</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {t('dashboard.telemetrySubtitle')}
            </p>
          </div>
          <div className="p-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]/50 border border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--bg-card)] rounded-md text-sky-500 border border-[var(--border-color)] shrink-0">
                  <Cpu size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">API Node Server</p>
                  <p className="text-[11px] font-mono-code text-[var(--text-muted)]">Latency: 38ms • Uptime: 99.98%</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                HEALTHY
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]/50 border border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--bg-card)] rounded-md text-violet-500 border border-[var(--border-color)] shrink-0">
                  <Database size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">MongoDB Instance</p>
                  <p className="text-[11px] font-mono-code text-[var(--text-muted)]">CPU: 14% • Pool Connections: 32</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                CONNECTED
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]/50 border border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--bg-card)] rounded-md text-emerald-500 border border-[var(--border-color)] shrink-0">
                  <Lock size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">OAuth & JWT Security</p>
                  <p className="text-[11px] font-mono-code text-[var(--text-muted)]">Active Tokens: 128 • RSA-256</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                SECURE
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
