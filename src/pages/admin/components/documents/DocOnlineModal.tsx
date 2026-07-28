/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, Suspense, lazy } from 'react';
import toast from 'react-hot-toast';
import { FileText, Type, FolderOpen } from 'lucide-react';
import { Button, SearchableSelect } from '../../../../components/ui';
import { useTranslation } from '../../../../i18n/useTranslation';
import type { Workspace } from '../../../../types';

const RichTextEditor = lazy(() => import('../../../../components/editor/RichTextEditor'));

interface DocOnlineModalProps {
  isOpen: boolean;
  onClose: (isDirty: boolean) => void;
  onSave: (docName: string, docContent: string, workspaceId: string) => Promise<void>;
  workspaces: Workspace[];
}

export function DocOnlineModal({ isOpen, onClose, onSave, workspaces }: DocOnlineModalProps) {
  const [docName, setDocName] = useState('');
  const [docContent, setDocContent] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const { t, language } = useTranslation();

  useEffect(() => {
    if (!isOpen) {
      setDocName('');
      setDocContent('');
      setSelectedWorkspaceId('');
      setIsSaving(false);
      setIsDirty(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!docName.trim()) {
      toast.error(language === 'vi' ? 'Vui lòng nhập tên tài liệu' : 'Please enter document name');
      return;
    }
    setIsSaving(true);
    try {
      await onSave(docName, docContent, selectedWorkspaceId);
      setDocName('');
      setDocContent('');
      setSelectedWorkspaceId('');
      setIsDirty(false);
    } catch {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="w-full max-w-5xl shadow-2xl relative flex flex-col max-h-[95vh] border border-[var(--border-color)] bg-[var(--bg-card)] rounded-2xl">
        
        {/* Header */}
        <div className="p-5 rounded-t-2xl border-b border-[var(--border-color)] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">
                {language === 'vi' ? 'Tạo Tài liệu Online' : 'Create Online Document'}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                {language === 'vi' ? 'Soạn thảo trực tiếp trên nền tảng với đầy đủ công cụ' : 'Write and edit online directly with rich tools'}
              </p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => onClose(isDirty)} className="rounded-xl">
            {language === 'vi' ? 'Đóng' : 'Close'}
          </Button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 flex flex-col space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Input Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <Type className="w-4 h-4 text-primary-500" /> {language === 'vi' ? 'Tên tài liệu' : 'Document Name'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder={language === 'vi' ? 'Nhập tên tài liệu...' : 'Enter document name...'}
                value={docName}
                onChange={(e) => { setDocName(e.target.value); setIsDirty(true); }}
                className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-[var(--bg-tertiary)] hover:bg-[var(--input-bg)] text-[var(--text-primary)] transition-all shadow-sm"
              />
            </div>

            {/* Input Workspace */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <FolderOpen className="w-4 h-4 text-primary-500" /> {language === 'vi' ? 'Workspace liên kết' : 'Linked Workspace'} <span className="text-[var(--text-muted)] font-normal">({language === 'vi' ? 'Tùy chọn' : 'Optional'})</span>
              </label>
              <div className="rounded-xl shadow-sm relative">
                <SearchableSelect
                  options={workspaces.map(ws => ({ value: ws._id, label: ws.name }))}
                  value={selectedWorkspaceId}
                  onChange={(val) => { setSelectedWorkspaceId(val); setIsDirty(true); }}
                  placeholder={language === 'vi' ? 'Chọn Workspace...' : 'Select Workspace...'}
                />
              </div>
            </div>
          </div>
          
          {/* Editor Area */}
          <div className="flex-1 min-h-[450px] border border-[var(--border-color)] rounded-xl overflow-hidden flex flex-col bg-white dark:bg-gray-900 relative shadow-inner">
            <Suspense fallback={
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-secondary)] bg-[var(--bg-tertiary)]">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-medium animate-pulse">
                  {language === 'vi' ? 'Đang tải công cụ soạn thảo...' : 'Loading editor tools...'}
                </p>
              </div>
            }>
              <RichTextEditor
                value={docContent}
                onChange={(html) => { setDocContent(html); setIsDirty(true); }}
                placeholder={language === 'vi' ? 'Bắt đầu soạn thảo nội dung tài liệu của bạn ở đây...' : 'Start drafting your document content here...'}
              />
            </Suspense>
          </div>
        </div>

        <div className="p-5 border-t border-[var(--border-color)] flex justify-end gap-3 rounded-b-2xl">
          <Button type="button" variant="secondary" onClick={() => onClose(isDirty)} className="px-6 rounded-xl">
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving} className="px-8 rounded-xl shadow-md hover:shadow-lg transition-shadow bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600">
            {isSaving ? (language === 'vi' ? 'Đang khởi tạo...' : 'Creating...') : (language === 'vi' ? 'Tạo tài liệu' : 'Create Document')}
          </Button>
        </div>
      </div>
    </div>
  );
}