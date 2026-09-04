import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, X, Loader2, FileText } from 'lucide-react';
import { Button } from './Button';

export interface DocumentNameModalProps {
  isOpen: boolean;
  initialValue?: string;
  isSaving?: boolean;
  onClose: () => void;
  onConfirm: (name: string) => Promise<void> | void;
  title?: string;
  description?: string;
}

export function DocumentNameModal({
  isOpen,
  initialValue = '',
  isSaving = false,
  onClose,
  onConfirm,
  title = 'Cảnh báo: Chưa đặt tên tài liệu',
  description = 'Bạn chưa đặt tên cho tài liệu này. Vui lòng nhập tên tài liệu để có thể lưu trữ và quản lý.',
}: DocumentNameModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [internalSaving, setInternalSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const trimmed = initialValue.trim();
      const isDefaultPlaceholder =
        trimmed.toLowerCase() === 'tài liệu không có tiêu đề' ||
        trimmed.toLowerCase() === 'untitled document';
      setName(isDefaultPlaceholder ? '' : trimmed);
      setError('');
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Vui lòng nhập tên tài liệu');
      inputRef.current?.focus();
      return;
    }
    if (
      trimmed.toLowerCase() === 'tài liệu không có tiêu đề' ||
      trimmed.toLowerCase() === 'untitled document'
    ) {
      setError('Vui lòng đặt tên cụ thể thay vì tên mặc định');
      inputRef.current?.focus();
      return;
    }

    setError('');
    setInternalSaving(true);
    try {
      await onConfirm(trimmed);
    } finally {
      setInternalSaving(false);
    }
  };

  const isBusy = isSaving || internalSaving;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-[100] p-4 transition-all duration-200">
      <div className="w-full max-w-md shadow-2xl relative flex flex-col border border-[var(--border-color)] bg-[var(--bg-card)] rounded-2xl transform transition-all scale-100 opacity-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-start gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl border border-amber-500/20 bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                {title}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body / Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Tên tài liệu <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-[var(--text-muted)] pointer-events-none flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      onClose();
                    }
                  }}
                  disabled={isBusy}
                  placeholder="Ví dụ: Kế hoạch triển khai dự án Q4..."
                  className={`w-full pl-9 pr-3.5 py-2.5 bg-[var(--bg-input)] border rounded-xl text-sm transition-all duration-150 focus:outline-none ${
                    error
                      ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/30 text-rose-900 dark:text-rose-200'
                      : 'border-[var(--border-color)] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-[var(--text-primary)] placeholder-[var(--text-muted)]'
                  }`}
                />
              </div>
              {error && (
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-1">
                  {error}
                </p>
              )}
            </div>

            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
              💡 <strong>Lưu ý:</strong> Đặt tên rõ ràng giúp các thành viên và quản trị viên dễ dàng tìm kiếm, gắn thẻ và chia sẻ tài liệu sau này.
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)]/50 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isBusy}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isBusy}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs min-w-[100px]"
            >
              {isBusy && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              {isBusy ? 'Đang lưu...' : 'Lưu tài liệu'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
