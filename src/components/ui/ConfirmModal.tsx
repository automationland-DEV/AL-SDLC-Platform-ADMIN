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
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-orange-500" />;
      case 'info':
        return <Info className="w-8 h-8 text-blue-500" />;
    }
  };

  const getHeaderColors = () => {
    switch (type) {
      case 'danger':
        return 'from-red-50 to-transparent dark:from-red-900/20';
      case 'warning':
        return 'from-orange-50 to-transparent dark:from-orange-900/20';
      case 'info':
        return 'from-blue-50 to-transparent dark:from-blue-900/20';
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-100 dark:bg-red-900/50';
      case 'warning':
        return 'bg-orange-100 dark:bg-orange-900/50';
      case 'info':
        return 'bg-blue-100 dark:bg-blue-900/50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-all duration-300">
      <div className="w-full max-w-md shadow-2xl relative flex flex-col border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-2xl transform transition-all scale-100 opacity-100">
        
        {/* Header */}
        <div className={`p-6 rounded-t-2xl border-b border-[var(--border-color)] bg-gradient-to-r ${getHeaderColors()} to-transparent flex justify-between items-start`}>
          <div className="flex gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm shrink-0 ${getIconBg()}`}>
              {getIcon()}
            </div>
            <div className="pt-1">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">
                {title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
          <button 
            onClick={onCancel}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors absolute top-4 right-4"
          >
            <X size={20} />
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)] flex justify-end gap-3 rounded-b-2xl">
          <Button variant="secondary" onClick={onCancel} disabled={isConfirming} className="px-6 rounded-xl bg-white dark:bg-gray-800">
            Hủy
          </Button>
          <Button
            variant={type === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            disabled={isConfirming}
            className="px-6 rounded-xl shadow-sm flex items-center gap-2"
          >
            {isConfirming && <Loader2 className="w-4 h-4 animate-spin" />}
            {isConfirming ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>
        </div>
      </div>
    </div>
  );
}
