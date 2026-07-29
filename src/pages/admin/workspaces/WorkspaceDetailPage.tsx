import { useNavigate, useParams, Link } from 'react-router-dom';
import { Edit, Briefcase, Users, Key, Clock, ListTodo, Info } from 'lucide-react';
import { Button, Badge, PageHeader } from '../../../components/ui';
import { useWorkspacesQuery } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import type { Workspace, WorkspaceMember } from '../../../types';
import { useMemo, useState } from 'react';
import { WorkspaceTasksTable } from '../components/workspaces/WorkspaceTasksTable';

const formatRole = (role: string) => {
  const roleMap: Record<string, string> = {
    workspace_admin: 'Quản trị viên',
    workspace_member: 'Thành viên',
    workspace_viewer: 'Người xem',
    admin: 'Quản trị viên',
    member: 'Thành viên',
  };
  return roleMap[role] || role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

export default function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { data: workspacesRaw, isLoading } = useWorkspacesQuery();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks'>('overview');

  const workspaces: Workspace[] = useMemo(() => {
    if (Array.isArray(workspacesRaw)) return workspacesRaw as Workspace[];
    if (workspacesRaw && typeof workspacesRaw === 'object') {
      const obj = workspacesRaw as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data as Workspace[];
    }
    return [];
  }, [workspacesRaw]);

  const workspace = workspaces.find(w => w._id === id);

  const members: { user: { fullName?: string; email?: string; avatar?: string } | null; role: string }[] = useMemo(() => {
    if (!workspace?.members) return [];
    return (workspace.members as WorkspaceMember[]).map(m => {
      const userId = m.userId;
      if (typeof userId === 'object' && userId !== null) {
        const u = userId as { fullName?: string; email?: string; avatar?: string };
        return { user: u, role: m.role };
      }
      return { user: null, role: m.role };
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
              <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[var(--border-color)] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--text-muted)]" />
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    {language === 'vi' ? 'Danh sách thành viên' : 'Members'} ({members.length})
                  </h4>
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
                      <Badge variant={m.role.includes('admin') ? 'info' : 'default'}>
                        {formatRole(m.role)}
                      </Badge>
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
    </div>
  );
}
