/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { Button, SearchableSelect } from '../../../../components/ui';
import { FolderPlus, X, Columns, Repeat, Check } from 'lucide-react';
import { useTranslation } from '../../../../i18n/useTranslation';
import type { Workspace, User } from '../../../../types';

const SAMPLE_AVATARS = [
  "https://res.cloudinary.com/sdlcplatform/image/upload/sdlc-platform/sample%20avater%20workspace/viewavatar-1.png",
  "https://res.cloudinary.com/sdlcplatform/image/upload/sdlc-platform/sample%20avater%20workspace/viewavatar-2.png",
  "https://res.cloudinary.com/sdlcplatform/image/upload/sdlc-platform/sample%20avater%20workspace/viewavatar-3.png",
  "https://res.cloudinary.com/sdlcplatform/image/upload/sdlc-platform/sample%20avater%20workspace/viewavatar-4.png",
  "https://res.cloudinary.com/sdlcplatform/image/upload/sdlc-platform/sample%20avater%20workspace/viewavatar-5.png",
  "https://res.cloudinary.com/sdlcplatform/image/upload/sdlc-platform/sample%20avater%20workspace/viewavatar-6.png",
  "https://res.cloudinary.com/sdlcplatform/image/upload/sdlc-platform/sample%20avater%20workspace/viewavatar-7.png",
  "https://res.cloudinary.com/sdlcplatform/image/upload/sdlc-platform/sample%20avater%20workspace/viewavatar-8.png",
  "https://res.cloudinary.com/sdlcplatform/image/upload/sdlc-platform/sample%20avater%20workspace/viewavatar-9.png",
  "https://res.cloudinary.com/sdlcplatform/image/upload/sdlc-platform/sample%20avater%20workspace/viewavatar-10.png",
];

interface WorkspaceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWorkspace?: Workspace | null;
  users?: User[];
  onSave: (id: string | null, data: { name: string; key: string; description: string; ownerId?: string; type?: string; avatar?: string }) => Promise<void>;
}

