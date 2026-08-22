import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Hash, Megaphone, Lock, Users, Clock, MessageSquare, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, ConfirmModal, PageHeader } from '../../../components/ui';
import { chatChannelService } from '../../../services';
import { useChannelsQuery, useDeleteChannelMutation } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import type { ChatChannel } from '../../../types';
import { useMemo } from 'react';

interface ChannelMember {
  _id?: string;
  id?: string;
  userId?: string;
  avatar?: string;
  fullName?: string;
  email?: string;
  role?: string;
}

export default function ChannelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useTranslation();

  const { data: channelsRaw, isLoading: isChannelsLoading } = useChannelsQuery();
  const channels: ChatChannel[] = useMemo(() => {
    if (Array.isArray(channelsRaw)) return channelsRaw as ChatChannel[];
    if (channelsRaw && typeof channelsRaw === 'object') {
      const obj = channelsRaw as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data as ChatChannel[];
      if (Array.isArray(obj.channels)) return obj.channels as ChatChannel[];
    }
    return [];
  }, [channelsRaw]);

  const channel = channels.find(c => c._id === id);

  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['channels', 'members', id],
    queryFn: () => (id ? chatChannelService.getMembers(id) : Promise.resolve([])),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
  });

  const deleteChannelMutation = useDeleteChannelMutation();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleDelete = () => setIsConfirmOpen(true);

  const confirmDelete = async () => {
    if (!id) return;
    try {
      await deleteChannelMutation.mutateAsync(id);
      toast.success(language === 'vi' ? 'Xóa channel thành công' : 'Channel deleted successfully');
      navigate('/channels');
    } catch (error) {
      console.error(error);
      toast.error(language === 'vi' ? 'Xóa channel thất bại' : 'Failed to delete channel');
    } finally {
      setIsConfirmOpen(false);
    }
  };

  if (isChannelsLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="max-w-4xl mx-auto text-center py-24">
        <Hash className="w-12 h-12 mx-auto text-[var(--text-muted)] stroke-1 mb-3" />
        <p className="text-sm text-[var(--text-muted)]">
          {language === 'vi' ? 'Không tìm thấy channel.' : 'Channel not found.'}
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/channels')}>
          {language === 'vi' ? 'Quay lại danh sách' : 'Back to list'}
        </Button>
      </div>
    );
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'general': return { label: 'General', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' };
      case 'announcement': return { label: 'Announcement', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' };
      case 'workspace': return { label: 'Workspace', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' };
      case 'dm': return { label: 'Direct Message', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' };
      case 'custom': return { label: 'Custom', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' };
      default: return { label: type, color: 'bg-gray-100 text-gray-700' };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement': return <Megaphone className="w-5 h-5" />;
      case 'dm': return <Users className="w-5 h-5" />;
      default: return <Hash className="w-5 h-5" />;
    }
  };

  const getWorkspaceName = () => {
    if (!channel.workspaceId) return null;
    if (typeof channel.workspaceId === 'object') return channel.workspaceId.name || 'Unknown';
    return null;
  };

  const wsName = getWorkspaceName();
  const typeInfo = getTypeLabel(channel.type);

  return (
    <div className="w-full">
      <PageHeader
        breadcrumbs={[
          { label: language === 'vi' ? 'Chat Channels' : 'Chat Channels', href: '/channels' },
          { label: language === 'vi' ? 'Chi tiết' : 'Detail' },
        ]}
        title={channel.name}
        actions={
          <div className="flex items-center gap-2">
            <Link to={`/channels/${id}/chat`}>
              <Button size="sm">
                <MessageSquare className="w-4 h-4" />
                {language === 'vi' ? 'Xem tin nhắn' : 'View chat'}
              </Button>
            </Link>
          </div>
        }
      />

      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
        {/* Header Banner */}
        <div className="relative bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white">
              {getTypeIcon(channel.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-white truncate">{channel.name}</h3>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Channel ID</p>
              <p className="text-sm text-[var(--text-primary)] font-mono">#{channel._id?.slice(-8)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Loại</p>
              <p className="text-sm text-[var(--text-primary)]">{typeInfo.label}</p>
            </div>
            {wsName && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Workspace</p>
                <p className="text-sm text-[var(--text-primary)]">{wsName}</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Riêng tư</p>
              <p className="text-sm text-[var(--text-primary)]">
                {channel.isPrivate ? (
                  <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Có</span>
                ) : (
                  'Không'
                )}
              </p>
            </div>
            {channel.createdAt && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Ngày tạo</p>
                <p className="text-sm text-[var(--text-primary)] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(channel.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
            )}
            {channel.lastMessage && (
              <div className="space-y-1 col-span-2">
                <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Tin nhắn cuối</p>
                <p className="text-sm text-[var(--text-primary)] truncate">
                  {channel.lastMessage.senderName ? `${channel.lastMessage.senderName}: ` : ''}
                  {channel.lastMessage.content || '(media)'}
                </p>
              </div>
            )}
          </div>

          {channel.description && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Mô tả</p>
              <p className="text-sm text-[var(--text-primary)]">{channel.description}</p>
            </div>
          )}

          {/* Members */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              Thành viên 
              {(channel.type === 'general' || channel.type === 'announcement') 
                ? ' (Tất cả người dùng)' 
                : ` (${loadingMembers ? '...' : members.length})`}
            </p>
            {loadingMembers ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent"></div>
              </div>
            ) : (channel.type === 'general' || channel.type === 'announcement') ? (
              <p className="text-sm italic text-[var(--text-muted)] mt-1">
                Kênh này là kênh hệ thống, mặc định bao gồm tất cả người dùng trong hệ thống hoặc không gian làm việc này.
              </p>
            ) : members.length > 0 ? (
              <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                {members.map((m: ChannelMember) => (
                  <div key={m._id || m.id || m.userId} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center flex-shrink-0">
                      {m.avatar ? (
                        <img src={m.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <span className="text-xs font-medium text-primary-600">
                          {(m.fullName || m.email || '?').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{m.fullName || m.email || 'Unknown'}</p>
                      {m.role && (
                        <span className="text-xs text-[var(--text-muted)] capitalize">{m.role.replace('channel_', '')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)] py-2">Không có thành viên</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-color)] flex items-center justify-between">
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
            {language === 'vi' ? 'Xóa Channel' : 'Delete Channel'}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/channels')}>
            {language === 'vi' ? 'Quay lại' : 'Back'}
          </Button>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title={language === 'vi' ? 'Xóa Channel' : 'Delete Channel'}
        message={language === 'vi' ? 'Bạn có chắc chắn muốn xóa kênh này? Tất cả tin nhắn trong kênh sẽ bị mất.' : 'Are you sure you want to delete this channel? All messages will be lost.'}
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
