/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import toast from 'react-hot-toast';
import { Edit3, Type, X } from 'lucide-react';
import { Button, SearchableSelect } from '../../../../components/ui';
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
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (isOpen && selectedDoc) {
      setDocName(selectedDoc.name);
      setSelectedWorkspaceId(selectedDoc.workspaceIds?.[0] || '');
      setIsDirty(false);

      if (selectedDoc.documentType === 'online') {
        setIsLoadingContent(true);
        documentService.getContent(selectedDoc._id)
          .then(content => {
            if (isMounted) {
              setInitialContent(content);
              contentRef.current = content;
              setIsLoadingContent(false);
            }
          })
          .catch(() => {
            if (isMounted) {
              setInitialContent('');
              contentRef.current = '';
              setIsLoadingContent(false);
              toast.error('Lỗi khi tải nội dung tài liệu');
            }
          });
      } else {
        setInitialContent('');
        contentRef.current = '';
      }
    }
    return () => { isMounted = false; };
  }, [isOpen, selectedDoc]);

  if (!isOpen || !selectedDoc) return null;

  const handleSave = async () => {
    if (!docName.trim()) {
      toast.error('Vui lòng nhập tên tài liệu');
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
      <div className={`w-full ${isOnline ? 'max-w-5xl' : 'max-w-4xl'} shadow-2xl relative flex flex-col max-h-[95vh] border border-[var(--border-color)] bg-[var(--card-bg)] rounded-2xl transform transition-all`}>
        
        {/* Header */}
        <div className="p-5 rounded-t-2xl border-b border-[var(--border-color)] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
              <Edit3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Chỉnh sửa Tài liệu</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                {isOnline ? 'Cập nhật nội dung tài liệu trực tuyến' : 'Đổi tên tài liệu đã tải lên'}
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
                  <Type className="w-4 h-4 text-amber-500" /> Tên tài liệu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Nhập tên tài liệu..."
                  value={docName}
                  onChange={(e) => { setDocName(e.target.value); setIsDirty(true); }}
                  className={`w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 bg-[var(--bg-tertiary)] hover:bg-[var(--input-bg)] text-[var(--text-primary)] transition-all shadow-sm`}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  Workspace liên kết
                </label>
                <SearchableSelect
                  options={workspaces.map(w => ({ value: w._id, label: w.name }))}
                  value={selectedWorkspaceId}
                  onChange={(val) => { setSelectedWorkspaceId(val); setIsDirty(true); }}
                  placeholder="Chọn workspace..."
                  className="w-full h-[46px]"
                />
              </div>
            </div>
            
            {/* File Info for Uploaded Documents */}
            {!isOnline && (
              <div className="bg-amber-50/50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-100 dark:border-amber-900/30 space-y-3">
                <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-400 border-b border-amber-200/50 dark:border-amber-800/50 pb-2 mb-3">Thông tin tập tin</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[var(--text-secondary)] mb-1">Tên gốc:</p>
                    <p className="font-medium text-[var(--text-primary)] truncate" title={selectedDoc.originalName}>{selectedDoc.originalName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-secondary)] mb-1">Định dạng:</p>
                    <p className="font-medium text-[var(--text-primary)] uppercase">{selectedDoc.extension ? selectedDoc.extension.replace('.', '') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-secondary)] mb-1">Kích thước:</p>
                    <p className="font-medium text-[var(--text-primary)]">
                      {selectedDoc.size ? (selectedDoc.size < 1024 * 1024 ? (selectedDoc.size / 1024).toFixed(1) + ' KB' : (selectedDoc.size / 1024 / 1024).toFixed(2) + ' MB') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--text-secondary)] mb-1">Ngày tải lên:</p>
                    <p className="font-medium text-[var(--text-primary)]">
                      {selectedDoc.createdAt ? new Date(selectedDoc.createdAt).toLocaleDateString('vi-VN') : '-'}
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
                  <p className="font-medium animate-pulse">Đang tải nội dung tài liệu...</p>
                </div>
              ) : (
                <Suspense fallback={
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-secondary)] bg-[var(--bg-tertiary)]">
                    <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="font-medium animate-pulse">Đang tải công cụ soạn thảo...</p>
                  </div>
                }>
                  <RichTextEditor
                    value={initialContent}
                    onChange={(html) => { 
                      contentRef.current = html; 
                      setIsDirty(true); 
                    }}
                    placeholder="Bắt đầu soạn thảo nội dung tài liệu của bạn ở đây..."
                  />
                </Suspense>
              )}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-[var(--border-color)] flex justify-end gap-3 rounded-b-2xl">
          <Button type="button" variant="secondary" onClick={() => onClose(isDirty)} className="px-6 rounded-xl">Hủy bỏ</Button>
          <Button type="button" onClick={handleSave} disabled={isSaving} className="px-8 rounded-xl shadow-md hover:shadow-lg transition-shadow bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 border-none text-white">
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>
    </div>
  );
}
