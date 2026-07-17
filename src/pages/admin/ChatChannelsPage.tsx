/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { Search, Trash2, Eye, Hash, Megaphone, Lock, Users, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Badge, Table, TableRow, TableCell, SearchableSelect, ConfirmModal } from '../../components/ui';
import { useChatChannelsStore, useWorkspacesStore } from '../../stores';
import ChannelViewModal from './components/channels/ChannelViewModal';
import ChatViewerModal from './components/channels/ChatViewerModal';

export default function ChatChannelsPage() {
  const {
    channels, filteredChannels, isLoading,
    fetchChannels, deleteChannel, setSearch, typeFilter, setTypeFilter, workspaceFilter, setWorkspaceFilter, applyFilters, absoluteTotal,
  } = useChatChannelsStore();

  const { workspaces, fetchWorkspaces } = useWorkspacesStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger',
  });

  useEffect(() => {
    fetchChannels();
    fetchWorkspaces();
  }, [fetchChannels, fetchWorkspaces]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchTerm);
      applyFilters();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, setSearch, applyFilters]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [searchTerm, typeFilter, workspaceFilter]);

  const handleTypeFilterChange = (type: string) => {
    setTypeFilter(type);
    setTimeout(() => applyFilters(), 0);
  };

  const handleWorkspaceFilterChange = (wsId: string) => {
    setWorkspaceFilter(wsId);
    fetchChannels(wsId);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setWorkspaceFilter('all');
    fetchChannels();
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận xóa channel',
      message: 'Bạn có chắc muốn xóa channel này? Tất cả tin nhắn trong channel sẽ bị xóa.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteChannel(id);
          toast.success('Xóa channel thành công');
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } catch (error: any) {
          toast.error(error.response?.data?.message || error.message || 'Xóa channel thất bại');
        }
      },
    });
  };

  const openViewModal = (channel: any) => {
    setSelectedChannel(channel);
    setShowViewModal(true);
  };

  const openChatModal = (channel: any) => {
    setSelectedChannel(channel);
    setShowChatModal(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement': return <Megaphone className="w-4 h-4" />;
      case 'dm': return <Users className="w-4 h-4" />;
      case 'custom': return <Lock className="w-4 h-4" />;
      default: return <Hash className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, { variant: 'default' | 'success' | 'warning' | 'danger' | 'info'; label: string }> = {
      general: { variant: 'info', label: 'General' },
      announcement: { variant: 'warning', label: 'Announcement' },
      workspace: { variant: 'success', label: 'Workspace' },
      dm: { variant: 'default', label: 'DM' },
      custom: { variant: 'info', label: 'Custom' },
    };
    const config = variants[type] || { variant: 'default' as const, label: type };
    return (
      <Badge variant={config.variant}>
        <span className="flex items-center gap-1">
          {getTypeIcon(type)}
          {config.label}
        </span>
      </Badge>
    );
  };

  const getWorkspaceName = (wsId: any) => {
    if (!wsId) return '-';
    if (typeof wsId === 'object') return wsId.name || '-';
    const ws = workspaces.find((w) => w._id === wsId);
    return ws ? ws.name : wsId.slice(-6);
  };

  const displayChannels = filteredChannels || channels;
  const totalPages = Math.ceil(displayChannels.length / itemsPerPage);
  const paginatedChannels = displayChannels.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Quản lý Chat Channels</h2>
          <p className="text-[var(--text-secondary)] mt-1">Tổng cộng {absoluteTotal} channels trong hệ thống</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] px-4 py-2.5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Tìm kiếm channel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--input-bg)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Workspace Filter */}
          <div className="flex-1 min-w-[250px]">
            <SearchableSelect
              value={workspaceFilter}
              onChange={handleWorkspaceFilterChange}
              options={[
                { value: 'all', label: 'Tất cả workspace' },
                ...workspaces.map((ws) => ({ value: ws._id, label: ws.name })),
              ]}
              placeholder="Tất cả workspace"
            />
          </div>

          {/* Type Filter */}
          <div className="flex-1 min-w-[200px]">
            <SearchableSelect
              value={typeFilter}
              onChange={handleTypeFilterChange}
              options={[
                { value: 'all', label: 'Tất cả loại kênh' },
                { value: 'general', label: 'General' },
                { value: 'announcement', label: 'Announcement' },
                { value: 'workspace', label: 'Workspace' },
                { value: 'custom', label: 'Custom' },
                { value: 'dm', label: 'DM' },
              ]}
              placeholder="Tất cả loại kênh"
            />
          </div>

          {/* Reset Button */}
          {(searchTerm !== '' || typeFilter !== 'all' || workspaceFilter !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/30 dark:hover:text-red-400 dark:hover:border-red-800/50 transition-colors ml-auto"
            >
              Làm mới
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--card-bg)] rounded-xl shadow-sm border border-[var(--border-color)] flex flex-col flex-1 min-h-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto min-h-0">
              <Table
                fixedLayout
                headers={[
                  { label: 'ID', className: 'w-[8%]' },
                  { label: 'Tên Channel', className: 'w-[20%]' },
                  { label: 'Loại', align: 'center', className: 'w-[10%]' },
                  { label: 'Workspace', className: 'w-[15%]' },
                  { label: 'Riêng tư', align: 'center', className: 'w-[8%]' },
                  { label: 'Thành viên', align: 'center', className: 'w-[8%]' },
                  { label: 'Tin nhắn cuối', className: 'w-[15%]' },
                  { label: 'Ngày tạo', align: 'center', className: 'w-[10%]' },
                  { label: 'Thao tác', align: 'center', className: 'w-[6%]' },
                ]}
              >
                {paginatedChannels.map((channel) => (
                  <TableRow key={channel._id}>
                    <TableCell>
                      <span className="font-mono text-xs">#{channel._id?.slice(-6)}</span>
                    </TableCell>
                    <TableCell className="max-w-0">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            channel.type === 'announcement'
                              ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                              : channel.type === 'dm'
                              ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : channel.type === 'custom'
                              ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                              : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}
                        >
                          {getTypeIcon(channel.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[var(--text-primary)] truncate" title={channel.name}>{channel.name}</p>
                          {channel.description && (
                            <p className="text-xs text-[var(--text-muted)] truncate" title={channel.description}>{channel.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{getTypeBadge(channel.type)}</TableCell>
                    <TableCell className="max-w-0">
                      <div className="truncate text-sm text-[var(--text-primary)]" title={getWorkspaceName(channel.workspaceId)}>
                        {getWorkspaceName(channel.workspaceId)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {channel.isPrivate ? (
                        <Badge variant="warning">
                          <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Có</span>
                        </Badge>
                      ) : (
                        <Badge variant="success">Không</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="flex items-center justify-center gap-1 text-sm text-[var(--text-secondary)]">
                        <Users className="w-3.5 h-3.5" />
                        {(channel.type === 'general' || channel.type === 'announcement') 
                          ? 'Tất cả' 
                          : (channel.channelMembers?.length || channel.members?.length || 0)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-0">
                      {channel.lastMessage ? (
                        <div className="min-w-0">
                          <p className="text-xs text-[var(--text-muted)] truncate">
                            {channel.lastMessage.senderName && (
                              <span className="font-medium">{channel.lastMessage.senderName}: </span>
                            )}
                            {channel.lastMessage.content || '(media)'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs text-[var(--text-muted)]">
                        {channel.createdAt ? new Date(channel.createdAt).toLocaleDateString('vi-VN') : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openViewModal(channel)}
                          className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-primary-600"
                          title="Xem thông tin"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openChatModal(channel)}
                          className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-green-600"
                          title="Xem lịch sử Chat"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(channel._id)}
                          className="p-1.5 rounded hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-red-600"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>

              {/* Empty State */}
              {displayChannels.length === 0 && (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                  <p className="text-[var(--text-secondary)]">Chưa có channel nào</p>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[var(--border-color)] px-4 py-3 bg-[var(--bg-tertiary)] shrink-0 gap-3 sm:gap-0">
                <span className="text-sm text-[var(--text-secondary)] text-center sm:text-left">
                  Đang hiển thị {((currentPage - 1) * itemsPerPage) + 1} đến {Math.min(currentPage * itemsPerPage, displayChannels.length)} trên tổng số {displayChannels.length}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Trước
                  </Button>
                  <div className="flex items-center px-2">
                    <span className="text-sm font-medium">{currentPage} / {totalPages}</span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <ChannelViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        channel={selectedChannel}
        onDelete={handleDelete}
      />
      
      <ChatViewerModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        channel={selectedChannel}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />
    </div>
  );
}
