/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Edit3, Type, X } from 'lucide-react';
import { Button, SearchableSelect } from '../../../../components/ui';
import { useTranslation } from '../../../../i18n/useTranslation';
import type { Document, Workspace } from '../../../../types';
import { documentService } from '../../../../services';

const RichTextEditor = lazy(() => import('../../../../components/editor/RichTextEditor'));

interface DocEditModalProps {
  isOpen: boolean;
  onClose: (isDirty: boolean) => void;
  onSave: (docName: string, docContent: string, workspaceId: string) => Promise<void>;
  selectedDoc: Document | null;
  workspaces: Workspace[];
}

export function DocEditModal({ isOpen, onClose, onSave, selectedDoc, workspaces }: DocEditModalProps) {
  const [docName, setDocName] = useState('');
  const [initialContent, setInitialContent] = useState('');
  const contentRef = useRef('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const { t, language } = useTranslation();

  const { data: fetchedContent = '', isLoading: isLoadingContent } = useQuery({
    queryKey: ['documents', 'content', selectedDoc?._id],
    queryFn: () => (selectedDoc?._id ? documentService.getContent(selectedDoc._id) : Promise.resolve('')),
    enabled: Boolean(isOpen && selectedDoc && selectedDoc.documentType === 'online'),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (isOpen && selectedDoc) {
      setDocName(selectedDoc.name);
      setSelectedWorkspaceId(selectedDoc.workspaceIds?.[0] || '');
      setIsDirty(false);
      const content = selectedDoc.documentType === 'online' ? fetchedContent : '';
      setInitialContent(content);
      contentRef.current = content;
    }
  }, [isOpen, selectedDoc, fetchedContent]);

  if (!isOpen || !selectedDoc) return null;

  const handleSave = async () => {
    if (!docName.trim()) {
      toast.error(language === 'vi' ? 'Vui lòng nhập tên tài liệu' : 'Please enter document name');
      return;
    }
    setIsSaving(true);
    try {
      await onSave(docName, contentRef.current, selectedWorkspaceId);
      setIsDirty(false);
    } catch {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  const isOnline = selectedDoc.documentType === 'online';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className={`w-full ${isOnline ? 'max-w-5xl' : 'max-w-4xl'} shadow-2xl relative flex flex-col max-h-[95vh] border border-[var(--border-color)] bg-[var(--bg-card)] rounded-2xl transform transition-all`}>
        
        {/* Header */}
        <div className="p-5 rounded-t-2xl border-b border-[var(--border-color)] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
              <Edit3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">
                {language === 'vi' ? 'Chỉnh sửa Tài liệu' : 'Edit Document'}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                {isOnline 
                  ? (language === 'vi' ? 'Cập nhật nội dung tài liệu trực tuyến' : 'Update online document content') 
                  : (language === 'vi' ? 'Đổi tên tài liệu đã tải lên' : 'Rename uploaded document')}
              </p>
            </div>
          </div>
          <button 
            onClick={() => onClose(isDirty)}
            className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] transition-colors border border-[var(--border-color)]"
            title="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 flex flex-col space-y-4 bg-[var(--bg-primary)]">
          <div className="grid grid-cols-1 gap-4">
            {/* Input Name & Workspace */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <Type className="w-4 h-4 text-amber-500" /> {language === 'vi' ? 'Tên tài liệu' : 'Document Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={language === 'vi' ? 'Nhập tên tài liệu...' : 'Enter document name...'}
                  value={docName}
                  onChange={(e) => { setDocName(e.target.value); setIsDirty(true); }}
                  className={`w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 bg-[var(--bg-tertiary)] hover:bg-[var(--input-bg)] text-[var(--text-primary)] transition-all shadow-sm`}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  {language === 'vi' ? 'Workspace liên kết' : 'Linked Workspace'}
                </label>
                <SearchableSelect
                  options={workspaces.map(w => ({ value: w._id, label: w.name }))}
                  value={selectedWorkspaceId}
                  onChange={(val) => { setSelectedWorkspaceId(val); setIsDirty(true); }}
                  placeholder={language === 'vi' ? 'Chọn workspace...' : 'Select workspace...'}
                  className="w-full h-[46px]"
                />
              </div>
            </div>
            
            {/* File Info for Uploaded Documents */}
            {!isOnline && (
              <div className="bg-amber-50/50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-100 dark:border-amber-900/30 space-y-3">
                <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-400 border-b border-amber-200/50 dark:border-amber-800/50 pb-2 mb-3">
                  {language === 'vi' ? 'Thông tin tập tin' : 'File Information'}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[var(--text-secondary)] mb-1">{language === 'vi' ? 'Tên gốc:' : 'Original Name:'}</p>
                    <p className="font-medium text-[var(--text-primary)] truncate" title={selectedDoc.originalName}>{selectedDoc.originalName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-secondary)] mb-1">{language === 'vi' ? 'Định dạng:' : 'Format:'}</p>
                    <p className="font-medium text-[var(--text-primary)] uppercase">{selectedDoc.extension ? selectedDoc.extension.replace('.', '') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-secondary)] mb-1">{language === 'vi' ? 'Kích thước:' : 'Size:'}</p>
                    <p className="font-medium text-[var(--text-primary)]">
                      {selectedDoc.size ? (selectedDoc.size < 1024 * 1024 ? (selectedDoc.size / 1024).toFixed(1) + ' KB' : (selectedDoc.size / 1024 / 1024).toFixed(2) + ' MB') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--text-secondary)] mb-1">{language === 'vi' ? 'Ngày tải lên:' : 'Uploaded Date:'}</p>
                    <p className="font-medium text-[var(--text-primary)]">
                      {selectedDoc.createdAt ? new Date(selectedDoc.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US') : '-'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Editor Area */}
          {isOnline && (
            <div className="flex-1 min-h-[450px] border border-[var(--border-color)] rounded-xl overflow-hidden flex flex-col bg-white dark:bg-gray-900 relative shadow-inner">
              {isLoadingContent ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-secondary)] bg-[var(--bg-tertiary)] z-10">
                  <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="font-medium animate-pulse">
                    {language === 'vi' ? 'Đang tải nội dung tài liệu...' : 'Loading document content...'}
                  </p>
                </div>
              ) : (
                <Suspense fallback={
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-secondary)] bg-[var(--bg-tertiary)]">
                    <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="font-medium animate-pulse">
                      {language === 'vi' ? 'Đang tải công cụ soạn thảo...' : 'Loading editor tools...'}
                    </p>
                  </div>
                }>
                  <RichTextEditor
                    value={initialContent}
                    onChange={(html) => { 
                      contentRef.current = html; 
                      setIsDirty(true); 
                    }}
                    placeholder={language === 'vi' ? 'Bắt đầu soạn thảo nội dung tài liệu của bạn ở đây...' : 'Start drafting your document content here...'}
                  />
                </Suspense>
              )}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-[var(--border-color)] flex justify-end gap-3 rounded-b-2xl">
          <Button type="button" variant="secondary" onClick={() => onClose(isDirty)} className="px-6 rounded-xl">
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving} className="px-8 rounded-xl shadow-md hover:shadow-lg transition-shadow bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 border-none text-white">
            {isSaving ? (language === 'vi' ? 'Đang lưu...' : 'Saving...') : t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
