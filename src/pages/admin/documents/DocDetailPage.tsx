import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { Download, Edit, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Badge, PageHeader } from '../../../components/ui';
import { useTranslation } from '../../../i18n/useTranslation';
import { useDocumentsQuery, useWorkspacesQuery } from '../../../hooks/queries';
import { documentService } from '../../../services';
import type { Document, Workspace } from '../../../types';

export default function DocDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useTranslation();

  const { data: workspacesRaw } = useWorkspacesQuery();
  const workspaces: Workspace[] = useMemo(() => {
    if (Array.isArray(workspacesRaw)) return workspacesRaw as Workspace[];
    if (workspacesRaw && typeof workspacesRaw === 'object') {
      const obj = (workspacesRaw as unknown) as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data as Workspace[];
    }
    return [];
  }, [workspacesRaw]);

  // Documents are fetched in a list by default. We search for our doc in the list.
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
  const [docContent, setDocContent] = useState<string>('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  useEffect(() => {
    if (baseDoc?.documentType === 'online' && !baseDoc.content) {
      setIsLoadingContent(true);
      documentService.getContent(baseDoc._id)
        .then(content => setDocContent(content))
        .catch(err => {
          console.error(err);
          toast.error(language === 'vi' ? 'Lỗi khi tải nội dung tài liệu' : 'Error loading document content');
        })
        .finally(() => setIsLoadingContent(false));
    } else if (baseDoc?.content) {
      setDocContent(baseDoc.content);
    }
  }, [baseDoc, language]);

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
        <FileText className="w-12 h-12 mx-auto text-[var(--text-muted)] stroke-1 mb-3" />
        <p className="text-sm text-[var(--text-muted)]">
          {language === 'vi' ? 'Không tìm thấy tài liệu.' : 'Document not found.'}
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/documents')}>
          {language === 'vi' ? 'Quay lại danh sách' : 'Back to list'}
        </Button>
      </div>
    );
  }

  const handleDownload = async () => {
    try {
      toast.loading(language === 'vi' ? 'Đang tải file...' : 'Downloading...', { id: 'download' });
      const { data: blobData, filename } = await documentService.download(baseDoc._id, baseDoc.documentType === 'online');
      const url = window.URL.createObjectURL(blobData);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = filename || baseDoc.originalName || baseDoc.name || 'document';
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
      toast.success(language === 'vi' ? 'Tải file thành công' : 'File downloaded successfully', { id: 'download' });
    } catch (error) {
      console.error(error);
      toast.error(language === 'vi' ? 'Lỗi khi tải file' : 'Error downloading file', { id: 'download' });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getWorkspaceNames = () => {
    if (!baseDoc.workspaceIds || baseDoc.workspaceIds.length === 0) return '-';
    const names = baseDoc.workspaceIds.map(wId => {
      const w = workspaces.find(ws => ws._id === wId);
      return w ? w.name : wId;
    });
    return names.join(', ');
  };

  const creatorName = baseDoc.uploadedBy && typeof baseDoc.uploadedBy === 'object' ? (baseDoc.uploadedBy as { fullName?: string }).fullName : 'Hệ thống';

  return (
    <div className={`mx-auto ${baseDoc.documentType === 'online' ? 'max-w-5xl' : 'max-w-3xl'}`}>
      <PageHeader
        breadcrumbs={[
          { label: language === 'vi' ? 'Tài liệu' : 'Documents', href: '/documents' },
          { label: language === 'vi' ? 'Chi tiết' : 'Detail' },
        ]}
        title={baseDoc.name}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4" />
              {language === 'vi' ? 'Tải xuống' : 'Download'}
            </Button>
            {baseDoc.documentType === 'online' && (
              <Link to={`/documents/${id}/edit`}>
                <Button size="sm">
                  <Edit className="w-4 h-4" />
                  {language === 'vi' ? 'Chỉnh sửa' : 'Edit'}
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 mb-8">
            <div>
              <p className="text-sm text-[var(--text-muted)] mb-1">{language === 'vi' ? 'Tên tài liệu' : 'Document Name'}</p>
              <p className="font-medium text-[var(--text-primary)] break-words">{baseDoc.name}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)] mb-1">{language === 'vi' ? 'Loại tài liệu' : 'Document Type'}</p>
              <Badge variant={baseDoc.documentType === 'online' ? 'info' : 'success'} mono>
                {baseDoc.documentType === 'online' ? 'ONLINE' : 'UPLOAD'}
              </Badge>
            </div>
            
            {(!baseDoc.documentType || baseDoc.documentType === 'upload') && (
              <>
                <div>
                  <p className="text-sm text-[var(--text-muted)] mb-1">{language === 'vi' ? 'Tên gốc' : 'Original Name'}</p>
                  <p className="font-medium text-[var(--text-primary)] break-words">{baseDoc.originalName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)] mb-1">{language === 'vi' ? 'Kích thước' : 'Size'}</p>
                  <p className="font-medium text-[var(--text-primary)]">{baseDoc.size ? formatFileSize(baseDoc.size) : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)] mb-1">{language === 'vi' ? 'Định dạng' : 'Format'}</p>
                  <p className="font-medium text-[var(--text-primary)] break-words uppercase">{baseDoc.extension ? baseDoc.extension.replace('.', '') : '-'}</p>
                </div>
              </>
            )}

            <div>
              <p className="text-sm text-[var(--text-muted)] mb-1">{language === 'vi' ? 'Ngày tạo' : 'Created At'}</p>
              <p className="font-medium text-[var(--text-primary)]">
                {baseDoc.createdAt ? new Date(baseDoc.createdAt).toLocaleString('vi-VN') : '-'}
              </p>
            </div>

            <div>
              <p className="text-sm text-[var(--text-muted)] mb-1">{language === 'vi' ? 'Người tạo' : 'Creator'}</p>
              <p className="font-medium text-[var(--text-primary)]">{creatorName}</p>
            </div>

            <div>
              <p className="text-sm text-[var(--text-muted)] mb-1">{language === 'vi' ? 'Workspace liên kết' : 'Linked Workspace'}</p>
              <p className="font-medium text-[var(--text-primary)] break-words">{getWorkspaceNames()}</p>
            </div>
          </div>

          {baseDoc.documentType === 'online' && (
            <div className="mt-4 border-t border-[var(--border-color)] pt-6">
              <p className="text-sm font-bold text-[var(--text-primary)] mb-4">{language === 'vi' ? 'Nội dung' : 'Content'}</p>
              <div className="bg-[var(--bg-tertiary)] rounded-xl p-6 border border-[var(--border-color)] min-h-[300px]">
                {isLoadingContent ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent" />
                  </div>
                ) : (
                  <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(docContent) }} />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[var(--border-color)] flex justify-end">
          <Button variant="secondary" onClick={() => navigate('/documents')}>
            {language === 'vi' ? 'Quay lại danh sách' : 'Back to list'}
          </Button>
        </div>
      </div>
    </div>
  );
}
