import { useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FileText, Type, FolderOpen } from 'lucide-react';
import { Button, SearchableSelect, PageHeader } from '../../../components/ui';
import { useTranslation } from '../../../i18n/useTranslation';
import { useCreateOnlineDocumentMutation, useWorkspacesQuery } from '../../../hooks/queries';
import type { Workspace } from '../../../types';
import { useMemo } from 'react';

const RichTextEditor = lazy(() => import('../../../components/editor/RichTextEditor'));

export default function DocNewPage() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  
  const createOnlineMutation = useCreateOnlineDocumentMutation();
  const { data: workspacesRaw } = useWorkspacesQuery();

  const workspaces: Workspace[] = useMemo(() => {
    if (Array.isArray(workspacesRaw)) return workspacesRaw as Workspace[];
    if (workspacesRaw && typeof workspacesRaw === 'object') {
      const obj = (workspacesRaw as unknown) as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data as Workspace[];
    }
    return [];
  }, [workspacesRaw]);

  const [docName, setDocName] = useState('');
  const [docContent, setDocContent] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) {
      toast.error(language === 'vi' ? 'Vui lòng nhập tên tài liệu' : 'Please enter document name');
      return;
    }
    setIsSaving(true);
    try {
      await createOnlineMutation.mutateAsync({
        name: docName,
        content: docContent,
        workspaceIds: selectedWorkspaceId ? [selectedWorkspaceId] : [],
      });
      toast.success(language === 'vi' ? 'Tạo tài liệu online thành công' : 'Online document created successfully');
      navigate('/documents');
    } catch (error) {
      console.error(error);
      toast.error(language === 'vi' ? 'Lỗi khi tạo tài liệu' : 'Error creating document');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full">
      <PageHeader
        breadcrumbs={[
          { label: language === 'vi' ? 'Tài liệu' : 'Documents', href: '/documents' },
          { label: language === 'vi' ? 'Tạo Online' : 'Create Online' },
        ]}
        title={language === 'vi' ? 'Tạo Tài liệu Online' : 'Create Online Document'}
        subtitle={language === 'vi' ? 'Soạn thảo trực tiếp trên nền tảng với đầy đủ công cụ' : 'Write and edit online directly with rich tools'}
      
        actions={
          <Button variant="secondary" onClick={() => navigate(-1)} className="px-4">
            {language === 'vi' ? 'Quay lại' : 'Go Back'}
          </Button>
        }
      />

      <form onSubmit={handleSave}>
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm flex flex-col">
          <div className="p-5 border-b border-[var(--border-color)] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {language === 'vi' ? 'Thông tin tài liệu' : 'Document Information'}
            </h3>
          </div>

          <div className="p-6 flex flex-col space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <Type className="w-4 h-4 text-primary-500" /> {language === 'vi' ? 'Tên tài liệu' : 'Document Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'vi' ? 'Nhập tên tài liệu...' : 'Enter document name...'}
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-all shadow-sm text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <FolderOpen className="w-4 h-4 text-primary-500" /> {language === 'vi' ? 'Workspace liên kết' : 'Linked Workspace'} <span className="text-[var(--text-muted)] font-normal">({language === 'vi' ? 'Tùy chọn' : 'Optional'})</span>
                </label>
                <div className="relative">
                  <SearchableSelect
                    options={workspaces.map(ws => ({ value: ws._id, label: ws.name }))}
                    value={selectedWorkspaceId}
                    onChange={setSelectedWorkspaceId}
                    placeholder={language === 'vi' ? 'Chọn Workspace...' : 'Select Workspace...'}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex-1 min-h-[500px] border border-[var(--border-color)] rounded-xl overflow-hidden flex flex-col bg-white dark:bg-gray-900 relative shadow-inner mt-2">
              <Suspense fallback={
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-secondary)] bg-[var(--bg-tertiary)]">
                  <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="font-medium animate-pulse text-sm">
                    {language === 'vi' ? 'Đang tải công cụ soạn thảo...' : 'Loading editor tools...'}
                  </p>
                </div>
              }>
                <RichTextEditor
                  value={docContent}
                  onChange={setDocContent}
                  placeholder={language === 'vi' ? 'Bắt đầu soạn thảo nội dung tài liệu của bạn ở đây...' : 'Start drafting your document content here...'}
                />
              </Suspense>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)]/30 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/documents')} className="px-6">
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSaving} className="px-8 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600">
              {isSaving ? (language === 'vi' ? 'Đang tạo...' : 'Creating...') : (language === 'vi' ? 'Tạo tài liệu' : 'Create Document')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
