import { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FileText, Type, FolderOpen } from 'lucide-react';
import { Button, SearchableSelect, PageHeader } from '../../../components/ui';
import { useTranslation } from '../../../i18n/useTranslation';
import { useDocumentsQuery, useUpdateDocumentMutation, useWorkspacesQuery } from '../../../hooks/queries';
import { documentService } from '../../../services';
import type { Document, Workspace } from '../../../types';

const RichTextEditor = lazy(() => import('../../../components/editor/RichTextEditor'));

export default function DocEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  
  const updateDocumentMutation = useUpdateDocumentMutation();
  const { data: workspacesRaw } = useWorkspacesQuery();

  const workspaces: Workspace[] = useMemo(() => {
    if (Array.isArray(workspacesRaw)) return workspacesRaw as Workspace[];
    if (workspacesRaw && typeof workspacesRaw === 'object') {
      const obj = workspacesRaw as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data as Workspace[];
    }
    return [];
  }, [workspacesRaw]);

  // Documents are fetched in a list by default.
  const { data: documentsData, isLoading: isDocsLoading } = useDocumentsQuery();
  const documents: Document[] = useMemo(() => {
    if (!documentsData) return [];
    if (Array.isArray(documentsData)) return documentsData as Document[];
    if (typeof documentsData === 'object') {
      const obj = documentsData as unknown as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data as Document[];
      if (Array.isArray(obj.documents)) return obj.documents as Document[];
    }
    return [];
  }, [documentsData]);

  const baseDoc = documents.find(d => d._id === id);

  const [docName, setDocName] = useState('');
  const [docContent, setDocContent] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (baseDoc) {
      setDocName(baseDoc.name);
      const wsId = baseDoc.workspaceIds && baseDoc.workspaceIds.length > 0 ? baseDoc.workspaceIds[0] : '';
      setSelectedWorkspaceId(wsId);
      if (baseDoc.documentType === 'online') {
        if (baseDoc.content) {
          setDocContent(baseDoc.content);
        } else {
          documentService.getContent(baseDoc._id)
            .then(content => setDocContent(content))
            .catch(err => {
              console.error(err);
              toast.error(language === 'vi' ? 'Lỗi khi tải nội dung tài liệu' : 'Error loading document content');
            });
        }
      }
    }
  }, [baseDoc, language]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) {
      toast.error(language === 'vi' ? 'Vui lòng nhập tên tài liệu' : 'Please enter document name');
      return;
    }
    if (!id) return;
    setIsSaving(true);
    try {
      await updateDocumentMutation.mutateAsync({
        id,
        data: {
          name: docName,
          content: docContent,
          workspaceIds: selectedWorkspaceId ? [selectedWorkspaceId] : [],
        },
      });
      toast.success(language === 'vi' ? 'Cập nhật tài liệu thành công' : 'Document updated successfully');
      navigate('/documents');
    } catch (error) {
      console.error(error);
      toast.error(language === 'vi' ? 'Lỗi khi cập nhật tài liệu' : 'Error updating document');
    } finally {
      setIsSaving(false);
    }
  };

  if (isDocsLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  if (!baseDoc) {
    return (
      <div className="max-w-4xl mx-auto text-center py-24">
        <p className="text-sm text-[var(--text-muted)]">
          {language === 'vi' ? 'Không tìm thấy tài liệu.' : 'Document not found.'}
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/documents')}>
          {language === 'vi' ? 'Quay lại danh sách' : 'Back to list'}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <PageHeader
        breadcrumbs={[
          { label: language === 'vi' ? 'Tài liệu' : 'Documents', href: '/documents' },
          { label: baseDoc.name, href: `/documents/${id}` },
          { label: language === 'vi' ? 'Chỉnh sửa' : 'Edit' },
        ]}
        title={language === 'vi' ? 'Cập nhật Tài liệu' : 'Update Document'}
      
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
              {language === 'vi' ? 'Thông tin chỉnh sửa' : 'Edit Information'}
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
            
            {baseDoc.documentType === 'online' && (
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
            )}
          </div>

          <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)]/30 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/documents')} className="px-6">
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSaving} className="px-8 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600">
              {isSaving ? (language === 'vi' ? 'Đang lưu...' : 'Saving...') : (language === 'vi' ? 'Lưu thay đổi' : 'Save Changes')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
