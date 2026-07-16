import { Button, Card, Badge } from '../../../../components/ui';
import type { Workspace } from '../../../../types';

const formatRole = (role: string) => {
  const roleMap: Record<string, string> = {
    workspace_admin: 'Quản trị viên',
    workspace_member: 'Thành viên',
    workspace_viewer: 'Người xem',
    workspace_editor: 'Người sửa',
    admin: 'Quản trị viên',
    member: 'Thành viên',
  };
  return roleMap[role] || role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const getRoleBadgeVariant = (role: string) => {
  if (role.includes('admin')) return 'danger';
  if (role.includes('editor')) return 'warning';
  return 'default';
};

interface WorkspaceViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace | null;
  members: { userId: { fullName?: string; email?: string; avatar?: string } | null; role: string }[];
}

export function WorkspaceViewModal({ isOpen, onClose, workspace, members }: WorkspaceViewModalProps) {
  if (!isOpen || !workspace) return null;

  const getStatusBadge = () => {
    if (workspace.deletedAt) {
      return <Badge variant="danger">Đã xóa</Badge>;
    }
    return workspace.status === 'active' ? (
      <Badge variant="success">Hoạt động</Badge>
    ) : (
      <Badge variant="warning">Đã lưu trữ</Badge>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <Card className="w-full max-w-2xl m-4 relative flex flex-col max-h-[90vh]">
        <h3 className="text-lg font-bold mb-4 text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">
          Chi tiết Workspace
        </h3>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {/* Header Info */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 rounded-xl p-5 border border-primary-100 dark:border-primary-900/50 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary-200 dark:bg-primary-800 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-2xl shadow-sm shrink-0 overflow-hidden">
              {workspace.key?.slice(0, 2).toUpperCase() || 'WS'}
            </div>
            <div>
              <h4 className="font-semibold text-xl text-[var(--text-primary)]">{workspace.name}</h4>
              <p className="text-[var(--text-secondary)] mt-1">{workspace.description || 'Chưa có mô tả'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-[var(--text-primary)] bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-color)]">
            <div>
              <p className="text-xs text-[var(--text-secondary)] uppercase font-semibold">ID</p>
              <p className="font-medium">#{workspace._id.slice(-6)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] uppercase font-semibold">Ngày tạo</p>
              <p className="font-medium">{workspace.createdAt ? new Date(workspace.createdAt as string).toLocaleString('vi-VN') : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] uppercase font-semibold">Trạng thái</p>
              <div className="mt-1">{getStatusBadge()}</div>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] uppercase font-semibold">Số thành viên</p>
              <p className="font-medium">{members.length} người</p>
            </div>
          </div>

          {/* Members List */}
          <div>
            <h5 className="font-semibold text-[var(--text-primary)] mb-3">Danh sách Thành viên ({members.length})</h5>
            {members.length > 0 ? (
              <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--bg-tertiary)] text-[var(--text-secondary)] uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Tên / Email</th>
                      <th className="px-4 py-3 font-semibold w-40">Vai trò</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {members.map((member, index) => {
                      const user = member.userId;
                      return (
                        <tr key={index} className="hover:bg-[var(--hover-bg)] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {user?.avatar ? (
                                <img src={user.avatar} alt={user.fullName || 'User'} className="w-8 h-8 rounded-full object-cover shrink-0 border border-[var(--border-color)]" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center border border-[var(--border-color)] shrink-0">
                                  <span className="text-sm font-medium text-primary-600 dark:text-primary-300">
                                    {user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                                  </span>
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-[var(--text-primary)]">{user?.fullName || 'N/A'}</div>
                                <div className="text-xs text-[var(--text-secondary)]">{user?.email || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={getRoleBadgeVariant(member.role)}>
                              {formatRole(member.role)}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)]">
                Chưa có thành viên nào
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--border-color)]">
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </Card>
    </div>
  );
}
