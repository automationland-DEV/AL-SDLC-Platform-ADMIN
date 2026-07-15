import DOMPurify from 'dompurify';
import { Download, X } from 'lucide-react';
import { Button } from '../../../../components/ui';
import type { Document, Workspace } from '../../../../types';

interface DocViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  onDownload: (doc: Document) => void;
  formatFileSize: (bytes?: number) => string;
  workspaces?: Workspace[];
}

export function DocViewModal({ isOpen, onClose, document: doc, onDownload, formatFileSize, workspaces = [] }: DocViewModalProps) {
  if (!isOpen || !doc) return null;

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const date = d.toLocaleDateString('vi-VN');
    return `${time} ${date}`;
  };

  const getWorkspaceNames = () => {
    if (!doc.workspaceIds || doc.workspaceIds.length === 0) return '-';
    const names = doc.workspaceIds.map(wId => {
      const w = workspaces.find(ws => ws._id === wId);
      return w ? w.name : wId;
    });
    return names.join(', ');
  };

  const creatorName = doc.uploadedBy && typeof doc.uploadedBy === 'object' ? (doc.uploadedBy as { fullName?: string }).fullName : 'Hệ thống';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className={`w-full ${doc.documentType === 'online' ? 'max-w-5xl' : 'max-w-3xl'} shadow-2xl relative flex flex-col max-h-[95vh] bg-white dark:bg-gray-900 rounded-xl transform transition-all`}>
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 pb-2">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Chi tiết tài liệu</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 mb-8">
            <div>
              <p className="text-sm text-gray-500 mb-1">Tên tài liệu</p>
              <p className="font-medium text-[var(--text-primary)] break-words">{doc.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Loại tài liệu</p>
              <p className="font-medium text-[var(--text-primary)]">{doc.documentType === 'online' ? 'Online' : 'Upload'}</p>
            </div>
            
            {(!doc.documentType || doc.documentType === 'upload') ? (
              <>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tên gốc</p>
                  <p className="font-medium text-[var(--text-primary)] break-words">{doc.originalName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Kích thước</p>
                  <p className="font-medium text-[var(--text-primary)]">{doc.size ? formatFileSize(doc.size) : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Định dạng</p>
                  <p className="font-medium text-[var(--text-primary)] break-words uppercase">{doc.extension ? doc.extension.replace('.', '') : '-'}</p>
                </div>
              </>
            ) : null}

            <div>
              <p className="text-sm text-gray-500 mb-1">Ngày tạo</p>
              <p className="font-medium text-[var(--text-primary)]">{doc.createdAt ? formatDate(doc.createdAt) : '-'}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Người tạo</p>
              <p className="font-medium text-[var(--text-primary)]">{creatorName}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Workspace liên kết</p>
              <p className="font-medium text-[var(--text-primary)] break-words">{getWorkspaceNames()}</p>
            </div>
          </div>

          {doc.documentType === 'online' && (
            <div className="mt-4 border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-500 mb-4">Nội dung</p>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 min-h-[300px]">
                <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(doc.content || '') }} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 rounded-b-xl">
          <Button variant="secondary" onClick={onClose} className="px-6 rounded-lg font-medium">
            Đóng
          </Button>
          <Button onClick={() => onDownload(doc)} className="flex items-center gap-2 px-6 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm">
            <Download size={18} /> Tải xuống
          </Button>
        </div>

      </div>
    </div>
  );
}
