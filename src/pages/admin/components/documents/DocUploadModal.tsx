/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Upload, File, X, UploadCloud } from 'lucide-react';
import { Button, SearchableSelect } from '../../../../components/ui';
import type { Workspace } from '../../../../types';

interface DocUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, docName: string, workspaceId: string) => Promise<void>;
  workspaces: Workspace[];
}

export function DocUploadModal({ isOpen, onClose, onUpload, workspaces }: DocUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setDocName('');
      setSelectedWorkspaceId('');
      setIsSaving(false);
      setIsDragging(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Vui lòng chọn file cần upload');
      return;
    }
    setIsSaving(true);
    try {
      await onUpload(selectedFile, docName, selectedWorkspaceId);
      setSelectedFile(null);
      setDocName('');
      setSelectedWorkspaceId('');
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!docName) {
        const lastDot = file.name.lastIndexOf('.');
        const nameWithoutExt = lastDot > 0 ? file.name.substring(0, lastDot) : file.name;
        setDocName(nameWithoutExt);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="w-full max-w-3xl shadow-2xl relative flex flex-col border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-2xl transform transition-all">
        {/* Header with gradient */}
        <div className="p-6 rounded-t-2xl border-b border-[var(--border-color)] bg-gradient-to-r from-primary-50 to-transparent dark:from-primary-900/20 dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-sm">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Tải lên Tài liệu</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">Thêm tài liệu mới vào hệ thống</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Drag & Drop Area */}
          <div 
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-200 ease-in-out relative
              ${isDragging 
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.02]' 
                : selectedFile 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                  : 'border-[var(--border-color)] hover:border-primary-400 hover:bg-[var(--bg-tertiary)]'
              }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const file = e.target.files[0];
                  setSelectedFile(file);
                  if (!docName) {
                    const lastDot = file.name.lastIndexOf('.');
                    const nameWithoutExt = lastDot > 0 ? file.name.substring(0, lastDot) : file.name;
                    setDocName(nameWithoutExt);
                  }
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isSaving}
            />
            
            {selectedFile ? (
              <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300 w-full min-w-0">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 mb-4 shadow-sm shrink-0">
                  <File className="w-8 h-8" />
                </div>
                <p className="text-base font-semibold text-[var(--text-primary)] px-8 truncate w-full text-center" title={selectedFile.name}>
                  {selectedFile.name}
                </p>
                <p className="text-sm text-[var(--text-secondary)] mt-1 shrink-0">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedFile(null);
                    setDocName('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="mt-4 px-4 py-1.5 rounded-full text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors flex items-center gap-1 z-10 relative cursor-pointer shadow-sm"
                >
                  <X className="w-3 h-3" /> Gỡ bỏ file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-500 mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <p className="text-base font-semibold text-[var(--text-primary)]">
                  Click hoặc kéo thả file vào đây
                </p>
                <p className="text-sm text-[var(--text-secondary)] mt-2">
                  Hỗ trợ Word, Excel, PDF, Hình ảnh...
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Kích thước tối đa 50MB
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-20">
            {/* Display Name Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[var(--text-primary)]">
                Tên hiển thị <span className="text-[var(--text-muted)] font-normal">(Tùy chọn)</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Báo cáo tháng 7..."
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-[var(--bg-tertiary)] hover:bg-[var(--input-bg)] text-[var(--text-primary)] transition-all shadow-sm"
              />
            </div>

            {/* Workspace Select */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[var(--text-primary)]">
                Workspace liên kết <span className="text-[var(--text-muted)] font-normal">(Tùy chọn)</span>
              </label>
            <div className="rounded-xl shadow-sm relative">
              <SearchableSelect
                options={workspaces.map(ws => ({ value: ws._id, label: ws.name }))}
                value={selectedWorkspaceId}
                onChange={setSelectedWorkspaceId}
                placeholder="Chọn Workspace..."
              />
            </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)] flex justify-end gap-3 rounded-b-2xl relative z-10">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving} className="px-6 rounded-xl">
            Hủy
          </Button>
          <Button type="button" onClick={handleUpload} disabled={isSaving || !selectedFile} className="px-8 rounded-xl shadow-md hover:shadow-lg transition-shadow bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600">
            {isSaving ? 'Đang tải lên...' : 'Tải lên ngay'}
          </Button>
        </div>
      </div>
    </div>
  );
}