import { useState, useEffect, useRef } from 'react';
import { X, Hash, Megaphone, Users, MessageSquare, FileText, Download } from 'lucide-react';
import { chatChannelService } from '../../../../services';
import type { ChatChannel, ChatMessage, ChatAttachment } from '../../../../types';

interface ChatViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: ChatChannel | null;
}

export default function ChatViewerModal({ isOpen, onClose, channel }: ChatViewerModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  const [activeThread, setActiveThread] = useState<ChatMessage | null>(null);
  const [threadReplies, setThreadReplies] = useState<ChatMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!channel) return;
    setLoadingMessages(true);
    try {
      const res = await chatChannelService.getMessages(channel._id);
      setMessages(res.messages.reverse() || []); // API returns newest first. We need chronological order.
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
    if (isOpen && channel) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadMessages();
    } else {
      setMessages([]);
      setActiveThread(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, channel]);

  useEffect(() => {
    if (activeThread && channel) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadThreadReplies(activeThread._id);
    } else {
      setThreadReplies([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThread]);



  if (!isOpen || !channel) return null;

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
    
    // Code blocks: ```lang\ncode\n```
    formatted = formatted.replace(/```(?:[a-z]+)?\n([\s\S]*?)```/g, '<pre class="bg-[var(--bg-secondary)] p-2 rounded text-xs overflow-x-auto font-mono mt-1 mb-1 border border-[var(--border-color)]"><code>$1</code></pre>');
    
    // Inline code: `code`
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-[var(--bg-secondary)] text-red-500 dark:text-red-400 px-1 py-0.5 rounded font-mono text-xs border border-[var(--border-color)]">$1</code>');
    
    // Bold: **text** or __text__
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // Italic: *text* or _text_
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Strikethrough: ~~text~~
    formatted = formatted.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // Mentions: [@Name](userId) or @[Name](userId)
    formatted = formatted.replace(/(?:\[@|@\[)([^\]]+)\]\([^)]+\)/g, '<span class="text-primary-600 dark:text-primary-400 font-semibold bg-primary-50 dark:bg-primary-900/30 px-1 rounded">@$1</span>');
    
    // Markdown links: [Label](URL)
    formatted = formatted.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline font-semibold">$1</a>');
    
    // Fallback bare URLs (that are not already inside HTML attributes or markdown tags)
    formatted = formatted.replace(/(^|\s)(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline break-all">$2</a>');

    return <div className="whitespace-pre-wrap break-words text-sm text-[var(--text-primary)]" dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const renderAttachments = (attachments?: ChatAttachment[]) => {
    if (!attachments || attachments.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {attachments.map((att, idx) => (
          <div key={idx} className="relative group rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--bg-secondary)]">
            {att.type?.startsWith('image/') ? (
              <img src={att.url} alt={att.name || 'Attachment'} className="max-w-[200px] max-h-[200px] object-cover" />
            ) : (
              <div className="flex items-center gap-2 p-3 min-w-[200px]">
                <FileText className="w-8 h-8 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" title={att.name}>{att.name || 'Unknown file'}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{att.size ? (att.size / 1024).toFixed(1) + ' KB' : 'Unknown size'}</p>
                </div>
              </div>
            )}
            <a 
              href={att.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
            >
              <Download className="w-6 h-6" />
            </a>
          </div>
        ))}
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
      <div className={`relative flex gap-3 hover:bg-[var(--hover-bg)] p-2 -mx-2 rounded-lg transition-colors group ${activeThread?._id === msg._id ? 'bg-[var(--hover-bg)] ring-1 ring-primary-500/30' : ''}`}>
        
        {/* Floating Action Bar */}
        {!isThread && !msg.isDeleted && (msg.replyCount || 0) > 0 && (
          <div className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--card-bg)] border border-[var(--border-color)] shadow-sm rounded-md overflow-hidden z-10 flex">
            <button 
              onClick={() => setActiveThread(msg)}
              className="px-2 py-1.5 hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-primary-600 flex items-center gap-1.5 text-xs font-medium"
              title="Xem Thread / Phản hồi"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Xem Thread</span>
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
            <p className="text-sm italic text-[var(--text-muted)] mt-1">Tin nhắn đã bị xóa</p>
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

          {/* Thread indicators */}
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
              <span className="text-sm font-medium text-primary-600 group-hover/thread:text-primary-700">
                {msg.replyCount} phản hồi
              </span>
              <span className="text-xs text-[var(--text-muted)] flex items-center gap-1 before:content-['•'] before:mr-1">
                Tin nhắn cuối lúc {formatTime(msg.lastReplyAt || msg.createdAt)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-6xl h-[85vh] bg-[var(--card-bg)] rounded-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden flex flex-col transition-all duration-300`}>
        {/* Header */}
        <div className="flex-shrink-0 relative bg-[var(--bg-secondary)] border-b border-[var(--border-color)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 flex items-center justify-center">
              {getTypeIcon(channel.type)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                {channel.name}
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                  Read-only View
                </span>
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate max-w-xl">
                {channel.description || 'Không có mô tả'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Main Chat Area */}
          <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${activeThread ? 'border-r border-[var(--border-color)] mr-0' : ''}`}>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)]">
                  <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
                  <p>Chưa có tin nhắn nào trong kênh này.</p>
                </div>
              ) : (
                <>
                  <div className="text-center pb-4">
                    <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] px-3 py-1 rounded-full">
                      Bắt đầu lịch sử trò chuyện
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
              Chế độ xem trước dưới quyền Quản trị viên. Bạn không thể gửi tin nhắn.
            </div>
          </div>

          {/* Thread Sidebar */}
          {activeThread && (
            <div className="w-[400px] flex-shrink-0 flex flex-col bg-[var(--card-bg)]">
              <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-[var(--text-primary)]">Thread</h4>
                  <span className="text-xs text-[var(--text-muted)] max-w-[150px] truncate">#{channel.name}</span>
                </div>
                <button 
                  onClick={() => setActiveThread(null)}
                  className="p-1.5 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {/* Parent Message */}
                <div className="pb-4 border-b border-[var(--border-color)] mb-4">
                  {renderMessageBubble(activeThread, true)}
                </div>

                {/* Replies */}
                <div className="space-y-4">
                  {loadingThread ? (
                     <div className="flex justify-center py-4">
                       <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent"></div>
                     </div>
                  ) : threadReplies.length === 0 ? (
                    <div className="text-center text-sm text-[var(--text-muted)] py-4">
                      Chưa có phản hồi nào
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-sm font-medium text-[var(--text-primary)]">{threadReplies.length} phản hồi</span>
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
        </div>
      </div>
    </div>
  );
}
