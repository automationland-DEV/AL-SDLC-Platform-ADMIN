import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Search, Loader2, FileText, File, Download, ExternalLink, ImageIcon, Play, ChevronLeft } from 'lucide-react';
import { chatChannelService } from '../../../../services';
import type { ChatMessage, User } from '../../../../types';

interface ChatSearchPanelProps {
  channelId: string;
  onClose: () => void;
  onJumpToMessage?: (messageId: string) => void;
}

interface Attachment {
  _id: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export default function ChatSearchPanel({ channelId, onClose, onJumpToMessage }: ChatSearchPanelProps) {
  const [activeTab, setActiveTab] = useState<'messages' | 'files' | 'links'>('messages');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  const [selectedSenderId, setSelectedSenderId] = useState<string>('');
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [files, setFiles] = useState<Attachment[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  
  const [linksList, setLinksList] = useState<{ url: string; msg: ChatMessage }[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  
  const { data: members = [] } = useQuery({
    queryKey: ['channels', 'members', channelId],
    queryFn: () => chatChannelService.getMembers(channelId),
    enabled: Boolean(channelId),
    staleTime: 1000 * 60 * 2,
  });
  
  const [showSenderDropdown, setShowSenderDropdown] = useState(false);
  const [senderSearchQuery, setSenderSearchQuery] = useState('');

  const [lightboxFile, setLightboxFile] = useState<{ url: string; originalName: string; mimeType?: string } | null>(null);

  const mediaFiles = useMemo(() => {
    return files.filter(f => {
      const mime = f.mimeType?.toLowerCase() || '';
      return mime.startsWith('image/') || mime.startsWith('video/');
    });
  }, [files]);

  const docFiles = useMemo(() => {
    return files.filter(f => {
      const mime = f.mimeType?.toLowerCase() || '';
      return !mime.startsWith('image/') && !mime.startsWith('video/');
    });
  }, [files]);

  const selectedSender = useMemo(() => {
    return members.find(m => ((m as { _id?: string })._id || m.id) === selectedSenderId);
  }, [members, selectedSenderId]);

  const filteredMembersForDropdown = useMemo(() => {
    if (!senderSearchQuery) return members;
    const lowerQuery = senderSearchQuery.toLowerCase();
    return members.filter(m => 
      m.fullName?.toLowerCase().includes(lowerQuery) || 
      m.email?.toLowerCase().includes(lowerQuery)
    );
  }, [members, senderSearchQuery]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (activeTab !== 'messages') return;
    
    if (!debouncedQuery.trim() && !selectedSenderId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages([]);
      return;
    }
    
    setIsSearching(true);
    chatChannelService.searchMessages(channelId, debouncedQuery, selectedSenderId || undefined)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setIsSearching(false));
  }, [channelId, debouncedQuery, selectedSenderId, activeTab]);

  // Fetch Files & Images
  useEffect(() => {
    if (activeTab !== 'files' && activeTab !== 'links') return;
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoadingFiles(true);
    Promise.all([
      chatChannelService.getAttachments(channelId),
      chatChannelService.getImages(channelId)
    ])
    .then(([attachmentsData, imagesData]) => {
      const normalizedImages = (imagesData as Array<{ _id: string; originalName?: string; filename?: string; mimeType?: string; mimetype?: string; size?: number; url: string; createdAt?: string }>).map((img) => ({
        _id: img._id,
        originalName: img.originalName || img.filename || 'image.jpg',
        mimeType: img.mimeType || img.mimetype || 'image/jpeg',
        size: img.size || 0,
        url: img.url,
        createdAt: img.createdAt || new Date().toISOString()
      }));

      const normalizedAttachments = (attachmentsData as Array<{ _id: string; originalName?: string; filename?: string; mimeType?: string; mimetype?: string; size?: number; url: string; createdAt?: string }>).map((att) => ({
        _id: att._id,
        originalName: att.originalName || att.filename || 'file',
        mimeType: att.mimeType || att.mimetype || 'application/octet-stream',
        size: att.size || 0,
        url: att.url,
        createdAt: att.createdAt || new Date().toISOString()
      }));

      const combined = [...normalizedImages, ...normalizedAttachments].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setFiles(combined);
    })
    .catch(console.error)
    .finally(() => setIsLoadingFiles(false));
  }, [channelId, activeTab]);

  // Fetch Links
  useEffect(() => {
    if (activeTab !== 'links') return;
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoadingLinks(true);
    chatChannelService.getMessages(channelId, undefined, 100)
      .then(res => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const extracted: { url: string; msg: ChatMessage }[] = [];
        
        res.messages.forEach(msg => {
          if (!msg.content || msg.isDeleted) return;
          const urls = msg.content.match(urlRegex);
          if (urls) {
            urls.forEach(url => {
              let cleanUrl = url;
              if (url.endsWith(')')) {
                const idx = msg.content.indexOf(url);
                if (idx > 0 && msg.content[idx - 1] === '(') {
                  cleanUrl = url.slice(0, -1);
                }
              }
              extracted.push({ url: cleanUrl, msg });
            });
          }
        });
        setLinksList(extracted);
      })
      .catch(console.error)
      .finally(() => setIsLoadingLinks(false));
  }, [channelId, activeTab]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="w-full sm:w-80 absolute sm:relative inset-0 sm:inset-auto z-20 sm:z-auto border-l-0 sm:border-l border-[var(--border-color)] bg-[var(--bg-primary)] flex flex-col h-full flex-shrink-0 animate-in slide-in-from-right-8 duration-300">
      <div className="px-3 py-3 sm:px-4 sm:py-3 border-b border-[var(--border-color)] flex items-center justify-between gap-2 bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-2 min-w-0">
          <button 
            onClick={onClose}
            className="sm:hidden p-1.5 -ml-1 rounded-lg hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="truncate">
            <h3 className="font-semibold text-[var(--text-primary)] truncate flex items-center gap-2">
              <Search className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
              Tìm kiếm Channel
            </h3>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="hidden sm:block p-1.5 hover:bg-[var(--hover-bg)] rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex border-b border-[var(--border-color)]">
        <button
          onClick={() => setActiveTab('messages')}
          className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-colors ${
            activeTab === 'messages' ? 'border-primary-600 text-primary-600' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          Tin nhắn
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-colors ${
            activeTab === 'files' ? 'border-primary-600 text-primary-600' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          Files & Ảnh
        </button>
        <button
          onClick={() => setActiveTab('links')}
          className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-colors ${
            activeTab === 'links' ? 'border-primary-600 text-primary-600' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          Links
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'messages' && (
          <div className="p-4 space-y-4">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Tìm tin nhắn..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
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

            <div className="space-y-3 mt-4">
              {isSearching ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                </div>
              ) : messages.length > 0 ? (
                messages.map(msg => (
                  <div 
                    key={msg._id} 
                    className="p-3 bg-[var(--bg-tertiary)] rounded-lg hover:bg-[var(--hover-bg)] transition-colors cursor-pointer border border-transparent hover:border-[var(--border-color)]"
                    onClick={() => onJumpToMessage?.(msg._id)}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <img 
                        src={msg.senderId?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderId?.fullName || 'U')}&background=random`} 
                        alt="avatar" 
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="text-xs font-semibold text-[var(--text-primary)]">{msg.senderId?.fullName}</span>
                      <span className="text-[10px] text-[var(--text-muted)] ml-auto">{formatDate(msg.createdAt)}</span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-3">{msg.content}</p>
                  </div>
                ))
              ) : !debouncedQuery.trim() && !selectedSenderId ? (
                <div className="text-center py-8 text-[var(--text-muted)] flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full border-2 border-[var(--border-color)] flex items-center justify-center mb-3 opacity-50">
                    <Search className="w-6 h-6" />
                  </div>
                  <p className="text-sm max-w-[200px]">Nhập từ khóa hoặc chọn người gửi để tìm kiếm.</p>
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Không tìm thấy tin nhắn nào</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="p-4">
            {isLoadingFiles ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
              </div>
            ) : files.length > 0 ? (
              <div className="space-y-6">
                {/* Media Section */}
                {mediaFiles.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5" />
                      Ảnh & Video ({mediaFiles.length})
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {mediaFiles.map((file) => {
                        const isVideo = file.mimeType?.toLowerCase().startsWith('video/');
                        return (
                          <div
                            key={file._id}
                            className="relative aspect-square rounded-[6px] overflow-hidden border border-[var(--border-color)] bg-[var(--bg-secondary)] group cursor-pointer"
                            onClick={() => setLightboxFile({ url: file.url, originalName: file.originalName || 'Media', mimeType: file.mimeType })}
                          >
                            {isVideo ? (
                              <div className="relative w-full h-full bg-black flex items-center justify-center">
                                <video
                                  src={file.url}
                                  preload="metadata"
                                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                  <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                    <Play className="w-3.5 h-3.5 text-black fill-black ml-0.5" />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <img
                                src={file.url}
                                alt={file.originalName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Documents Section */}
                {docFiles.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      Tài liệu ({docFiles.length})
                    </h4>
                    <div className="space-y-2">
                      {docFiles.map((file) => {
                        const isPdf = file.mimeType?.toLowerCase() === 'application/pdf';
                        return (
                          <div key={file._id} className="flex items-start gap-3 p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors group">
                            <div className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center flex-shrink-0">
                              {isPdf ? (
                                <FileText className="w-5 h-5 text-red-500" />
                              ) : (
                                <FileText className="w-5 h-5 text-blue-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[var(--text-primary)] truncate" title={file.originalName}>
                                {file.originalName}
                              </p>
                              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                {(file.size / 1024).toFixed(1)} KB • {formatDate(file.createdAt)}
                              </p>
                            </div>
                            <a 
                              href={file.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1.5 opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded transition-all"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)]">
                <File className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Không có file nào</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'links' && (
          <div className="p-4">
            {isLoadingLinks ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
              </div>
            ) : linksList.length > 0 ? (
              <div className="space-y-3">
                {linksList.map((link, idx) => (
                  <a 
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-[var(--bg-tertiary)] rounded-lg hover:bg-[var(--hover-bg)] transition-colors border border-transparent hover:border-[var(--border-color)] group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium truncate group-hover:underline">
                          {link.url}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-1 truncate">
                          Gửi bởi {link.msg.senderId?.fullName} • {formatDate(link.msg.createdAt)}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 flex-shrink-0 text-[var(--text-muted)] group-hover:text-blue-500" />
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)]">
                <ExternalLink className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Không có link nào</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Preview Modal */}
      {lightboxFile && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center"
          onClick={() => setLightboxFile(null)}
        >
          {/* Top Bar */}
          <div 
            className="absolute top-0 inset-x-0 h-14 bg-gradient-to-b from-black/70 to-transparent flex items-center justify-between px-6 text-white z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xs font-medium truncate max-w-[70%]">
              {lightboxFile.originalName}
            </span>
            <div className="flex items-center gap-3">
              <a
                href={lightboxFile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </a>
              <button
                onClick={() => setLightboxFile(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {lightboxFile.mimeType?.toLowerCase().startsWith('video/') ? (
            <video
              src={lightboxFile.url}
              controls
              preload="metadata"
              className="max-w-[90vw] max-h-[85vh] rounded-md shadow-2xl mt-10 focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={lightboxFile.url}
              alt="Preview"
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-md shadow-2xl select-none mt-10"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </div>
  );
}
