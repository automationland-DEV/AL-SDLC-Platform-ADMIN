import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Hash, Megaphone, Users, MessageSquare, FileText, Download, Search, Play, ChevronLeft } from 'lucide-react';
import { chatChannelService } from '../../../services';
import type { ChatChannel, ChatMessage, ChatAttachment } from '../../../types';
import { useChannelsQuery } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import ChatSearchPanel from '../components/channels/ChatSearchPanel';
import ChatMemberPanel from '../components/channels/ChatMemberPanel';
import ChatThreadIndexPanel from '../components/channels/ChatThreadIndexPanel';

export default function ChatViewerPage() {
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

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  const [activeThread, setActiveThread] = useState<ChatMessage | null>(null);
  const [threadReplies, setThreadReplies] = useState<ChatMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);

  const [lightboxFile, setLightboxFile] = useState<{ url: string; name: string; mimeType?: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

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
      setTimeout(() => scrollToBottom(messagesEndRef), 100);
    } catch (error) {
      console.error('Failed to load messages', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadThreadReplies = async (messageId: string) => {
    if (!channel) return;
    setLoadingThread(true);
    try {
      const replies = await chatChannelService.getThreadReplies(channel._id, messageId);
      setThreadReplies(replies || []);
      setTimeout(() => scrollToBottom(threadEndRef), 100);
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

  useEffect(() => {
    if (activeThread && channel) {
      loadThreadReplies(activeThread._id);
    } else {
      setThreadReplies([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThread]);

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

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const renderMessageContent = (content: string) => {
    if (!content) return null;
    let formatted = content;
    
    formatted = formatted.replace(/```(?:[a-z]+)?\n([\s\S]*?)```/g, '<pre class="bg-[var(--bg-secondary)] p-2 rounded text-xs overflow-x-auto font-mono mt-1 mb-1 border border-[var(--border-color)]"><code>$1</code></pre>');
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-[var(--bg-secondary)] text-rose-500 px-1 py-0.5 rounded font-mono text-xs border border-[var(--border-color)]">$1</code>');
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/_([^_]+)_/g, '<em>$1</em>');
    formatted = formatted.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    formatted = formatted.replace(/(?:\[@|@\[)([^\]]+)\]\([^)]+\)/g, '<span class="text-sky-600 font-semibold bg-sky-500/10 px-1 rounded">@$1</span>');
    formatted = formatted.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline font-semibold">$1</a>');
    formatted = formatted.replace(/(^|\s)(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline break-all">$2</a>');

    return <div className="whitespace-pre-wrap break-words text-sm text-[var(--text-primary)]" dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const renderAttachments = (attachments?: ChatAttachment[]) => {
    if (!attachments || attachments.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {attachments.map((att, idx) => {
          const mime = att.mimeType || att.type || '';
          const isImage = mime.startsWith('image/');
          const isVideo = mime.startsWith('video/');
          
          return (
            <div key={idx} className={isImage || isVideo ? "max-w-[350px]" : "relative group rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--bg-secondary)]"}>
              {isImage ? (
                <div 
                  className="relative group rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--bg-secondary)] cursor-pointer"
                  onClick={() => setLightboxFile({ url: att.url, name: att.name || 'Image', mimeType: mime })}
                >
                  <img src={att.url} alt={att.name || 'Attachment'} className="w-full h-auto max-h-[300px] object-contain block hover:opacity-95 transition-opacity" />
                </div>
              ) : isVideo ? (
                <div 
                  className="relative group cursor-pointer bg-black rounded-lg border border-[var(--border-color)] flex items-center justify-center w-full max-h-[300px] aspect-video overflow-hidden"
                  onClick={() => setLightboxFile({ url: att.url, name: att.name || 'Video', mimeType: mime })}
                >
                  <video src={att.url} preload="metadata" className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/30 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-200">
                      <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 p-3 min-w-[200px]">
                    <FileText className="w-8 h-8 text-sky-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" title={att.name}>{att.name || 'Unknown file'}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{att.size ? (att.size / 1024).toFixed(1) + ' KB' : 'Unknown size'}</p>
                    </div>
                  </div>
                  <a 
                    href={att.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                  >
                    <Download className="w-6 h-6" />
                  </a>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderReactions = (reactions?: Record<string, unknown>) => {
    if (!reactions || typeof reactions !== 'object') return null;
    const entries = Object.entries(reactions);
    if (entries.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {entries.map(([emoji, users]: [string, unknown], idx) => {
          const count = Array.isArray(users) ? users.length : 0;
          if (count === 0) return null;
          return (
            <div key={idx} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs">
              <span>{emoji}</span>
              <span className="font-medium text-[var(--text-secondary)]">{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMessageBubble = (msg: ChatMessage, isThread = false) => {
    return (
      <div id={`msg-${msg._id}`} className={`relative flex gap-3 hover:bg-[var(--hover-bg)] p-2 -mx-2 rounded-lg transition-colors group ${activeThread?._id === msg._id ? 'bg-[var(--hover-bg)] ring-1 ring-sky-500/30' : ''}`}>
        {!isThread && !msg.isDeleted && (msg.replyCount || 0) > 0 && (
          <div className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--card-bg)] border border-[var(--border-color)] shadow-sm rounded-md overflow-hidden z-10 flex">
            <button 
              onClick={() => setActiveThread(msg)}
              className="px-2 py-1.5 hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-sky-600 flex items-center gap-1.5 text-xs font-medium"
              title={language === 'vi' ? 'Xem Thread' : 'View Thread'}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Xem Thread' : 'View Thread'}</span>
            </button>
          </div>
        )}

        <img 
          src={msg.senderId?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderId?.fullName || 'User')}&background=random`}
          alt="avatar"
          className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-sm text-[var(--text-primary)]">{msg.senderId?.fullName || msg.senderId?.email}</span>
            <span className="text-xs text-[var(--text-muted)]">{formatDate(msg.createdAt)} {formatTime(msg.createdAt)}</span>
          </div>
          
          {msg.isDeleted ? (
            <p className="text-sm italic text-[var(--text-muted)] mt-1">{language === 'vi' ? 'Tin nhắn đã bị xóa' : 'Message was deleted'}</p>
          ) : (
            <>
              {msg.stickerId ? (
                <img src={msg.stickerId.url} alt="Sticker" className="w-32 h-32 object-contain mt-1" />
              ) : (
                <div className="mt-1">
                  {renderMessageContent(msg.content)}
                </div>
              )}
              {renderAttachments(msg.attachments)}
              {renderReactions(msg.reactions)}
            </>
          )}

          {!isThread && !msg.isDeleted && (msg.replyCount || 0) > 0 && (
            <div 
              className="mt-2 inline-flex items-center gap-2 cursor-pointer group/thread px-2.5 py-1.5 rounded-lg border border-transparent hover:border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-all"
              onClick={() => setActiveThread(msg)}
            >
              <div className="flex -space-x-2">
                {msg.replyUsers?.slice(0, 3).map((u: { _id?: string; fullName?: string; avatar?: string }, i: number) => (
                  <img 
                    key={i}
                    src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || 'U')}&background=random`} 
                    className="w-5 h-5 rounded-full border-2 border-[var(--card-bg)]"
                    alt="avatar"
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-sky-600 group-hover/thread:text-sky-700">
                {msg.replyCount} {language === 'vi' ? 'phản hồi' : 'replies'}
              </span>
              <span className="text-xs text-[var(--text-muted)] flex items-center gap-1 before:content-['•'] before:mr-1">
                {language === 'vi' ? 'Tin nhắn cuối lúc' : 'Last reply at'} {formatTime(msg.lastReplyAt || msg.createdAt)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
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
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                <div className="text-center pb-4">
                  <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] px-3 py-1 rounded-full">
                    {language === 'vi' ? 'Bắt đầu lịch sử trò chuyện' : 'Start of chat history'}
                  </span>
                </div>
                {messages.map(msg => (
                  <div key={msg._id}>
                    {renderMessageBubble(msg)}
                  </div>
                ))}
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
            <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <button 
                  onClick={() => setActiveThread(null)}
                  className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] transition-colors flex-shrink-0"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="truncate">
                  <h4 className="font-semibold text-[var(--text-primary)] truncate">Thread</h4>
                  <span className="text-xs text-[var(--text-muted)] truncate block">#{channel.name}</span>
                </div>
              </div>
              <button 
                onClick={() => setActiveThread(null)}
                className="hidden md:block p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="pb-4 border-b border-[var(--border-color)] mb-4">
                {renderMessageBubble(activeThread, true)}
              </div>
              <div className="space-y-4">
                {loadingThread ? (
                   <div className="flex justify-center py-4">
                     <div className="animate-spin rounded-full h-6 w-6 border-2 border-sky-500 border-t-transparent"></div>
                   </div>
                ) : threadReplies.length === 0 ? (
                  <div className="text-center text-sm text-[var(--text-muted)] py-4">
                    {language === 'vi' ? 'Chưa có phản hồi nào' : 'No replies yet'}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-sm font-medium text-[var(--text-primary)]">{threadReplies.length} {language === 'vi' ? 'phản hồi' : 'replies'}</span>
                      <div className="flex-1 h-px bg-[var(--border-color)]"></div>
                    </div>
                    {threadReplies.map(reply => (
                      <div key={reply._id}>
                        {renderMessageBubble(reply, true)}
                      </div>
                    ))}
                    <div ref={threadEndRef} />
                  </>
                )}
              </div>
            </div>
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

      {/* Lightbox */}
      {lightboxFile && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center"
          onClick={() => setLightboxFile(null)}
        >
          <div 
            className="absolute top-0 inset-x-0 h-14 bg-gradient-to-b from-black/70 to-transparent flex items-center justify-between px-6 text-white z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xs font-medium truncate max-w-[70%]">{lightboxFile.name}</span>
            <div className="flex items-center gap-3">
              <a href={lightboxFile.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Download">
                <Download className="w-5 h-5" />
              </a>
              <button onClick={() => setLightboxFile(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {lightboxFile.mimeType?.toLowerCase().startsWith('video/') ? (
            <video src={lightboxFile.url} controls className="max-w-[90vw] max-h-[85vh] rounded-md shadow-2xl focus:outline-none" onClick={(e) => e.stopPropagation()} />
          ) : (
            <img src={lightboxFile.url} alt="Preview" className="max-w-[90vw] max-h-[85vh] object-contain rounded-md shadow-2xl select-none" onClick={(e) => e.stopPropagation()} />
          )}
        </div>
      )}
    </div>
  );
}
