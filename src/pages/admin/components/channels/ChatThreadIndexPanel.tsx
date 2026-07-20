import { useState, useEffect, useMemo } from 'react';
import { X, MessageSquare, Loader2, ChevronLeft } from 'lucide-react';
import { chatChannelService } from '../../../../services';
import type { ChatMessage, User } from '../../../../types';

interface ChatThreadIndexPanelProps {
  channelId: string;
  onClose: () => void;
  onOpenThread: (messageId: string) => void;
}

export default function ChatThreadIndexPanel({ channelId, onClose, onOpenThread }: ChatThreadIndexPanelProps) {
  const [threads, setThreads] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedSenderId, setSelectedSenderId] = useState<string>('');
  const [showSenderDropdown, setShowSenderDropdown] = useState(false);
  const [senderSearchQuery, setSenderSearchQuery] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setIsLoading(true);
    Promise.all([
      chatChannelService.getActiveThreads(channelId),
      chatChannelService.getMembers(channelId)
    ])
      .then(([threadsRes, membersRes]) => {
        setThreads(threadsRes);
        setMembers(membersRes);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [channelId]);

  const filteredMembersForDropdown = useMemo(() => {
    if (!senderSearchQuery.trim()) return members;
    const lower = senderSearchQuery.toLowerCase();
    return members.filter(m => 
      m.fullName?.toLowerCase().includes(lower) || 
      m.email?.toLowerCase().includes(lower)
    );
  }, [members, senderSearchQuery]);

  const selectedSender = useMemo(() => {
    return members.find(m => ((m as { _id?: string })._id || m.id) === selectedSenderId);
  }, [members, selectedSenderId]);

  const filteredThreads = useMemo(() => {
    if (!selectedSenderId) return threads;
    return threads.filter(thread => {
      const parentAuthor = typeof thread.senderId === 'object' ? (thread.senderId as { _id?: string; id?: string })._id || (thread.senderId as { id?: string }).id : thread.senderId;
      if (String(parentAuthor) === String(selectedSenderId)) return true;
      if ((thread as unknown as { lastReplyParticipants?: unknown[] }).lastReplyParticipants) {
        return ((thread as unknown as { lastReplyParticipants?: { userId: string }[] }).lastReplyParticipants || []).some(p => Boolean(p) && String(p.userId) === String(selectedSenderId));
      }
      return false;
    });
  }, [threads, selectedSenderId]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="w-full sm:w-[350px] absolute sm:relative inset-0 sm:inset-auto z-20 sm:z-auto border-l-0 sm:border-l border-[var(--border-color)] bg-[var(--bg-primary)] flex flex-col h-full flex-shrink-0 animate-in slide-in-from-right-8 duration-300">
      <div className="px-3 py-3 sm:px-4 sm:py-3 border-b border-[var(--border-color)] flex items-center justify-between gap-2 bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-2 min-w-0">
          <button 
            onClick={onClose}
            className="sm:hidden p-1.5 -ml-1 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="truncate">
            <h3 className="font-semibold text-[var(--text-primary)] truncate">Active Threads</h3>
            <p className="text-xs text-[var(--text-muted)] truncate block">#{channelId.slice(-4)}</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="hidden sm:block p-1.5 hover:bg-[var(--hover-bg)] rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="border-b border-[var(--border-color)] px-4 py-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSenderDropdown(!showSenderDropdown)}
            className="w-full flex items-center justify-between px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] text-left hover:bg-[var(--hover-bg)] transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          >
            {selectedSender ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden flex-shrink-0">
                    {selectedSender.avatar ? (
                      <img src={selectedSender.avatar} alt={selectedSender.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{(selectedSender.fullName || selectedSender.email || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="truncate max-w-[150px]">{selectedSender.fullName || selectedSender.email}</span>
                </div>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSenderId('');
                  }}
                  className="p-1 hover:bg-[var(--border-color)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer ml-1"
                  title="Clear filter"
                >
                  <X className="w-3.5 h-3.5" />
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-[var(--text-muted)]">Lọc theo người gửi...</span>
                <span className="text-[10px] text-[var(--text-muted)]">▼</span>
              </div>
            )}
          </button>

          {showSenderDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSenderDropdown(false)} />
              <div className="absolute z-20 w-full mt-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-md shadow-lg max-h-60 overflow-y-auto flex flex-col">
                <div className="p-2 border-b border-[var(--border-color)] sticky top-0 bg-[var(--card-bg)] z-10">
                  <input
                    type="text"
                    placeholder="Tìm người gửi..."
                    value={senderSearchQuery}
                    onChange={(e) => setSenderSearchQuery(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSenderId('');
                      setShowSenderDropdown(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[var(--hover-bg)] transition-colors border-b border-[var(--border-color)]"
                  >
                    <div className="w-6 h-6 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-muted)] flex-shrink-0">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium text-[var(--text-primary)]">Tất cả các thread</span>
                  </button>
                  {filteredMembersForDropdown.map((m) => (
                    <button
                      key={(m as { _id?: string })._id || m.id}
                      type="button"
                      onClick={() => {
                        setSelectedSenderId(((m as { _id?: string })._id || m.id) as string);
                        setShowSenderDropdown(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left hover:bg-[var(--hover-bg)] transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden flex-shrink-0">
                        {m.avatar ? (
                          <img src={m.avatar} alt={m.fullName || m.email} className="w-full h-full object-cover" />
                        ) : (
                          <span>{(m.fullName || m.email || 'U').charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[var(--text-primary)] truncate leading-none">
                          {m.fullName || m.email || 'User'}
                        </p>
                        {m.email && (
                          <p className="text-[10px] text-[var(--text-muted)] truncate leading-none mt-1">
                            {m.email}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                  {filteredMembersForDropdown.length === 0 && (
                    <div className="px-3 py-3 text-center text-xs text-[var(--text-muted)]">
                      Không tìm thấy
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          </div>
        ) : filteredThreads.length > 0 ? (
          filteredThreads.map(thread => (
            <div 
              key={thread._id} 
              className="border border-[var(--border-color)] rounded-lg p-3 hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
              onClick={() => onOpenThread(thread._id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <img 
                    src={((thread.senderId as unknown as { avatar?: string }).avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent((thread.senderId as unknown as { fullName?: string }).fullName || 'U')}&background=random`} 
                    alt="avatar" 
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span className="text-xs font-semibold text-[var(--text-primary)]">{(thread.senderId as unknown as { fullName?: string }).fullName}</span>
                </div>
                <span className="text-[10px] text-[var(--text-muted)]">{formatDate(thread.createdAt)}</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3">{thread.content}</p>
              
              {thread.replyCount ? (
                <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between">
                  <span className="text-xs font-medium text-blue-600">{thread.replyCount} replies</span>
                  <div className="flex -space-x-1">
                    {((thread as unknown as { lastReplyParticipants?: { fullName?: string; avatar?: string }[] }).lastReplyParticipants || []).slice(0, 3).map((p, i) => (
                      <img 
                        key={i} 
                        src={p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.fullName || 'U')}&background=random`} 
                        className="w-5 h-5 rounded-full border border-[var(--bg-primary)] object-cover" 
                        alt="avatar" 
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-[var(--text-muted)]">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Không có thread nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
