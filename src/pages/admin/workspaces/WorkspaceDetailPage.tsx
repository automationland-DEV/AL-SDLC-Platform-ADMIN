import { useNavigate, useParams, Link } from 'react-router-dom';
import { Edit, Briefcase, Users, Key, Clock, ListTodo, Info, Trash2, UserPlus, X, Loader2 } from 'lucide-react';
import { Button, Badge, PageHeader, ConfirmModal, Select, MultiSearchableSelect } from '../../../components/ui';
import { useWorkspaceDetailQuery, useAddWorkspaceMemberMutation, useRemoveWorkspaceMemberMutation, useUpdateWorkspaceMemberRoleMutation } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import type { Workspace, WorkspaceMember, User } from '../../../types';
import { useMemo, useState } from 'react';
import { WorkspaceTasksTable } from '../components/workspaces/WorkspaceTasksTable';
import { userService } from '../../../services';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export default function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { data: workspaceRaw, isLoading } = useWorkspaceDetailQuery(id!);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks'>('overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addEmails, setAddEmails] = useState<string[]>([]);
  const [addRole, setAddRole] = useState('workspace_member');
  const [isAdding, setIsAdding] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ userId: string; name: string } | null>(null);

  const { data: allUsersRaw } = useQuery({
    queryKey: ['users', 'all-for-form'],
    queryFn: () => userService.getAllUsers({ limit: 1000 }),
    staleTime: 1000 * 60 * 5,
  });
  
  const allUsers: User[] = useMemo(() => {
    const raw = allUsersRaw as unknown;
    if (Array.isArray(raw)) return raw as User[];
    if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data as User[];
    }
    return [];
  }, [allUsersRaw]);

  const { mutateAsync: addWorkspaceMemberMutation } = useAddWorkspaceMemberMutation();
  const { mutateAsync: removeMember } = useRemoveWorkspaceMemberMutation();
  const { mutateAsync: updateMemberRole } = useUpdateWorkspaceMemberRoleMutation();

  const handleAddMember = async () => {
    if (addEmails.length === 0) {
      toast.error(language === 'vi' ? 'Vui lòng chọn ít nhất một người dùng' : 'Please select at least one user');
      return;
    }
    setIsAdding(true);
    try {
      await Promise.all(addEmails.map(email => 
        addWorkspaceMemberMutation({ workspaceId: id!, email, role: addRole })
      ));
      toast.success(language === 'vi' ? 'Thêm thành viên thành công' : 'Members added successfully');
      setIsAddModalOpen(false);
      setAddEmails([]);
    } catch {
      toast.error(language === 'vi' ? 'Thêm thành viên thất bại' : 'Failed to add members');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateMemberRole({ workspaceId: id!, userId, role: newRole });
      toast.success(language === 'vi' ? 'Cập nhật vai trò thành công' : 'Role updated successfully');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || (language === 'vi' ? 'Cập nhật vai trò thất bại' : 'Failed to update role'));
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      await removeMember({ workspaceId: id!, userId: memberToRemove.userId });
      toast.success(language === 'vi' ? 'Đã xóa thành viên' : 'Member removed');
      setMemberToRemove(null);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || (language === 'vi' ? 'Xóa thành viên thất bại' : 'Failed to remove member'));
    }
  };

  const workspace = useMemo(() => {
    if (!workspaceRaw) return null;
    const rawObj = workspaceRaw as unknown as Record<string, unknown>;
    return (rawObj.data ?? workspaceRaw) as Workspace;
  }, [workspaceRaw]);

  const members: { user: { _id?: string; fullName?: string; email?: string; avatar?: string } | null; role: string }[] = useMemo(() => {
    if (!workspace?.members) return [];
    return (workspace.members as WorkspaceMember[]).map(m => {
      const userId = m.userId;
      if (typeof userId === 'object' && userId !== null) {
        const u = userId as { _id?: string; fullName?: string; email?: string; avatar?: string };
        return { user: u, role: m.role };
      }
      return { user: { _id: userId as string }, role: m.role };
    });
  }, [workspace]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="max-w-4xl mx-auto text-center py-24">
        <Briefcase className="w-12 h-12 mx-auto text-[var(--text-muted)] stroke-1 mb-3" />
        <p className="text-sm text-[var(--text-muted)]">
          {language === 'vi' ? 'Không tìm thấy workspace.' : 'Workspace not found.'}
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/workspaces')}>
          {language === 'vi' ? 'Quay lại danh sách' : 'Back to list'}
        </Button>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (workspace.deletedAt) return <Badge variant="danger">Đã xóa</Badge>;
    return workspace.status === 'active'
      ? <Badge variant="success">{language === 'vi' ? 'Hoạt động' : 'Active'}</Badge>
      : <Badge variant="warning">{language === 'vi' ? 'Đã lưu trữ' : 'Archived'}</Badge>;
  };

  return (
    <div className="w-full">
      <PageHeader
        breadcrumbs={[
          { label: language === 'vi' ? 'Quản lý Workspace' : 'Workspaces', href: '/workspaces' },
          { label: language === 'vi' ? 'Chi tiết' : 'Detail' },
        ]}
        title={workspace.name}
        subtitle={workspace.description || (language === 'vi' ? 'Chưa có mô tả' : 'No description')}
        actions={
          <Link to={`/workspaces/${id}/edit`}>
            <Button size="sm">
              <Edit className="w-4 h-4" />
              {language === 'vi' ? 'Chỉnh sửa' : 'Edit'}
            </Button>
          </Link>
        }
      />

      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-[var(--border-color)]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-1 py-3 text-sm font-bold transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'text-sky-600 border-sky-600'
                : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
            }`}
          >
            <Info className="w-4 h-4" />
            {language === 'vi' ? 'Tổng quan' : 'Overview'}
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-1 py-3 text-sm font-bold transition-colors border-b-2 ${
              activeTab === 'tasks'
                ? 'text-sky-600 border-sky-600'
                : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            {language === 'vi' ? 'Công việc' : 'Tasks'}
          </button>
        </div>

        {activeTab === 'overview' ? (
          <>
            {/* Info Card */}
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
              {/* Header */}
              <div className="p-6 flex items-center gap-4 border-b border-[var(--border-color)] bg-gradient-to-r from-sky-500/5 to-transparent">
                {workspace.avatar ? (
                  <img src={workspace.avatar} alt={workspace.name} className="w-16 h-16 rounded-2xl object-cover border border-[var(--border-color)] shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-500 font-bold text-2xl shrink-0">
                    {workspace.key?.slice(0, 2).toUpperCase() || 'WS'}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-[var(--text-primary)] truncate">{workspace.name}</h3>
                  <p className="text-xs font-mono-code text-[var(--text-muted)] mt-0.5">#{workspace._id.slice(-8)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusBadge()}
                    <Badge variant="default" mono>{workspace.type?.toUpperCase() || 'KANBAN'}</Badge>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="p-6 grid grid-cols-2 gap-5">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] shrink-0">
                    <Key className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-0.5">Key</p>
                    <p className="text-sm font-mono font-bold text-[var(--text-primary)]">{workspace.key}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-0.5">{language === 'vi' ? 'Thành viên' : 'Members'}</p>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{members.length} {language === 'vi' ? 'người' : 'members'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-0.5">{language === 'vi' ? 'Ngày tạo' : 'Created'}</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {workspace.createdAt ? new Date(workspace.createdAt).toLocaleDateString('vi-VN') : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Members Card */}
            {members.length > 0 && (
              <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm">
                <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[var(--text-muted)]" />
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">
                      {language === 'vi' ? 'Danh sách thành viên' : 'Members'} ({members.length})
                    </h4>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => setIsAddModalOpen(true)}>
                    <UserPlus className="w-4 h-4" />
                    {language === 'vi' ? 'Thêm' : 'Add'}
                  </Button>
                </div>
                <div className="divide-y divide-[var(--border-color)]">
                  {members.map((m, idx) => (
                    <div key={idx} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {m.user?.avatar ? (
                          <img src={m.user.avatar} alt="" className="w-8 h-8 rounded-lg object-cover border border-[var(--border-color)] shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-500 font-bold text-xs shrink-0">
                            {m.user?.fullName?.charAt(0).toUpperCase() || m.user?.email?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{m.user?.fullName || 'N/A'}</p>
                          <p className="text-xs text-[var(--text-muted)] truncate">{m.user?.email || ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {(() => {
                          const ownerObj = workspace.ownerId as Record<string, unknown> | string | undefined;
                          const ownerIdStr = typeof ownerObj === 'object' && ownerObj !== null ? (ownerObj._id || ownerObj.id) : ownerObj;
                          const memberUserId = m.user?._id;
                          const isOwner = ownerIdStr && memberUserId && String(ownerIdStr) === String(memberUserId);

                          if (isOwner) {
                            return (
                              <Badge variant="info">
                                {language === 'vi' ? 'Quản trị viên (Chủ WS)' : 'Admin (Owner)'}
                              </Badge>
                            );
                          }

                          const currentRoleVal = m.role.includes('admin')
                            ? 'workspace_admin'
                            : m.role.includes('viewer')
                            ? 'workspace_viewer'
                            : 'workspace_member';

                          return (
                            <>
                              <Select
                                value={currentRoleVal}
                                onChange={(newRole) => memberUserId && handleRoleChange(memberUserId, newRole)}
                                options={[
                                  { value: 'workspace_admin', label: language === 'vi' ? 'Quản trị viên' : 'Admin' },
                                  { value: 'workspace_member', label: language === 'vi' ? 'Thành viên' : 'Member' },
                                  { value: 'workspace_viewer', label: language === 'vi' ? 'Người xem' : 'Viewer' },
                                ]}
                                className="w-36 text-xs"
                              />
                              <button
                                onClick={() => memberUserId && setMemberToRemove({ userId: memberUserId, name: m.user?.fullName || m.user?.email || 'Unknown' })}
                                className="p-1.5 rounded-lg text-rose-500/70 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                title={language === 'vi' ? 'Xóa' : 'Remove'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <WorkspaceTasksTable workspaceId={workspace._id} />
        )}

        <div className="flex justify-end pt-4">
          <Button variant="secondary" onClick={() => navigate('/workspaces')}>
            {language === 'vi' ? 'Quay lại danh sách' : 'Back to list'}
          </Button>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 transition-all duration-200">
          <div className="w-full max-w-md shadow-2xl relative flex flex-col border border-[var(--border-color)] bg-[var(--bg-card)] rounded-xl">
            <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-start gap-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {language === 'vi' ? 'Thêm thành viên' : 'Add member'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Email / Người dùng</label>
                <MultiSearchableSelect 
                  values={addEmails} 
                  onChange={setAddEmails} 
                  options={allUsers
                    .filter(u => !members.some(m => m.user?.email === u.email || m.user?._id === u.id || m.user?._id === (u as { _id?: string })._id))
                    .map(u => ({
                      value: u.email,
                      label: u.fullName || u.email,
                      email: u.email,
                      avatar: u.avatar
                    }))
                  }
                  placeholder={language === 'vi' ? 'Chọn người dùng...' : 'Select users...'}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">{language === 'vi' ? 'Vai trò' : 'Role'}</label>
                <Select
                  value={addRole}
                  onChange={setAddRole}
                  options={[
                    { value: 'workspace_admin', label: language === 'vi' ? 'Quản trị viên' : 'Admin' },
                    { value: 'workspace_member', label: language === 'vi' ? 'Thành viên' : 'Member' },
                    { value: 'workspace_viewer', label: language === 'vi' ? 'Người xem' : 'Viewer' },
                  ]}
                />
              </div>
            </div>
            <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)]/50 flex justify-end gap-2.5 rounded-b-xl">
              <Button variant="secondary" size="sm" onClick={() => setIsAddModalOpen(false)} disabled={isAdding}>
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </Button>
              <Button variant="primary" size="sm" onClick={handleAddMember} disabled={isAdding}>
                {isAdding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isAdding ? (language === 'vi' ? 'Đang thêm...' : 'Adding...') : (language === 'vi' ? 'Thêm' : 'Add')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!memberToRemove}
        title={language === 'vi' ? 'Xóa thành viên' : 'Remove member'}
        message={(language === 'vi' ? 'Bạn có chắc chắn muốn xóa ' : 'Are you sure you want to remove ') + memberToRemove?.name + '?'}
        onConfirm={handleRemoveMember}
        onCancel={() => setMemberToRemove(null)}
      />
    </div>
  );
}

