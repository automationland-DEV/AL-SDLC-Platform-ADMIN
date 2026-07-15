import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../../../../components/ui';
import { ShieldPlus, X } from 'lucide-react';

export interface RoleItem {
  name: string;
  key: string;
  color: string;
  description: string;
}

interface AddRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRole: (role: RoleItem) => void;
  existingRoles: RoleItem[];
}

export function AddRoleModal({ isOpen, onClose, onAddRole, existingRoles }: AddRoleModalProps) {
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleKey, setNewRoleKey] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('blue');

  if (!isOpen) return null;

  const handleAddRole = () => {
    if (!newRoleName.trim() || !newRoleKey.trim()) {
      toast.error('Vui lòng nhập Tên vai trò và Key');
      return;
    }
    const exists = existingRoles.some((r) => r.key === newRoleKey.trim().toLowerCase());
    if (exists) {
      toast.error('Key vai trò này đã tồn tại');
      return;
    }
    const newRole: RoleItem = {
      name: newRoleName,
      key: newRoleKey.trim().toLowerCase(),
      color: newRoleColor,
      description: newRoleDesc,
    };
    onAddRole(newRole);
    setNewRoleName('');
    setNewRoleKey('');
    setNewRoleDesc('');
    setNewRoleColor('blue');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="w-full max-w-lg shadow-2xl relative flex flex-col max-h-[95vh] border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-2xl transform transition-all">
        
        {/* Premium Header */}
        <div className="p-6 rounded-t-2xl border-b border-[var(--border-color)] bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-900/20 dark:to-transparent flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm">
              <ShieldPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">
                Thêm Role mới
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Tạo vai trò mới để phân quyền cho hệ thống.
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

        <div className="p-8 space-y-6 overflow-y-auto flex-1">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              Tên vai trò <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Moderator"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 bg-[var(--bg-tertiary)] hover:bg-[var(--input-bg)] text-[var(--text-primary)] transition-all shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              Key vai trò <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: mod"
              value={newRoleKey}
              onChange={(e) => setNewRoleKey(e.target.value)}
              className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 bg-[var(--bg-tertiary)] hover:bg-[var(--input-bg)] text-[var(--text-primary)] transition-all shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              Màu sắc đại diện
            </label>
            <select
              value={newRoleColor}
              onChange={(e) => setNewRoleColor(e.target.value)}
              className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 bg-[var(--bg-tertiary)] hover:bg-[var(--input-bg)] text-[var(--text-primary)] transition-all shadow-sm"
            >
              <option value="blue">Blue</option>
              <option value="green">Green</option>
              <option value="red">Red</option>
              <option value="orange">Orange</option>
              <option value="purple">Purple</option>
              <option value="gray">Gray</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              Mô tả
            </label>
            <textarea
              placeholder="Mô tả chức năng chính của vai trò này..."
              value={newRoleDesc}
              onChange={(e) => setNewRoleDesc(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 bg-[var(--bg-tertiary)] hover:bg-[var(--input-bg)] text-[var(--text-primary)] transition-all shadow-sm resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)] flex justify-end gap-3 rounded-b-2xl">
          <Button variant="secondary" onClick={onClose} className="rounded-xl px-6 font-semibold">
            Hủy bỏ
          </Button>
          <Button onClick={handleAddRole} className="rounded-xl px-6 font-semibold bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-sm hover:shadow-md transition-all">
            Tạo mới Role
          </Button>
        </div>
      </div>
    </div>
  );
}
