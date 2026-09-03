import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Upload, File, X, UploadCloud } from 'lucide-react';
import { Button, SearchableSelect, PageHeader } from '../../../components/ui';
import { useTranslation } from '../../../i18n/useTranslation';
import { useUploadDocumentMutation, useWorkspacesQuery } from '../../../hooks/queries';
import type { Workspace } from '../../../types';
import { useMemo } from 'react';

export default function DocUploadPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useTranslation();

  const returnPath = (location.state as { from?: string } | undefined)?.from || '/documents';
  
  const uploadMutation = useUploadDocumentMutation();
  const { data: workspacesRaw } = useWorkspacesQuery();

  const workspaces: Workspace[] = useMemo(() => {
    if (Array.isArray(workspacesRaw)) return workspacesRaw as Workspace[];
    if (workspacesRaw && typeof workspacesRaw === 'object') {
      const obj = (workspacesRaw as unknown) as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data as Workspace[];
    }
    return [];
  }, [workspacesRaw]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error(language === 'vi' ? 'Vui lòng chọn file cần upload' : 'Please select a file to upload');
      return;
    }
    setIsSaving(true);
    try {
      await uploadMutation.mutateAsync({
        file: selectedFile,
        name: docName,
        workspaceIds: selectedWorkspaceId ? [selectedWorkspaceId] : [],
      });
      toast.success(language === 'vi' ? 'Upload file thành công' : 'File uploaded successfully');
      navigate(returnPath);
    } catch (error) {
      console.error(error);
      toast.error(language === 'vi' ? 'Lỗi khi upload file' : 'Error uploading file');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!docName) {
        const lastDot = file.name.lastIndexOf('.');
        setDocName(lastDot > 0 ? file.name.substring(0, lastDot) : file.name);
      }
    }
  };

  return (
    <div className="w-full">
      <PageHeader
        breadcrumbs={[
          { label: language === 'vi' ? 'Tài liệu' : 'Documents', href: '/documents' },
          { label: language === 'vi' ? 'Tải lên' : 'Upload' },
        ]}
        title={language === 'vi' ? 'Tải lên Tài liệu' : 'Upload Document'}
        subtitle={language === 'vi' ? 'Thêm tài liệu mới vào hệ thống' : 'Add new documents to system'}
      
        actions={
          <Button variant="secondary" onClick={() => navigate(returnPath)} className="px-4">
            {language === 'vi' ? 'Quay lại' : 'Go Back'}
          </Button>
        }
      />

      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[var(--border-color)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <Upload className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            {language === 'vi' ? 'Chọn file tải lên' : 'Select file to upload'}
          </h3>
        </div>

        <div className="p-6 space-y-6">
          <div 
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-200 relative
              ${isDragging 
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                : selectedFile 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                  : 'border-[var(--border-color)] hover:border-primary-400 hover:bg-[var(--bg-tertiary)]'
              }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
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
                    setDocName(lastDot > 0 ? file.name.substring(0, lastDot) : file.name);
                  }
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isSaving}
            />
            
            {selectedFile ? (
              <div className="flex flex-col items-center w-full min-w-0">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 mb-4 shadow-sm shrink-0">
                  <File className="w-8 h-8" />
                </div>
                <p className="text-base font-semibold text-[var(--text-primary)] px-8 truncate w-full text-center" title={selectedFile.name}>
                  {selectedFile.name}
                </p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
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
                  className="mt-4 px-4 py-1.5 rounded-full text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center gap-1 z-10 relative shadow-sm"
                >
                  <X className="w-3 h-3" /> {language === 'vi' ? 'Gỡ bỏ file' : 'Remove file'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-500 mb-4 shadow-sm">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <p className="text-base font-semibold text-[var(--text-primary)]">
                  {language === 'vi' ? 'Click hoặc kéo thả file vào đây' : 'Click or drag & drop file here'}
                </p>
                <p className="text-sm text-[var(--text-secondary)] mt-2">
                  {language === 'vi' ? 'Hỗ trợ Word, Excel, PDF, Hình ảnh...' : 'Supports Word, Excel, PDF, Images...'}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-20">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-[var(--text-primary)]">
                {language === 'vi' ? 'Tên hiển thị' : 'Display Name'} <span className="text-[var(--text-muted)] font-normal">({language === 'vi' ? 'Tùy chọn' : 'Optional'})</span>
              </label>
              <input
                type="text"
                placeholder={language === 'vi' ? 'Ví dụ: Báo cáo tháng 7...' : 'e.g. July Report...'}
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-all text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-[var(--text-primary)]">
                {language === 'vi' ? 'Workspace liên kết' : 'Linked Workspace'} <span className="text-[var(--text-muted)] font-normal">({language === 'vi' ? 'Tùy chọn' : 'Optional'})</span>
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
        </div>

        <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)]/30 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(returnPath)} className="px-6">
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={handleUpload} disabled={isSaving || !selectedFile} className="px-8 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600">
            {isSaving ? (language === 'vi' ? 'Đang tải lên...' : 'Uploading...') : (language === 'vi' ? 'Tải lên ngay' : 'Upload Now')}
          </Button>
        </div>
      </div>
    </div>
  );
}
