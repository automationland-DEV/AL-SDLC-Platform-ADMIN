import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';
import { Button, Card } from '../../../../components/ui';

interface UserImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<{ success: boolean; insertedCount: number; skippedCount: number; errors: string[] }>;
}

export function UserImportModal({ isOpen, onClose, onImport }: UserImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    insertedCount: number;
    skippedCount: number;
    errors: string[];
    message?: string;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setImportResult(null);
      setImportError(null);
    }
  };

  const handleImportSubmit = async () => {
    if (!selectedFile) return;
    setIsImporting(true);
    setImportError(null);
    setImportResult(null);
    try {
      const res = await onImport(selectedFile);
      setImportResult({
        ...res,
        message: `Import thành công. Đã tạo ${res.insertedCount} tài khoản, bỏ qua ${res.skippedCount} tài khoản.`
      });
      setSelectedFile(null);
      toast.success('Import CSV thành công');
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }, message?: string };
      console.error(err);
      setImportError(err.response?.data?.message || err.message || 'Lỗi khi import file CSV');
      toast.error('Import CSV thất bại');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      setSelectedFile(null);
      setImportResult(null);
      setImportError(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg m-4 !p-6">
        <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">
          Import Users từ CSV
        </h3>

        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Vui lòng chọn file CSV chứa danh sách user. <br />
            <strong>Định dạng yêu cầu:</strong> email, password, fullName, role, status
          </p>

          <div className="border-2 border-dashed border-[var(--border-color)] rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-[var(--bg-tertiary)] transition-colors relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isImporting}
            />
            <Upload className="w-8 h-8 text-[var(--text-muted)] mb-2" />
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {selectedFile ? selectedFile.name : 'Click hoặc kéo thả file vào đây'}
            </p>
            {!selectedFile && (
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Chỉ hỗ trợ file .csv
              </p>
            )}
          </div>

          {importResult && (
            <div className={`p-4 rounded-lg text-sm ${importResult.success ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
              }`}>
              <p className="font-semibold">{importResult.message}</p>
              <p className="mt-1">
                Đã tạo thành công: <strong>{importResult.insertedCount}</strong> tài khoản. <br />
                Đã bỏ qua (đã có tài khoản hoặc lỗi): <strong>{importResult.skippedCount}</strong>.
              </p>
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-2 pt-2 border-t border-red-500/10 max-h-32 overflow-y-auto space-y-1">
                  <p className="text-xs font-semibold">Chi tiết lỗi/bỏ qua:</p>
                  {importResult.errors.map((err, idx) => (
                    <p key={idx} className="text-xs text-red-400">• {err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {importError && (
            <div className="p-3 bg-red-500/10 text-red-500 text-sm rounded-lg border border-red-500/20">
              {importError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={isImporting}
            >
              Hủy
            </Button>
            <Button
              onClick={handleImportSubmit}
              disabled={!selectedFile || isImporting}
            >
              {isImporting ? 'Đang import...' : 'Bắt đầu Import'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
