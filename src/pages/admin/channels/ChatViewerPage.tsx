import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Hash, Megaphone, Users, MessageSquare, Search, ChevronLeft } from 'lucide-react';
import { useAdminChatStore } from '../../../stores/adminChatStore';
import AdminMessageItem from './components/AdminMessageItem';
import AdminThreadPanel from './components/AdminThreadPanel';
import { chatChannelService } from '../../../services';
import type { ChatChannel, ChatMessage } from '../../../types';
import { useTranslation } from '../../../i18n/useTranslation';
import ChatSearchPanel from '../components/channels/ChatSearchPanel';
import ChatMemberPanel from '../components/channels/ChatMemberPanel';
import ChatThreadIndexPanel from '../components/channels/ChatThreadIndexPanel';

export default function ChatViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useTranslation();

  const [channel, setChannel] = useState<ChatChannel | null>(null);
  const [isChannelsLoading, setIsChannelsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsChannelsLoading(true);
    chatChannelService.getById(id)
      .then(setChannel)
      .catch(() => setChannel(null))
      .finally(() => setIsChannelsLoading(false));
  }, [id]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const activeThreadParentId = useAdminChatStore(state => state.activeThreadParentId);
  const setActiveThreadParentId = useAdminChatStore(state => state.setActiveThreadParentId);
  const scrollTargetId = useAdminChatStore(state => state.scrollTargetId);
  const setScrollTargetId = useAdminChatStore(state => state.setScrollTargetId);

  const [activeThread, setActiveThread] = useState<ChatMessage | null>(null);
  const [threadReplies, setThreadReplies] = useState<ChatMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [isMemberPanelOpen, setIsMemberPanelOpen] = useState(false);
  const [isThreadIndexPanelOpen, setIsThreadIndexPanelOpen] = useState(false);

  const closeAllPanels = () => {
    setIsSearchPanelOpen(false);
    setIsMemberPanelOpen(false);
    setIsThreadIndexPanelOpen(false);
  };

  const toggleSearchPanel = () => {
    if (isSearchPanelOpen) {
      setIsSearchPanelOpen(false);
    } else {
      closeAllPanels();
      setIsSearchPanelOpen(true);
    }
  };

  const toggleMemberPanel = () => {
    if (isMemberPanelOpen) {
      setIsMemberPanelOpen(false);
    } else {
      closeAllPanels();
      setIsMemberPanelOpen(true);
    }
  };

  const toggleThreadIndexPanel = () => {
    if (isThreadIndexPanelOpen) {
      setIsThreadIndexPanelOpen(false);
    } else {
      closeAllPanels();
      setIsThreadIndexPanelOpen(true);
    }
  };

  const handleJumpToMessage = (messageId: string) => {
    setTimeout(() => {
      const el = document.getElementById(`msg-${messageId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('bg-sky-50', 'dark:bg-sky-900/30', 'ring-2', 'ring-sky-500', 'transition-all', 'duration-500', 'z-10');
        setTimeout(() => {
          el.classList.remove('bg-sky-50', 'dark:bg-sky-900/30', 'ring-2', 'ring-sky-500', 'z-10');
        }, 3000);
      }
    }, 150);
  };

  const scrollToBottom = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!channel) return;
    setLoadingMessages(true);
    try {
      const res = await chatChannelService.getMessages(channel._id);
      setMessages(res.messages.reverse() || []);
      setNextCursor(res.nextCursor);
      setTimeout(() => scrollToBottom(messagesEndRef), 100);
    } catch (error) {
      console.error('Failed to load messages', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!channel || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const el = messagesEndRef.current?.parentElement;
      const prevScrollHeight = el ? el.scrollHeight : 0;
      
      const res = await chatChannelService.getMessages(channel._id, nextCursor);
      setMessages(prev => [...(res.messages.reverse() || []), ...prev]);
      setNextCursor(res.nextCursor);
      
      setTimeout(() => {
        if (el) {
          el.scrollTop = el.scrollHeight - prevScrollHeight;
        }
      }, 50);
    } catch (error) {
      console.error('Failed to load more messages', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0 && nextCursor && !loadingMore) {
      loadMoreMessages();
    }
  };

  const loadThreadReplies = async (messageId: string) => {
    if (!channel) return;
    setLoadingThread(true);
    try {
      const res = await chatChannelService.getThreadReplies(channel._id, messageId);
      setThreadReplies(res || []);
    } catch (error) {
      console.error('Failed to load thread replies', error);
    } finally {
      setLoadingThread(false);
    }
  };

  useEffect(() => {
    if (channel) {
      loadMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  // Scroll to targeted message if scrollTargetId changes
  useEffect(() => {
    if (scrollTargetId) {
      const el = document.getElementById(`msg-${scrollTargetId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('bg-sky-50', 'dark:bg-sky-900/30', 'ring-2', 'ring-sky-500', 'transition-all', 'duration-500', 'z-10');
        setTimeout(() => {
          el.classList.remove('bg-sky-50', 'dark:bg-sky-900/30', 'ring-2', 'ring-sky-500', 'z-10');
        }, 3000);
      }
      setScrollTargetId(null);
    }
  }, [scrollTargetId, setScrollTargetId]);

  useEffect(() => {
    if (activeThreadParentId) {
      const threadMsg = messages.find(m => m._id === activeThreadParentId);
      if (threadMsg) {
        setActiveThread(threadMsg);
        loadThreadReplies(activeThreadParentId);
      } else {
        setActiveThread(null);
      }
    } else {
      setActiveThread(null);
      setThreadReplies([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThreadParentId, messages]);

  if (isChannelsLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24">
        <MessageSquare className="w-12 h-12 mx-auto text-[var(--text-muted)] stroke-1 mb-3" />
        <p className="text-sm text-[var(--text-muted)]">
          {language === 'vi' ? 'Không tìm thấy channel.' : 'Channel not found.'}
        </p>
        <button
          onClick={() => navigate('/channels')}
          className="mt-4 px-4 py-2 bg-sky-500 text-white rounded-xl hover:bg-sky-600 font-medium"
        >
          {language === 'vi' ? 'Quay lại danh sách' : 'Back to list'}
        </button>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement': return <Megaphone className="w-5 h-5" />;
      case 'dm': return <Users className="w-5 h-5" />;
      default: return <Hash className="w-5 h-5" />;
    }
  };



  return (
    <div className="h-[calc(100vh-8rem)] -mt-2 -mx-2 flex flex-col bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex-shrink-0 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/channels')}
            className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] transition-colors flex-shrink-0"
            title={language === 'vi' ? 'Quay lại' : 'Back'}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center flex-shrink-0">
            {getTypeIcon(channel.type)}
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              {channel.name}
              <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                Read-only
              </span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate max-w-xl">
              {channel.description || (language === 'vi' ? 'Không có mô tả' : 'No description')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={toggleThreadIndexPanel}
            className={`p-2 rounded-lg transition-colors ${isThreadIndexPanelOpen ? 'bg-sky-500/10 text-sky-500' : 'hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]'}`}
            title="Threads"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <button
            onClick={toggleMemberPanel}
            className={`p-2 rounded-lg transition-colors ${isMemberPanelOpen ? 'bg-sky-500/10 text-sky-500' : 'hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]'}`}
            title={language === 'vi' ? 'Thành viên' : 'Members'}
          >
            <Users className="w-5 h-5" />
          </button>
          <button
            onClick={toggleSearchPanel}
            className={`p-2 rounded-lg transition-colors ${isSearchPanelOpen ? 'bg-sky-500/10 text-sky-500' : 'hover:bg-[var(--hover-bg)] text-[var(--text-secondary)]'}`}
            title={language === 'vi' ? 'Tìm kiếm' : 'Search'}
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Main Chat Area */}
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${activeThread ? 'border-r border-[var(--border-color)] mr-0 hidden md:flex' : ''}`}>
          <div className="flex-1 overflow-y-auto p-6 space-y-4" onScroll={handleScroll}>
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-sky-500 border-t-transparent"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)]">
                <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
                <p>{language === 'vi' ? 'Chưa có tin nhắn nào trong kênh này.' : 'No messages in this channel.'}</p>
              </div>
            ) : (
              <>
                {nextCursor ? (
                  <div className="text-center pb-4">
                    {loadingMore && (
                      <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] px-3 py-1.5 rounded-full">
                        {language === 'vi' ? 'Đang tải...' : 'Loading...'}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-center pb-4">
                    <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] px-3 py-1 rounded-full">
                      {language === 'vi' ? 'Bắt đầu lịch sử trò chuyện' : 'Start of chat history'}
                    </span>
                  </div>
                )}
                {messages.map((msg, index) => {
                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  
                  let isGroupStart = true;
                  if (prevMsg && !prevMsg.isDeleted && !msg.isDeleted && !msg.threadParentId) {
                    const prevSenderId = typeof prevMsg.senderId === 'object' ? prevMsg.senderId?._id : prevMsg.senderId;
                    const currSenderId = typeof msg.senderId === 'object' ? msg.senderId?._id : msg.senderId;
                    
                    if (prevSenderId && currSenderId && prevSenderId === currSenderId) {
                      const timeDiff = new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime();
                      if (timeDiff < 5 * 60 * 1000) {
                        isGroupStart = false;
                      }
                    }
                  }

                  return (
                    <AdminMessageItem 
                      key={msg._id} 
                      message={msg} 
                      isSameUserAsPrevious={!isGroupStart} 
                    />
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          <div className="flex-shrink-0 p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-center text-sm text-[var(--text-muted)] italic">
            {language === 'vi' ? 'Chế độ xem trước. Bạn không thể gửi tin nhắn.' : 'Read-only mode. You cannot send messages.'}
          </div>
        </div>

        {/* Thread Sidebar */}
        {activeThread && (
          <div className="w-full md:w-[400px] flex-shrink-0 flex flex-col bg-[var(--bg-card)] absolute md:relative inset-0 md:inset-auto z-10 border-l-0 md:border-l border-[var(--border-color)]">
            <AdminThreadPanel 
              activeThread={activeThread}
              threadReplies={threadReplies}
              loadingThread={loadingThread}
              onClose={() => setActiveThreadParentId(null)}
            />
          </div>
        )}

        {/* Side Panels */}
        {isSearchPanelOpen && (
          <ChatSearchPanel
            channelId={channel._id}
            onClose={() => setIsSearchPanelOpen(false)}
            onJumpToMessage={(msgId) => {
              handleJumpToMessage(msgId);
              if (window.innerWidth < 768) closeAllPanels();
            }}
          />
        )}
        {isMemberPanelOpen && (
          <ChatMemberPanel
            channelId={channel._id}
            onClose={() => setIsMemberPanelOpen(false)}
          />
        )}
        {isThreadIndexPanelOpen && (
          <ChatThreadIndexPanel
            channelId={channel._id}
            onClose={() => setIsThreadIndexPanelOpen(false)}
            onOpenThread={(msgId) => {
              const msg = messages.find(m => m._id === msgId) || { _id: msgId } as ChatMessage;
              setActiveThread(msg);
              handleJumpToMessage(msgId);
              if (window.innerWidth < 768) closeAllPanels();
            }}
          />
        )}
      </div>

    </div>
  );
}
