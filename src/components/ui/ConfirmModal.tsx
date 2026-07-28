/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { AlertTriangle, Info, AlertCircle, X, Loader2 } from 'lucide-react';
import { Button } from './Button';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  type = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsConfirming(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertCircle className="w-6 h-6 text-rose-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-500" />;
      case 'info':
        return <Info className="w-6 h-6 text-sky-500" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-500/10 border-rose-500/20';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20';
      case 'info':
        return 'bg-sky-500/10 border-sky-500/20';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 transition-all duration-200">
      <div className="w-full max-w-md shadow-2xl relative flex flex-col border border-[var(--border-color)] bg-[var(--bg-card)] rounded-xl transform transition-all scale-100 opacity-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-color)] flex justify-between items-start gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-11 h-11 rounded-lg border flex items-center justify-center shrink-0 ${getIconBg()}`}>
              {getIcon()}
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight">{title}</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{message}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)]/50 flex justify-end gap-2.5">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={isConfirming}>
            Hủy
          </Button>
          <Button
            variant={type === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={handleConfirm}
            disabled={isConfirming}
          >
            {isConfirming && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isConfirming ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>
        </div>
      </div>
    </div>
  );
}
