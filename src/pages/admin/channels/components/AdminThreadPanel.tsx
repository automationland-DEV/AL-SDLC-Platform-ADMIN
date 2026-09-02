import React, { useEffect, useRef, useState } from 'react';
import { X, Loader2, MessageSquare, ArrowDown } from 'lucide-react';
import type { ChatMessage } from '../../../../types';
import AdminMessageItem from './AdminMessageItem';

interface AdminThreadPanelProps {
  activeThread: ChatMessage;
  threadReplies: ChatMessage[];
  loadingThread: boolean;
  onClose: () => void;
}

export default function AdminThreadPanel({ activeThread, threadReplies, loadingThread, onClose }: AdminThreadPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  useEffect(() => {
    if (!loadingThread && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [loadingThread, threadReplies.length]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) < 50;
    setShowScrollBottom(!isAtBottom && target.scrollHeight > target.clientHeight);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FFFFFF] dark:bg-[#181818] border-l border-[#EAEAEA] dark:border-white/[0.06] select-text">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-[#EAEAEA] dark:border-white/[0.06] bg-[#FFFFFF] dark:bg-[#202020] flex-shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-[#111111] dark:text-[#E8E8E7]">Thread</h2>
          <span className="text-xs font-medium bg-[#F0F0EE] dark:bg-white/[0.08] text-[#787774] dark:text-[#9B9A97] px-2 py-0.5 rounded-full">
            {threadReplies.length} replies
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-[#F0F0EE] dark:hover:bg-white/10 rounded-[6px] text-[#787774] dark:text-[#9B9A97] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Parent Message */}
      <div className="flex-shrink-0 border-b border-[#EAEAEA] dark:border-white/[0.06] bg-[#FFFFFF] dark:bg-[#202020]">
        <div className="py-2 pl-2">
          <AdminMessageItem
            message={activeThread}
            isSameUserAsPrevious={false}
            hideThreadBadge={true}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 py-3 px-4 flex-shrink-0 bg-[#FFFFFF] dark:bg-[#202020]">
        <span className="text-xs font-medium text-[#787774] dark:text-[#9B9A97] whitespace-nowrap">
          {threadReplies.length} replies
        </span>
        <div className="h-[1px] bg-[#EAEAEA] dark:bg-white/[0.06] flex-1"></div>
      </div>

      {/* Replies Area */}
      <div className="flex-1 min-h-0 relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto px-2 pb-4 scroll-smooth"
        >
          {loadingThread ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-[#ABABAB]" />
            </div>
          ) : threadReplies.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-[#787774] dark:text-[#9B9A97] gap-3">
              <div className="w-12 h-12 rounded-full bg-[#F0F0EE] dark:bg-white/5 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 opacity-40" />
              </div>
              <p className="text-sm font-medium">Chưa có phản hồi nào</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {threadReplies.map((msg, idx) => {
                const prevMsg = idx > 0 ? threadReplies[idx - 1] : null;
                let isGroupStart = true;

                if (prevMsg && !prevMsg.isDeleted && !msg.isDeleted) {
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
                    hideThreadBadge={true}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Scroll to bottom button */}
        {showScrollBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-white dark:bg-[#202020] border border-[#EAEAEA] dark:border-white/[0.06] rounded-full flex items-center justify-center shadow-lg hover:bg-[#F0F0EE] dark:hover:bg-white/5 transition-colors z-10"
          >
            <ArrowDown className="w-4 h-4 text-[#787774] dark:text-[#9B9A97]" />
          </button>
        )}
      </div>
    </div>
  );
}
