import { useState, Suspense, lazy } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, SearchableSelect, DocumentNameModal } from '../../../components/ui';
import { useTranslation } from '../../../i18n/useTranslation';
import { useCreateOnlineDocumentMutation, useWorkspacesQuery } from '../../../hooks/queries';
import type { Workspace } from '../../../types';
import { useMemo } from 'react';

const RichTextEditor = lazy(() => import('../../../components/editor/RichTextEditor'));

export default function DocNewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const returnPath = (location.state as { from?: string } | undefined)?.from || '/documents';

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
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);

  const executeSave = async (titleToSave: string) => {
    setIsSaving(true);
    try {
      await createOnlineMutation.mutateAsync({
        name: titleToSave,
        content: docContent,
        workspaceIds: selectedWorkspaceId ? [selectedWorkspaceId] : [],
      });
      setDocName(titleToSave);
      toast.success(t('doc.createSuccess'));
      navigate(returnPath);
    } catch (error) {
      console.error(error);
      toast.error(t('doc.createError'));
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

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] -m-4 sm:-m-6 bg-[#F9FBFD] dark:bg-[#1E1E1E] overflow-hidden select-none">
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
                {isSaving ? t('doc.saving') : t('doc.saveDoc')}
              </Button>
            </div>
          }
        />
      </Suspense>

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
