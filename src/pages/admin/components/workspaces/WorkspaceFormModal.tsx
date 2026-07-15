/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../../../../components/ui';
import { FolderPlus, X } from 'lucide-react';
import type { Workspace } from '../../../../types';

interface WorkspaceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWorkspace: Workspace | null;
  onSave: (id: string | null, data: { name: string; key: string; description: string }) => Promise<void>;
}

export function WorkspaceFormModal({ isOpen, onClose, selectedWorkspace, onSave }: WorkspaceFormModalProps) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (selectedWorkspace) {
        setName(selectedWorkspace.name);
        setKey(selectedWorkspace.key);
        setDescription(selectedWorkspace.description || '');
      } else {
        setName('');
        setKey('');
        setDescription('');
      }
      setFormError('');
    }
  }, [isOpen, selectedWorkspace]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim() || !key.trim()) {
      setFormError('Vui lòng nhập đầy đủ Tên và Key');
      return;
    }
    setFormError('');
    setIsSaving(true);
    try {
      await onSave(selectedWorkspace ? selectedWorkspace._id : null, { name, key, description });
      onClose();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }, message?: string };
      console.error('Failed to save workspace:', err);
      toast.error(err.response?.data?.message || err.message || 'Lưu workspace thất bại');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[95vh] border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-2xl transform transition-all">
        
        {/* Premium Header */}
        <div className="p-6 rounded-t-2xl border-b border-[var(--border-color)] bg-gradient-to-r from-indigo-50 to-transparent dark:from-indigo-900/20 dark:to-transparent flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
              <FolderPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">
                {selectedWorkspace ? 'Chỉnh sửa Workspace' : 'Tạo Workspace mới'}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {selectedWorkspace ? 'Cập nhật thông tin của không gian làm việc.' : 'Điền thông tin bên dưới để tạo không gian làm việc mới.'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] transition-colors border border-[var(--border-color)]"
            title="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                Tên Workspace <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Nhập tên workspace..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 bg-[var(--bg-tertiary)] hover:bg-[var(--input-bg)] text-[var(--text-primary)] transition-all shadow-sm"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                Key (Mã) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: WS01..."
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 bg-[var(--bg-tertiary)] hover:bg-[var(--input-bg)] text-[var(--text-primary)] transition-all shadow-sm"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                Mô tả
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 bg-[var(--bg-tertiary)] hover:bg-[var(--input-bg)] text-[var(--text-primary)] transition-all shadow-sm resize-none"
                placeholder="Mô tả ngắn gọn về workspace này..."
              />
            </div>

            {formError && (
              <div className="md:col-span-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400"></span> {formError}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)] flex justify-end gap-3 rounded-b-2xl">
          <Button type="button" variant="secondary" onClick={onClose} className="rounded-xl px-6 font-semibold">
            Hủy bỏ
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving} className="rounded-xl px-6 font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-sm hover:shadow-md transition-all">
            {isSaving ? 'Đang lưu...' : (selectedWorkspace ? 'Lưu thay đổi' : 'Tạo mới')}
          </Button>
        </div>
      </div>
    </div>
  );
}
