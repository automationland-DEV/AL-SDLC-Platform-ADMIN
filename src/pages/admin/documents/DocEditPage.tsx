import { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, SearchableSelect, DocumentNameModal } from '../../../components/ui';
import { useTranslation } from '../../../i18n/useTranslation';
import {
  useDocumentsQuery,
  useDocumentDetailQuery,
  useUpdateDocumentMutation,
  useWorkspacesQuery,
} from '../../../hooks/queries';
import { documentService } from '../../../services';
import type { Document, Workspace } from '../../../types';

const RichTextEditor = lazy(() => import('../../../components/editor/RichTextEditor'));

export default function DocEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const returnPath = (location.state as { from?: string } | undefined)?.from || (id ? `/documents/${id}` : '/documents');
  
  const updateDocumentMutation = useUpdateDocumentMutation();
  const { data: workspacesRaw } = useWorkspacesQuery();
  const { data: docData, isLoading: isDocLoading } = useDocumentDetailQuery(id);

  const workspaces: Workspace[] = useMemo(() => {
    if (Array.isArray(workspacesRaw)) return workspacesRaw as Workspace[];
    if (workspacesRaw && typeof workspacesRaw === 'object') {
      const obj = (workspacesRaw as unknown) as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data as Workspace[];
    }
    return [];
  }, [workspacesRaw]);

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

  const baseDoc = docData || documents.find(d => d._id === id);

  const [docName, setDocName] = useState('');
  const [docContent, setDocContent] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);

  useEffect(() => {
    if (baseDoc) {
      setDocName(baseDoc.name);
      const wsId = baseDoc.workspaceIds && baseDoc.workspaceIds.length > 0 ? baseDoc.workspaceIds[0] : '';
      setSelectedWorkspaceId(wsId);
      if (baseDoc.documentType === 'online') {
        setIsLoadingContent(true);
        documentService.getContent(baseDoc._id)
          .then(content => {
            setDocContent(content || baseDoc.content || '');
          })
          .catch(err => {
            console.error(err);
            if (baseDoc.content) {
              setDocContent(baseDoc.content);
            } else {
              toast.error(t('doc.loadError'));
            }
          })
          .finally(() => setIsLoadingContent(false));
      }
    }
  }, [baseDoc, t]);

  const executeSave = async (titleToSave: string) => {
    if (!id) return;
    setIsSaving(true);
    try {
      await updateDocumentMutation.mutateAsync({
        id,
        data: {
          name: titleToSave,
          content: docContent,
          workspaceIds: selectedWorkspaceId ? [selectedWorkspaceId] : [],
        },
      });
      setDocName(titleToSave);
      toast.success(t('doc.updateSuccess'));
      navigate(returnPath);
    } catch (error) {
      console.error(error);
      toast.error(t('doc.updateError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = docName.trim();
    if (!trimmed || trimmed.toLowerCase() === 'tài liệu không có tiêu đề' || trimmed.toLowerCase() === 'untitled document') {
      setIsNameModalOpen(true);
      return;
    }
    await executeSave(trimmed);
  };

  if (isDocLoading || (isDocsLoading && !baseDoc)) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-60px)] -m-4 sm:-m-6 bg-[#F9FBFD] dark:bg-[#1E1E1E] select-none">
        <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-medium text-xs text-gray-500 animate-pulse">
          {t('docDetail.loadingDoc')}
        </p>
      </div>
    );
  }

  if (!baseDoc) {
    return (
      <div className="max-w-4xl mx-auto text-center py-24">
        <p className="text-sm text-[var(--text-muted)]">
          {t('docDetail.notFound')}
        </p>
        <Button variant="secondary" className="mt-4 cursor-pointer" onClick={() => navigate('/documents')}>
          {t('docDetail.backToList')}
        </Button>
      </div>
    );
  }

  if (baseDoc.documentType === 'upload') {
    return (
      <div className="max-w-4xl mx-auto text-center py-24">
        <p className="text-sm text-[var(--text-muted)]">
          {t('docDetail.uploadNotEditable')}
        </p>
        <Button variant="secondary" className="mt-4 cursor-pointer" onClick={() => navigate(`/documents/${id}`)}>
          {t('docDetail.viewDetail')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] -m-4 sm:-m-6 bg-[#F9FBFD] dark:bg-[#1E1E1E] overflow-hidden select-none">
      {isLoadingContent ? (
        <div className="flex-1 h-full w-full flex flex-col items-center justify-center bg-[#F9FBFD] dark:bg-[#1E1E1E]">
          <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="font-medium text-xs text-gray-500 animate-pulse">
            {t('docDetail.loadingContent')}
          </p>
        </div>
      ) : (
        <Suspense fallback={
          <div className="flex-1 h-full w-full flex flex-col items-center justify-center bg-[#F9FBFD] dark:bg-[#1E1E1E]">
            <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="font-medium text-xs text-gray-500 animate-pulse">
              {t('docDetail.loadingEditor')}
            </p>
          </div>
        }>
          <RichTextEditor
            title={docName}
            onTitleChange={setDocName}
            value={docContent}
            onChange={setDocContent}
            isSaving={isSaving}
            backHref={returnPath}
            placeholder={t('doc.placeholder')}
            className="flex flex-col h-full bg-[#F9FBFD] dark:bg-[#1E1E1E] relative overflow-hidden"
            rightActions={
              <div className="flex items-center gap-2.5">
                <div className="w-52 sm:w-60">
                  <SearchableSelect
                    options={workspaces.map(ws => ({ value: ws._id, label: ws.name }))}
                    value={selectedWorkspaceId}
                    onChange={setSelectedWorkspaceId}
                    placeholder={t('doc.linkWorkspace')}
                  />
                </div>
                <Button
                  onClick={() => handleSave()}
                  disabled={isSaving}
                  className="px-4 py-1.5 h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs shrink-0 cursor-pointer"
                >
                  {isSaving ? t('doc.saving') : t('doc.saveChanges')}
                </Button>
              </div>
            }
          />
        </Suspense>
      )}

      <DocumentNameModal
        isOpen={isNameModalOpen}
        initialValue={docName}
        isSaving={isSaving}
        onClose={() => setIsNameModalOpen(false)}
        onConfirm={async (enteredName) => {
          await executeSave(enteredName);
          setIsNameModalOpen(false);
        }}
        title={t('doc.modalNameRequiredTitle')}
        description={t('doc.modalNameRequiredDesc')}
      />
    </div>
  );
}
