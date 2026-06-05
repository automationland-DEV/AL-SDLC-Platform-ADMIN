import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Briefcase,
  FileText,
  Shield,
  UserPlus,
  BriefcaseIcon,
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { Card } from '../../components/ui';
import { useUsersStore, useWorkspacesStore, useDocumentsStore } from '../../stores';
import { useAuthStore } from '../../stores/authStore';

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
      color: 'blue',
      bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      shadow: 'hover:shadow-blue-500/20',
      link: '/users',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Workspaces',
      value: totalWorkspaces,
      icon: Briefcase,
      color: 'green',
      bg: 'bg-gradient-to-br from-green-500 to-green-600',
      shadow: 'hover:shadow-green-500/20',
      link: '/workspaces',
      trend: '+8%',
      trendUp: true,
    },
    {
      label: 'Documents',
      value: totalDocuments,
      icon: FileText,
      color: 'purple',
      bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
      shadow: 'hover:shadow-purple-500/20',
      link: '/documents',
      trend: '+23%',
      trendUp: true,
    },
    {
      label: 'Permissions',
      value: '5',
      icon: Shield,
      color: 'orange',
      bg: 'bg-gradient-to-br from-orange-500 to-orange-600',
      shadow: 'hover:shadow-orange-500/20',
      link: '/permissions',
      trend: '0%',
      trendUp: null,
    },
  ];

  const recentUsers = users.slice(0, 5);
  const recentWorkspaces = workspaces.slice(0, 5);

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
        <div className="h-24 bg-[var(--bg-tertiary)] rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[var(--card-bg)] rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-[var(--card-bg)] rounded-2xl" />
          <div className="h-80 bg-[var(--card-bg)] rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-6 md:p-8">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-white/80 text-sm font-medium">{formatDate()}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">
              {getGreeting()}, {user?.fullName?.split(' ').pop() || 'Admin'}
            </h1>
            <p className="text-white/70 mt-1">Chào mừng bạn quay trở lại Admin Dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-white/80" />
              <span className="text-white/90 text-sm font-medium">Hệ thống hoạt động tốt</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} to={stat.link} className="group">
              <Card className={`p-6 transition-all duration-300 hover:shadow-xl ${stat.shadow}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text-secondary)]">{stat.label}</p>
                    <p className="text-3xl font-bold text-[var(--text-primary)] mt-2">{stat.value || '-'}</p>
                    {stat.trendUp !== null ? (
                      <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${
                        stat.trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {stat.trendUp ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span>{stat.trend} tháng này</span>
                      </div>
                    ) : (
                      <div className="mt-2 h-5" aria-hidden="true" />
                    )}
                  </div>
                  <div className={`${stat.bg} p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-[var(--text-muted)] group-hover:text-primary-600 transition-colors">
                  <span>Xem chi tiết</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card
          title="Users gần đây"
          subtitle="Người dùng đăng ký gần đây"
          actions={
            <Link to="/users" className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
              Xem tất cả
              <ChevronRight className="w-4 h-4" />
            </Link>
          }
        >
          {recentUsers.length > 0 ? (
            <div className="divide-y divide-[var(--border-color)]">
              {recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="py-3 flex items-center justify-between hover:bg-[var(--hover-bg)] -mx-4 px-4 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.fullName || ''} className="w-10 h-10 rounded-full ring-2 ring-[var(--border-color)]" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center ring-2 ring-primary-100 dark:ring-primary-900/50">
                        <span className="text-sm font-semibold text-white">
                          {u.fullName?.charAt(0) || u.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{u.fullName || u.email}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{u.email}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    u.role === 'super_admin'
                      ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {u.role === 'super_admin' ? 'Super Admin' : 'User'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[var(--text-muted)]" />
              </div>
              <p className="text-[var(--text-secondary)]">Chưa có người dùng nào</p>
            </div>
          )}
        </Card>

        {/* Recent Workspaces */}
        <Card
          title="Workspaces gần đây"
          subtitle="Không gian làm việc mới được tạo"
          actions={
            <Link to="/workspaces" className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
              Xem tất cả
              <ChevronRight className="w-4 h-4" />
            </Link>
          }
        >
          {recentWorkspaces.length > 0 ? (
            <div className="divide-y divide-[var(--border-color)]">
              {recentWorkspaces.map((ws) => (
                <div
                  key={ws._id}
                  className="py-3 flex items-center justify-between hover:bg-[var(--hover-bg)] -mx-4 px-4 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
                      <span className="text-sm font-bold text-white">{ws.key}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{ws.name}</p>
                      <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <Users className="w-3 h-3" />
                        <span>{ws.members?.length || 0} thành viên</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    ws.status === 'active' || ws.status === undefined
                      ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {ws.status === 'active' || ws.status === undefined ? 'Hoạt động' : 'Đã lưu trữ'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center mx-auto mb-4">
                <BriefcaseIcon className="w-8 h-8 text-[var(--text-muted)]" />
              </div>
              <p className="text-[var(--text-secondary)]">Chưa có workspace nào</p>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card
        title="Thao tác nhanh"
        subtitle="Các hành động thường dùng"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/users"
            className="group p-4 rounded-xl border-2 border-dashed border-[var(--border-color)] hover:border-blue-400 bg-[var(--card-bg)] hover:shadow-lg transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <p className="font-semibold text-[var(--text-primary)]">Thêm User</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Tạo tài khoản mới</p>
          </Link>
          <Link
            to="/workspaces"
            className="group p-4 rounded-xl border-2 border-dashed border-[var(--border-color)] hover:border-green-400 bg-[var(--card-bg)] hover:shadow-lg transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-green-500/20 dark:shadow-green-500/10">
              <BriefcaseIcon className="w-6 h-6 text-white" />
            </div>
            <p className="font-semibold text-[var(--text-primary)]">Tạo Workspace</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Không gian làm việc mới</p>
          </Link>
          <Link
            to="/documents"
            className="group p-4 rounded-xl border-2 border-dashed border-[var(--border-color)] hover:border-purple-400 bg-[var(--card-bg)] hover:shadow-lg transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/20 dark:shadow-purple-500/10">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <p className="font-semibold text-[var(--text-primary)]">Upload Document</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Tải lên tài liệu</p>
          </Link>
          <Link
            to="/permissions"
            className="group p-4 rounded-xl border-2 border-dashed border-[var(--border-color)] hover:border-orange-400 bg-[var(--card-bg)] hover:shadow-lg transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/20 dark:shadow-orange-500/10">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <p className="font-semibold text-[var(--text-primary)]">Phân quyền</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Cấp quyền truy cập</p>
          </Link>
        </div>
      </Card>

      {/* System Status */}
      <Card
        title="Trạng thái hệ thống"
        subtitle="Theo dõi hoạt động"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800/50">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="font-medium text-green-800 dark:text-green-300">API Server</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 mt-2 ml-6">Hoạt động bình thường</p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800/50">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="font-medium text-green-800 dark:text-green-300">Database</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 mt-2 ml-6">Kết nối ổn định</p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800/50">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="font-medium text-green-800 dark:text-green-300">Authentication</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 mt-2 ml-6">Token hợp lệ</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
