import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, PageHeader } from '../../../components/ui';
import { useImportUsersCsvMutation } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';

interface ImportResult {
  success: boolean;
  insertedCount: number;
  skippedCount: number;
  errors: string[];
  message?: string;
}

export default function UserImportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useTranslation();
  const importCsvMutation = useImportUsersCsvMutation();

  const returnPath = (location.state as { from?: string } | undefined)?.from || '/users';

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error(language === 'vi' ? 'Chỉ hỗ trợ file .csv' : 'Only .csv files are supported');
      return;
    }
    setSelectedFile(file);
    setImportResult(null);
    setImportError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setIsImporting(true);
    setImportError(null);
    setImportResult(null);
    try {
      const result = await importCsvMutation.mutateAsync(selectedFile) as ImportResult;
      setImportResult({
        ...result,
        message: language === 'vi'
          ? `Import thành công. Đã tạo ${result.insertedCount} tài khoản, bỏ qua ${result.skippedCount} tài khoản.`
          : `Import successful. Created ${result.insertedCount} accounts, skipped ${result.skippedCount}.`,
      });
      setSelectedFile(null);
      toast.success(language === 'vi' ? 'Import CSV thành công' : 'CSV imported successfully');
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      setImportError(err.response?.data?.message || err.message || (language === 'vi' ? 'Lỗi khi import file CSV' : 'Error importing CSV file'));
      toast.error(language === 'vi' ? 'Import CSV thất bại' : 'CSV import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="w-full">
      <PageHeader
        breadcrumbs={[
          { label: language === 'vi' ? 'Quản lý User' : 'User Management', href: '/users' },
          { label: 'Import CSV' },
        ]}
        title="Import Users từ CSV"
        subtitle={
          language === 'vi'
            ? 'Nhập hàng loạt tài khoản người dùng từ file CSV'
            : 'Bulk import user accounts from a CSV file'
        }
      
        actions={
          <Button variant="secondary" onClick={() => navigate(returnPath)} className="px-4">
            {language === 'vi' ? 'Quay lại' : 'Go Back'}
          </Button>
        }
      />

      <div className="space-y-4">
        {/* Instructions Card */}
        <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-4">
          <h4 className="text-sm font-bold text-sky-600 dark:text-sky-400 mb-2">
            {language === 'vi' ? '📋 Định dạng CSV yêu cầu' : '📋 Required CSV Format'}
          </h4>
          <p className="text-xs text-[var(--text-secondary)] mb-2">
            {language === 'vi'
              ? 'File CSV phải có các cột theo thứ tự:'
              : 'The CSV file must have columns in this order:'}
          </p>
          <code className="block text-xs bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-3 py-2 font-mono-code text-[var(--text-primary)]">
            email, password, fullName, role, status
          </code>
          <p className="text-xs text-[var(--text-muted)] mt-2">
            {language === 'vi'
              ? '• role: user | super_admin  •  status: active | inactive | pending_verification | suspended'
              : '• role: user | super_admin  •  status: active | inactive | pending_verification | suspended'}
          </p>
        </div>

        {/* Upload Area Card */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[var(--border-color)] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-500">
              <Upload className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {language === 'vi' ? 'Chọn file CSV' : 'Select CSV File'}
            </h3>
          </div>

          <div className="p-6 space-y-4">
            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all ${
                isDragging
                  ? 'border-sky-500 bg-sky-500/5'
                  : 'border-[var(--border-color)] hover:border-sky-400 hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isImporting}
              />
              <div className="w-12 h-12 rounded-full bg-sky-500/10 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6 text-sky-500" />
              </div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {language === 'vi' ? 'Click hoặc kéo thả file vào đây' : 'Click or drag & drop file here'}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {language === 'vi' ? 'Chỉ hỗ trợ file .csv' : 'Only .csv files supported'}
              </p>
            </div>

            {/* Selected File Preview */}
            {selectedFile && (
              <div className="flex items-center gap-3 p-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{selectedFile.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{formatFileSize(selectedFile.size)}</p>
                </div>
                <button
                  onClick={() => { setSelectedFile(null); setImportResult(null); setImportError(null); }}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Result */}
            {importResult && (
              <div className={`p-4 rounded-xl border text-sm ${
                importResult.success
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <p className="font-semibold">{importResult.message}</p>
                </div>
                <p className="text-xs opacity-80">
                  {language === 'vi' ? 'Đã tạo thành công:' : 'Successfully created:'}{' '}
                  <strong>{importResult.insertedCount}</strong>{' '}
                  {language === 'vi' ? 'tài khoản.' : 'accounts.'}{' '}
                  {language === 'vi' ? 'Đã bỏ qua:' : 'Skipped:'}{' '}
                  <strong>{importResult.skippedCount}</strong>.
                </p>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-red-500/10 max-h-32 overflow-y-auto space-y-1">
                    <p className="text-xs font-semibold">
                      {language === 'vi' ? 'Chi tiết lỗi/bỏ qua:' : 'Error details:'}
                    </p>
                    {importResult.errors.map((err, idx) => (
                      <p key={idx} className="text-xs opacity-70">• {err}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {importError && (
              <div className="flex items-center gap-2 p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{importError}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)]/30 flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate(returnPath)}
              disabled={isImporting}
              className="px-6"
            >
              {language === 'vi' ? 'Hủy' : 'Cancel'}
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
              className="px-6"
            >
              {isImporting
                ? (language === 'vi' ? 'Đang import...' : 'Importing...')
                : (language === 'vi' ? 'Bắt đầu Import' : 'Start Import')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