export function WorkspaceFormModal({ isOpen, onClose, selectedWorkspace, users = [], onSave }: WorkspaceFormModalProps) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [template, setTemplate] = useState('kanban');
  const [avatar, setAvatar] = useState(SAMPLE_AVATARS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const { t, language } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      if (selectedWorkspace) {
        setName(selectedWorkspace.name);
        setKey(selectedWorkspace.key);
        setDescription(selectedWorkspace.description || '');
        const owner = selectedWorkspace.ownerId;
        const ownerStr = typeof owner === 'object' && owner !== null ? (owner as { _id?: string; id?: string })._id || (owner as { _id?: string; id?: string }).id : owner;
        setOwnerId((ownerStr as string) || '');
        setTemplate(selectedWorkspace.template || 'kanban');
        setAvatar(selectedWorkspace.avatar || SAMPLE_AVATARS[0]);
      } else {
        setName('');
        setKey('');
        setDescription('');
        setOwnerId('');
        setTemplate('kanban');
        setAvatar(SAMPLE_AVATARS[0]);
      }
      setFormError('');
    }
  }, [isOpen, selectedWorkspace]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim() || !key.trim()) {
      setFormError(language === 'vi' ? 'Vui lòng nhập đầy đủ Tên và Key' : 'Please input both Name and Key');
      return;
    }
    setFormError('');
    setIsSaving(true);
    try {
      await onSave(selectedWorkspace ? selectedWorkspace._id : null, { name, key, description, ownerId, type: template, avatar });
      onClose();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }, message?: string };
      console.error('Failed to save workspace:', err);
      toast.error(err.response?.data?.message || err.message || (language === 'vi' ? 'Lưu workspace thất bại' : 'Failed to save workspace'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[95vh] border border-[var(--border-color)] bg-[var(--card-bg)] rounded-2xl transform transition-all">
        
        {/* Premium Header */}
        <div className="p-5 rounded-t-2xl border-b border-[var(--border-color)] flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-sm">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">
                {selectedWorkspace 
                  ? (language === 'vi' ? 'Chỉnh sửa Workspace' : 'Edit Workspace') 
                  : (language === 'vi' ? 'Tạo Workspace mới' : 'Create New Workspace')}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] transition-colors border border-[var(--border-color)]"
            title="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400"></span> {formError}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                {language === 'vi' ? 'Tên Workspace' : 'Workspace Name'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={language === 'vi' ? 'Ví dụ: Engineering Team' : 'e.g. Engineering Team'}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!selectedWorkspace) {
                    setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").substring(0, 5));
                  }
                }}
                className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-[var(--bg-tertiary)] hover:bg-[var(--input-bg)] text-[var(--text-primary)] transition-all shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                {language === 'vi' ? 'Key (Mã)' : 'Key (Code)'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={language === 'vi' ? 'Ví dụ: ENG' : 'e.g. ENG'}
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-[var(--bg-tertiary)] hover:bg-[var(--input-bg)] text-[var(--text-primary)] font-mono transition-all shadow-sm"
                maxLength={10}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                {t('table.description')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-[var(--bg-tertiary)] hover:bg-[var(--input-bg)] text-[var(--text-primary)] transition-all shadow-sm resize-none"
                placeholder={language === 'vi' ? 'Mô tả ngắn gọn về workspace này...' : 'Brief description about this workspace...'}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                {language === 'vi' ? 'Chủ sở hữu (Dành riêng cho Admin)' : 'Owner (Admin only)'}
              </label>
              <div className="rounded-xl shadow-sm relative">
                <SearchableSelect
                  options={users.map(u => ({ value: (u.id || (u as { _id?: string })._id || '') as string, label: u.fullName || u.email }))}
                  value={ownerId}
                  onChange={setOwnerId}
                  placeholder={language === 'vi' ? 'Chọn chủ sở hữu...' : 'Select owner...'}
                />
              </div>
            </div>
          </div>

          <hr className="border-[var(--border-color)]" />

          {/* Avatar Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)]">
                {language === 'vi' ? 'Ảnh đại diện (Avatar)' : 'Avatar'}
              </label>
              <p className="text-xs text-[var(--text-secondary)]">
                {language === 'vi' ? 'Thư viện ảnh mẫu' : 'Sample library'}
              </p>
            </div>
            
            <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
              {SAMPLE_AVATARS.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAvatar(url)}
                  className={`relative aspect-square overflow-hidden rounded-[8px] border transition-all ${
                    avatar === url
                      ? "border-primary-600 ring-2 ring-primary-600/25"
                      : "border-[var(--border-color)] hover:border-primary-500/40"
                  }`}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  {avatar === url && (
                    <span className="absolute right-0.5 top-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-[var(--border-color)]" />

          {/* Template Section */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-[var(--text-primary)]">
              {language === 'vi' ? 'Chọn loại (template) *' : 'Select type (template) *'}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTemplate("kanban")}
                className={`p-4 border-2 rounded-xl text-left transition-all relative ${
                  template === "kanban" 
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10" 
                    : "border-[var(--border-color)] hover:border-primary-300"
                }`}
              >
                {template === "kanban" && <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-primary-600 border-4 border-primary-100 dark:border-primary-900" />}
                <Columns className={`w-8 h-8 mb-3 ${template === "kanban" ? "text-primary-600" : "text-[var(--text-muted)]"}`} />
                <h3 className="font-bold text-[var(--text-primary)] mb-1">Kanban</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {language === 'vi' ? 'Tập trung vào luồng công việc liên tục. Phù hợp cho hỗ trợ, vận hành.' : 'Focus on continuous workflow. Suitable for support and operations.'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTemplate("scrum")}
                className={`p-4 border-2 rounded-xl text-left transition-all relative ${
                  template === "scrum" 
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10" 
                    : "border-[var(--border-color)] hover:border-primary-300"
                }`}
              >
                {template === "scrum" && <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-primary-600 border-4 border-primary-100 dark:border-primary-900" />}
                <Repeat className={`w-8 h-8 mb-3 ${template === "scrum" ? "text-primary-600" : "text-[var(--text-muted)]"}`} />
                <h3 className="font-bold text-[var(--text-primary)] mb-1">Scrum</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {language === 'vi' ? 'Làm việc theo sprint định kỳ với backlog. Phù hợp cho phát triển phần mềm.' : 'Work in periodic sprints with a backlog. Suitable for software development.'}
                </p>
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-[var(--border-color)] rounded-b-2xl flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="rounded-xl px-6 font-semibold">
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving} className="rounded-xl px-6 font-semibold bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-sm hover:shadow-md transition-all">
            {isSaving ? (language === 'vi' ? 'Đang lưu...' : 'Saving...') : (selectedWorkspace ? t('common.save') : (language === 'vi' ? 'Tạo mới Workspace' : 'Create Workspace'))}
          </Button>
        </div>
      </div>
    </div>
  );
}
