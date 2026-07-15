import { Button, Card, Badge } from '../../../../components/ui';
import type { Workspace } from '../../../../types';

interface WorkspaceViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace | null;
  members: { userId: { fullName?: string; email?: string } | null; role: string }[];
}

export function WorkspaceViewModal({ isOpen, onClose, workspace, members }: WorkspaceViewModalProps) {
  if (!isOpen || !workspace) return null;

  const getStatusBadge = (status: string | undefined) => {
    return status === 'active' ? (
      <Badge variant="success">Hoạt động</Badge>
    ) : (
      <Badge variant="danger">Đã lưu trữ</Badge>
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
            <div className="w-16 h-16 rounded-xl bg-primary-200 dark:bg-primary-800 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-2xl shadow-sm">
              {workspace.key}
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
              <p className="font-medium">{workspace.createdAt ? new Date(workspace.createdAt as string).toLocaleDateString('vi-VN') : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] uppercase font-semibold">Trạng thái</p>
              <div className="mt-1">{getStatusBadge(workspace.status)}</div>
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
                      <th className="px-4 py-3 font-semibold w-32">Vai trò</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {members.map((member, index) => {
                      const user = member.userId;
                      return (
                        <tr key={index} className="hover:bg-[var(--hover-bg)] transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-[var(--text-primary)]">{user?.fullName || 'N/A'}</div>
                            <div className="text-xs text-[var(--text-secondary)]">{user?.email || 'N/A'}</div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={member.role === 'admin' ? 'danger' : 'default'}>
                              {member.role}
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
