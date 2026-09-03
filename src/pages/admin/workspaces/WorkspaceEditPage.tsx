import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FolderEdit, Columns, Repeat, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, SearchableSelect, PageHeader } from '../../../components/ui';
import { useWorkspaceDetailQuery, useUpdateWorkspaceMutation } from '../../../hooks/queries';
import { useQuery } from '@tanstack/react-query';
import { userService } from '../../../services';
import { useTranslation } from '../../../i18n/useTranslation';
import type { User, Workspace } from '../../../types';

const SAMPLE_AVATARS = [
  "https://res.cloudinary.com/sdlcplatform/image/upload/sdlc-platform/sample%20avater%20workspace/viewavatar-1.png",
  "https://res.cloudinary.com/sdlcplatform/image/upload/sdlc-platform/sample%20avater%20workspace/viewavatar-2.png",
  "https://res.cloudinary.com/sdlcplatform/image/upload/sdlc-platform/sample%20avater%20workspace/viewavatar-3.png",
  "https://res.cloudinary.com/sdlcplatform/image/upload/sdlc-platform/sample%20avater%20workspace/viewavatar-4.png",
  "https://res.cloudinary.com/sdlcplatform/image/upload/sdlc-platform/sample%20avater%20workspace/viewavatar-5.png",
  "https://res.cloudinary.com/sdlcplatform/image/upload/sdlc-platform/sample%20avater%20workspace/viewavatar-6.png",
  "https://res.cloudinary.com/sdlcplatform/image/upload/sdlc-platform/sample%20avater%20workspace/viewavatar-7.png",
  "https://res.cloudinary.com/sdlcplatform/image/upload/sdlc-platform/sample%20avater%20workspace/viewavatar-8.png",
  "https://res.cloudinary.com/sdlcplatform/image/upload/sdlc-platform/sample%20avater%20workspace/viewavatar-9.png",
  "https://res.cloudinary.com/sdlcplatform/image/upload/sdlc-platform/sample%20avater%20workspace/viewavatar-10.png",
];

