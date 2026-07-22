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
} from 'lucide-react';

import { useAuthStore } from '../../stores/authStore';
import { useUsersQuery, useWorkspacesQuery, useDocumentsQuery } from '../../hooks/queries';
import type { Workspace } from '../../types';

export default function DashboardPage() {
  const { user } = useAuthStore();

  // React Query — data is cached; navigating back won't trigger a new API call
  const { data: usersData, isLoading: usersLoading } = useUsersQuery({ page: 1 });
  const { data: workspacesRaw, isLoading: workspacesLoading } = useWorkspacesQuery();
  const { data: documentsData, isLoading: documentsLoading } = useDocumentsQuery({ page: 1 });

  // Safe data extraction handling array, flat pagination, or nested pagination
  const extractList = <T,>(raw: unknown, key?: string): T[] => {
    if (Array.isArray(raw)) return raw as T[];
    if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data as T[];
      if (key && Array.isArray(obj[key])) return obj[key] as T[];
    }
    return [];
  };

  const extractTotal = (raw: unknown): number => {
    if (Array.isArray(raw)) return raw.length;
    if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>;
      if (typeof obj.total === 'number') return obj.total;
      if (obj.pagination && typeof obj.pagination === 'object') {
        const pag = obj.pagination as Record<string, unknown>;
        if (typeof pag.total === 'number') return pag.total;
      }
      if (Array.isArray(obj.data)) return obj.data.length;
    }
    return 0;
  };

  const users = extractList<{ id: string; fullName?: string; email: string; avatar?: string; role: string }>(usersData, 'users');
  const totalUsers = extractTotal(usersData);

  const workspaces = extractList<Workspace>(workspacesRaw, 'workspaces');
  const totalWorkspaces = extractTotal(workspacesRaw);

  const totalDocuments = extractTotal(documentsData);

  const isLoading = usersLoading || workspacesLoading || documentsLoading;

  const stats = [
    {
      label: 'Tổng Users',
      value: totalUsers,
      icon: Users,
      link: '/users',
      trend: '+12.5%',
      trendUp: true,
      color: 'blue',
      dateRange: 'vs tháng trước'
    },
    {
      label: 'Workspaces',
      value: totalWorkspaces,
      icon: Briefcase,
      link: '/workspaces',
      trend: '+8.4%',
      trendUp: true,
      color: 'purple',
      dateRange: 'vs tháng trước'
    },
    {
      label: 'Documents',
      value: totalDocuments,
      icon: FileText,
      link: '/documents',
      trend: '+15.3%',
      trendUp: true,
      color: 'emerald',
      dateRange: 'vs tháng trước'
    },
  ];

  const recentUsers = users.slice(0, 5);
  const recentWorkspaces = workspaces.filter(ws => (ws.status === 'active' || !ws.status) && !ws.deletedAt).slice(0, 5);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-[var(--bg-tertiary)] rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-[var(--card-bg)] rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-[var(--card-bg)] rounded-xl" />
          <div className="h-80 bg-[var(--card-bg)] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[var(--text-primary)]">
      {/* Modernized Hero Banner: Subtle glass/mesh effect instead of heavy gradient */}
      <div className="relative overflow-hidden bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8 shadow-sm">
        {/* Soft decorative background blobs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 bg-blue-50 dark:bg-blue-900/20 rounded-full blur-3xl opacity-60 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[var(--text-secondary)] text-sm font-medium mb-1">{formatDate()}</p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
              {getGreeting()}, {user?.fullName?.split(' ').pop() || 'Admin'}
            </h1>
            <p className="text-[var(--text-secondary)] mt-1">
              Theo dõi tổng quan hoạt động của hệ thống hôm nay.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 text-sm font-medium">Hệ thống ổn định</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid (Cohesive visual hierarchy) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          
          let bgClass = '';
          let textClass = '';
          const iconBg = 'bg-white dark:bg-gray-800';

          if (stat.color === 'blue') {
            bgClass = 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30';
            textClass = 'text-blue-600 dark:text-blue-400';
          } else if (stat.color === 'purple') {
            bgClass = 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900/30';
            textClass = 'text-purple-600 dark:text-purple-400';
          } else if (stat.color === 'emerald') {
            bgClass = 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30';
            textClass = 'text-emerald-600 dark:text-emerald-400';
          }

          return (
            <Link key={stat.label} to={stat.link} className="group block focus:outline-none">
              <div className={`${bgClass} border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 h-full flex flex-col justify-between relative overflow-hidden`}>
                <div className="flex justify-between items-start">
                  <div className="flex flex-col z-10">
                    <span className={`text-xs font-bold uppercase tracking-wider mb-2 ${textClass}`}>
                      {stat.label}
                    </span>
                    <span className="text-3xl font-black text-gray-900 dark:text-white">
                      {stat.value || '0'}
                    </span>
                  </div>
                  <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center shadow-sm ${textClass} group-hover:scale-110 transition-transform duration-200 z-10`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                
                <div className="mt-8 flex flex-col gap-1 z-10">
                  {stat.trendUp !== null ? (
                    <div className={`flex items-center gap-1 text-sm font-bold ${
                      stat.trendUp ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      {stat.trendUp ? (
                        <TrendingUp className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <TrendingDown className="w-4 h-4 stroke-[3]" />
                      )}
                      <span>{stat.trend}</span>
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-gray-500">-</div>
                  )}
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {stat.dateRange}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>


      {/* Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users List */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col relative">
          {/* Subtle gradient blob for depth */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-2xl opacity-50 pointer-events-none" />
          
          <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between relative z-10">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Users gần đây</h2>
              <p className="text-sm text-[var(--text-secondary)]">Người dùng mới đăng ký</p>
            </div>
            <Link to="/users" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
              Xem tất cả <ChevronRight className="w-4 h-4 ml-0.5" />
            </Link>
          </div>
          
          <div className="flex-1 p-2">
            {recentUsers.length > 0 ? (
              <div className="flex flex-col gap-1">
                {recentUsers.map((u, i) => {
                  const avatarColorClass = [
                    'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-800',
                    'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800',
                    'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-800',
                    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800',
                    'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800',
                  ][i % 5];
                  const fallbackId = (u.id || (u as { _id?: string })._id || '0000').toString();
                  const displayName = u.fullName || `Người dùng ẩn danh #${fallbackId.slice(-4)}`;
                  
                  return (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--hover-bg)] transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {u.avatar ? (
                            <img src={u.avatar} alt={displayName} className="w-10 h-10 rounded-full object-cover border border-[var(--border-color)]" />
                          ) : (
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm border ${avatarColorClass}`}>
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {displayName}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] truncate max-w-[180px]">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    <div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${
                        u.role === 'super_admin'
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400'
                          : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)]'
                      }`}>
                        {u.role === 'super_admin' ? 'Super Admin' : 'User'}
                      </span>
                    </div>
                  </div>
                );
              })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center mb-3 text-[var(--text-muted)]">
                  <Users className="w-6 h-6" />
                </div>
                <p className="text-sm text-[var(--text-secondary)]">Chưa có người dùng nào</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Workspaces List */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 dark:bg-purple-900/10 rounded-full blur-2xl opacity-50 pointer-events-none" />

          <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between relative z-10">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Workspaces gần đây</h2>
              <p className="text-sm text-[var(--text-secondary)]">Các không gian mới cập nhật</p>
            </div>
            <Link to="/workspaces" className="text-sm font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 flex items-center transition-colors px-3 py-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20">
              Xem tất cả <ChevronRight className="w-4 h-4 ml-0.5" />
            </Link>
          </div>
          
          <div className="flex-1 p-2">
            {recentWorkspaces.length > 0 ? (
              <div className="flex flex-col gap-1">
                {recentWorkspaces.map((ws) => (
                  <div
                    key={ws._id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--hover-bg)] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] font-bold text-sm">
                        {ws.key?.slice(0, 2).toUpperCase() || 'WS'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {ws.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[var(--text-secondary)]">
                          <Users className="w-3.5 h-3.5" />
                          <span>{ws.members?.length || 0} thành viên</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {ws.deletedAt ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400">
                          Đã xóa
                        </span>
                      ) : (
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${
                          ws.status === 'active' || ws.status === undefined
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                            : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)]'
                        }`}>
                          {ws.status === 'active' || ws.status === undefined ? 'Hoạt động' : 'Lưu trữ'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center mb-3 text-[var(--text-muted)]">
                  <BriefcaseIcon className="w-6 h-6" />
                </div>
                <p className="text-sm text-[var(--text-secondary)]">Chưa có workspace nào</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Quick Actions & System Status in 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Quick Actions (Minimalist cards) */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[var(--border-color)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Thao tác nhanh</h2>
            <p className="text-sm text-[var(--text-secondary)]">Phím tắt quản trị hệ thống</p>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            <Link
              to="/users"
              className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-color)] hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all group"
            >
              <div className="p-2 bg-[var(--bg-tertiary)] rounded-md text-[var(--text-secondary)] group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Thêm User</p>
              </div>
            </Link>
            <Link
              to="/workspaces"
              className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-color)] hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all group"
            >
              <div className="p-2 bg-[var(--bg-tertiary)] rounded-md text-[var(--text-secondary)] group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                <BriefcaseIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Tạo Workspace</p>
              </div>
            </Link>
            <Link
              to="/documents"
              className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-color)] hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all group"
            >
              <div className="p-2 bg-[var(--bg-tertiary)] rounded-md text-[var(--text-secondary)] group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Tải Document</p>
              </div>
            </Link>
            <Link
              to="/activity"
              className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-color)] hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all group"
            >
              <div className="p-2 bg-[var(--bg-tertiary)] rounded-md text-[var(--text-secondary)] group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Xem nhật ký</p>
              </div>
            </Link>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[var(--border-color)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Trạng thái hệ thống</h2>
            <p className="text-sm text-[var(--text-secondary)]">Tình trạng các dịch vụ</p>
          </div>
          <div className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--hover-bg)] border border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--card-bg)] rounded shadow-sm text-[var(--text-secondary)] dark:text-slate-300">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">API Server</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">Thời gian phản hồi: 45ms</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                Online
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--hover-bg)] border border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--card-bg)] rounded shadow-sm text-[var(--text-secondary)] dark:text-slate-300">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Database</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">Tải CPU: 12%</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                Online
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--hover-bg)] border border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--card-bg)] rounded shadow-sm text-[var(--text-secondary)] dark:text-slate-300">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Authentication</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">Hệ thống cấp quyền</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                Online
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
