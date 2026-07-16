import { useEffect } from 'react';
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
import { useUsersStore, useWorkspacesStore, useDocumentsStore } from '../../stores';
import { useAuthStore } from '../../stores/authStore';

// Simple SVG Sparkline component for light data visualization
function Sparkline({ data, color, className = '' }: { data: number[]; color: string; className?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 32;
  const width = 80;

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  const fillPoints = `0,${height} ${points} ${width},${height}`;
  const gradientId = `gradient-${color.replace(/[^a-zA-Z0-9]/g, '-')}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={`overflow-visible ${className} ${color}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={fillPoints}
        fill={`url(#${gradientId})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DashboardPage() {
  const { users, total: totalUsers, isLoading: usersLoading, fetchUsers } = useUsersStore();
  const { workspaces, total: totalWorkspaces, isLoading: workspacesLoading, fetchWorkspaces } = useWorkspacesStore();
  const { total: totalDocuments, isLoading: documentsLoading, fetchDocuments } = useDocumentsStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchUsers(1);
    fetchWorkspaces(1);
    fetchDocuments(1);
  }, [fetchUsers, fetchWorkspaces, fetchDocuments]);

  const isLoading = usersLoading || workspacesLoading || documentsLoading;

  const stats = [
    {
      label: 'Tổng Users',
      value: totalUsers,
      icon: Users,
      link: '/users',
      trend: '+12%',
      trendUp: true,
      data: [10, 15, 12, 18, 14, 25],
    },
    {
      label: 'Workspaces',
      value: totalWorkspaces,
      icon: Briefcase,
      link: '/workspaces',
      trend: '+8%',
      trendUp: true,
      data: [5, 8, 12, 11, 16, 20],
    },
    {
      label: 'Documents',
      value: totalDocuments,
      icon: FileText,
      link: '/documents',
      trend: '+23%',
      trendUp: true,
      data: [2, 5, 4, 9, 15, 24],
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
          return (
            <Link key={stat.label} to={stat.link} className="group block focus:outline-none">
              <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-200 h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-200">
                    <Icon className="w-5 h-5" />
                  </div>
                  {/* Light Data Viz */}
                  <Sparkline 
                    data={stat.data} 
                    color={
                      stat.trendUp === true 
                        ? 'text-emerald-500' 
                        : stat.trendUp === false 
                        ? 'text-rose-500' 
                        : 'text-[var(--text-muted)]'
                    } 
                  />
                </div>
                
                <div className="flex-1">
                  <p className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] mb-1">
                    {stat.value || '-'}
                  </p>
                  <p className="text-sm font-medium text-[var(--text-secondary)]">
                    {stat.label}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex items-center justify-between">
                  {stat.trendUp !== null ? (
                    <div className={`flex items-center gap-1 text-xs font-semibold ${
                      stat.trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {stat.trendUp ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      <span>{stat.trend} tháng này</span>
                    </div>
                  ) : (
                    <div className="text-xs font-semibold text-[var(--text-muted)]">
                      Cố định
                    </div>
                  )}
                  
                  <div className="flex items-center text-xs font-medium text-[var(--text-muted)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Chi tiết
                    <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
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
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Users gần đây</h2>
              <p className="text-sm text-[var(--text-secondary)]">Người dùng mới đăng ký</p>
            </div>
            <Link to="/users" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center transition-colors">
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
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Workspaces gần đây</h2>
              <p className="text-sm text-[var(--text-secondary)]">Các không gian mới cập nhật</p>
            </div>
            <Link to="/workspaces" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center transition-colors">
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