export default function WorkspaceEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, t } = useTranslation();
  const updateWorkspaceMutation = useUpdateWorkspaceMutation();

  const { data: workspaceRaw, isLoading } = useWorkspaceDetailQuery(id!);
  const workspace = useMemo(() => {
    if (!workspaceRaw) return null;
    const rawObj = workspaceRaw as unknown as Record<string, unknown>;
    return (rawObj.data ?? workspaceRaw) as Workspace;
  }, [workspaceRaw]);

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

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [template, setTemplate] = useState('kanban');
  const [avatar, setAvatar] = useState(SAMPLE_AVATARS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
      setKey(workspace.key);
      setDescription(workspace.description || '');
      const owner = workspace.ownerId;
      const ownerStr = typeof owner === 'object' && owner !== null
        ? (owner as { _id?: string; id?: string })._id || (owner as { _id?: string; id?: string }).id
        : owner;
      setOwnerId((ownerStr as string) || '');
      setTemplate(workspace.template || 'kanban');
      setAvatar(workspace.avatar || SAMPLE_AVATARS[0]);
    }
  }, [workspace]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) {
      setFormError(language === 'vi' ? 'Vui lòng nhập đầy đủ Tên và Key' : 'Please input both Name and Key');
      return;
    }
    if (!id) return;
    setFormError('');
    setIsSaving(true);
    try {
      await updateWorkspaceMutation.mutateAsync({
        id,
        data: { name, key, description, ownerId, type: template, avatar } as Partial<Workspace>,
      });
      toast.success(language === 'vi' ? 'Cập nhật workspace thành công' : 'Workspace updated successfully');
      navigate(`/workspaces/${id}`);
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err.response?.data?.message || err.message || (language === 'vi' ? 'Lưu workspace thất bại' : 'Failed to save workspace'));
    } finally {
      setIsSaving(false);
    }
  };

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
        <p className="text-sm text-[var(--text-muted)]">
          {language === 'vi' ? 'Không tìm thấy workspace.' : 'Workspace not found.'}
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/workspaces')}>
          {language === 'vi' ? 'Quay lại danh sách' : 'Back to list'}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <PageHeader
        breadcrumbs={[
          { label: language === 'vi' ? 'Quản lý Workspace' : 'Workspaces', href: '/workspaces' },
          { label: workspace.name, href: `/workspaces/${id}` },
          { label: language === 'vi' ? 'Chỉnh sửa' : 'Edit' },
        ]}
        title={language === 'vi' ? 'Chỉnh sửa Workspace' : 'Edit Workspace'}
      
        actions={
          <Button variant="secondary" onClick={() => navigate(`/workspaces/${id}`)} className="px-4">
            {language === 'vi' ? 'Quay lại' : 'Go Back'}
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[var(--border-color)] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-500">
              <FolderEdit className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {language === 'vi' ? 'Cập nhật thông tin Workspace' : 'Update Workspace Information'}
            </h3>
          </div>

          <div className="p-6 space-y-6">
            {formError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{formError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[var(--text-primary)]">
                  {language === 'vi' ? 'Tên Workspace' : 'Workspace Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-all text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[var(--text-primary)]">
                  {language === 'vi' ? 'Key (Mã)' : 'Key (Code)'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-mono transition-all text-sm"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-sm font-semibold text-[var(--text-primary)]">{t('table.description')}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-all text-sm resize-none"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-sm font-semibold text-[var(--text-primary)]">
                  {language === 'vi' ? 'Chủ sở hữu' : 'Owner'}
                </label>
                <SearchableSelect
                  options={allUsers.map(u => ({ value: (u.id || (u as { _id?: string })._id || '') as string, label: u.fullName || u.email }))}
                  value={ownerId}
                  onChange={setOwnerId}
                  placeholder={language === 'vi' ? 'Chọn chủ sở hữu...' : 'Select owner...'}
                />
              </div>
            </div>

            <hr className="border-[var(--border-color)]" />

            {/* Avatar picker */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-[var(--text-primary)]">
                {language === 'vi' ? 'Ảnh đại diện' : 'Avatar'}
              </label>
              <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
                {SAMPLE_AVATARS.map((url, i) => (
                  <button key={i} type="button" onClick={() => setAvatar(url)}
                    className={`relative aspect-square overflow-hidden rounded-lg border transition-all ${avatar === url ? 'border-sky-500 ring-2 ring-sky-500/25' : 'border-[var(--border-color)] hover:border-sky-400/60'}`}
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    {avatar === url && (
                      <span className="absolute right-0.5 top-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-white">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-[var(--border-color)]" />

            {/* Template picker */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-[var(--text-primary)]">
                {language === 'vi' ? 'Loại (template)' : 'Type (template)'}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { value: 'kanban', Icon: Columns, title: 'Kanban', desc: language === 'vi' ? 'Tập trung vào luồng công việc liên tục.' : 'Continuous workflow focus.' },
                  { value: 'scrum', Icon: Repeat, title: 'Scrum', desc: language === 'vi' ? 'Làm việc theo sprint định kỳ với backlog.' : 'Periodic sprints with backlog.' },
                ].map(({ value, Icon, title, desc }) => (
                  <button key={value} type="button" onClick={() => setTemplate(value)}
                    className={`p-4 border-2 rounded-xl text-left transition-all relative ${template === value ? 'border-sky-500 bg-sky-500/5' : 'border-[var(--border-color)] hover:border-sky-400/40'}`}
                  >
                    {template === value && <div className="absolute top-4 right-4 w-3.5 h-3.5 rounded-full bg-sky-500 border-2 border-sky-200" />}
                    <Icon className={`w-7 h-7 mb-2 ${template === value ? 'text-sky-500' : 'text-[var(--text-muted)]'}`} />
                    <h4 className="font-bold text-[var(--text-primary)] text-sm">{title}</h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)]/30 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate(`/workspaces/${id}`)} className="px-6">
              {language === 'vi' ? 'Hủy' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={isSaving} className="px-6">
              {isSaving ? (language === 'vi' ? 'Đang lưu...' : 'Saving...') : (language === 'vi' ? 'Lưu thay đổi' : 'Save Changes')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
