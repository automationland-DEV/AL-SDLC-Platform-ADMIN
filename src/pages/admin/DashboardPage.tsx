import { Link } from 'react-router-dom';
import {
  Users,
  Briefcase,
  FileText,
  Shield,
  UserPlus,
  BriefcaseIcon,
} from 'lucide-react';
import { Card } from '../../components/ui';
import { useUsersStore, useWorkspacesStore, useDocumentsStore } from '../../stores';

export default function DashboardPage() {
  const { users, total: totalUsers } = useUsersStore();
  const { workspaces, total: totalWorkspaces } = useWorkspacesStore();
  const { total: totalDocuments } = useDocumentsStore();

  const stats = [
    { label: 'Tổng Users', value: totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', link: '/users' },
    { label: 'Workspaces', value: totalWorkspaces, icon: Briefcase, color: 'text-green-600', bg: 'bg-green-50', link: '/workspaces' },
    { label: 'Documents', value: totalDocuments, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50', link: '/documents' },
    { label: 'Permissions', value: '5', icon: Shield, color: 'text-orange-600', bg: 'bg-orange-50', link: '/permissions' },
  ];

  const recentUsers = users.slice(0, 5);
  const recentWorkspaces = workspaces.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} to={stat.link}>
              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value || '-'}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bg} ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card title="Users gần đây" actions={
          <Link to="/users" className="text-sm text-primary-600 hover:text-primary-700">Xem tất cả</Link>
        }>
          {recentUsers.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentUsers.map((user) => (
                <div key={user.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.fullName || ''} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-600">
                          {user.fullName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.fullName || user.email}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'super_admin' 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {user.role === 'super_admin' ? 'Super Admin' : 'User'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">Chưa có users</p>
          )}
        </Card>

        {/* Recent Workspaces */}
        <Card title="Workspaces gần đây" actions={
          <Link to="/workspaces" className="text-sm text-primary-600 hover:text-primary-700">Xem tất cả</Link>
        }>
          {recentWorkspaces.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentWorkspaces.map((ws) => (
                <div key={ws._id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary-600">{ws.key}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ws.name}</p>
                      <p className="text-xs text-gray-500">{ws.members?.length || 0} thành viên</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    ws.status === 'active' || ws.status === undefined
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {ws.status === 'active' || ws.status === undefined ? 'Hoạt động' : 'Đã lưu trữ'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">Chưa có workspaces</p>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title="Thao tác nhanh">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/users"
            className="p-4 text-left rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <UserPlus className="w-8 h-8 text-primary-600 mb-2" />
            <p className="font-medium text-gray-900">Thêm User</p>
            <p className="text-sm text-gray-500">Tạo tài khoản mới</p>
          </Link>
          <Link
            to="/workspaces"
            className="p-4 text-left rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <BriefcaseIcon className="w-8 h-8 text-green-600 mb-2" />
            <p className="font-medium text-gray-900">Tạo Workspace</p>
            <p className="text-sm text-gray-500">Không gian làm việc mới</p>
          </Link>
          <Link
            to="/documents"
            className="p-4 text-left rounded-lg border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <FileText className="w-8 h-8 text-purple-600 mb-2" />
            <p className="font-medium text-gray-900">Upload Document</p>
            <p className="text-sm text-gray-500">Tải lên tài liệu</p>
          </Link>
          <Link
            to="/permissions"
            className="p-4 text-left rounded-lg border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <Shield className="w-8 h-8 text-orange-600 mb-2" />
            <p className="font-medium text-gray-900">Phân quyền</p>
            <p className="text-sm text-gray-500">Cấp quyền truy cập</p>
          </Link>
        </div>
      </Card>
    </div>
  );
}
