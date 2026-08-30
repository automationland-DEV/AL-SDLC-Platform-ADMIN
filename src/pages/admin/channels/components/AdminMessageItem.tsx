import React, { useState, useRef } from 'react';
import { useAdminChatStore } from '../../../../stores/adminChatStore';
import type { ChatMessage } from '../ChatViewerPage';

import SystemMessage from './SystemMessage';
import AdminMessageContent from './AdminMessageContent';
import AdminMessageAttachments from './AdminMessageAttachments';
import MediaLightbox from './MediaLightbox';

import { getMessagePreviewText } from '../utils/messageContentRenderer';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

interface AdminMessageItemProps {
  message: ChatMessage;
  isSameUserAsPrevious: boolean;
  hideThreadBadge?: boolean;
}

export default function AdminMessageItem({
  message,
  isSameUserAsPrevious,
  hideThreadBadge = false,
}: AdminMessageItemProps) {
  const sender = (message.senderId && typeof message.senderId === 'object')
    ? message.senderId
    : { _id: String(message.senderId || ''), fullName: 'Deleted User', email: '' };
    
  const displayName = sender.fullName || sender.email || 'Deleted User';
  const initialLetter = displayName.charAt(0).toUpperCase();
  const isDeleted = Boolean(message.isDeleted);

  const setActiveThreadParentId = useAdminChatStore(state => state.setActiveThreadParentId);
  const setScrollTargetId = useAdminChatStore(state => state.setScrollTargetId);

  const [lightboxFile, setLightboxFile] = useState<unknown | null>(null);

  const messageRef = useRef<HTMLDivElement>(null);

  // Attachment dummy states since Admin won't download or show preview progress
  const isDownloading = null;
  const expandedPreviews: Record<string, boolean> = {};
  const loadingPreviews: Record<string, boolean> = {};
  const handleDownloadFile = () => {};
  const togglePreview = () => {};

  // Reply calculation
  const replyParent = message.replyToId && typeof message.replyToId === 'object'
    ? message.replyToId
    : null;

  const replySender = (replyParent?.senderId && typeof replyParent.senderId === 'object')
    ? replyParent.senderId
    : null;
  const replyDisplayName = replySender
    ? (replySender.fullName || replySender.email || 'Deleted User')
    : 'Deleted User';

  const spacingClasses = !isSameUserAsPrevious
    ? 'mt-3 pt-1.5 pb-1.5'
    : 'mt-1 pt-0.5 pb-1';

  // Branch 1: System Message
  if (message.type === 'system') {
    return (
      <SystemMessage
        message={message}
        sender={sender}
        displayName={displayName}
        initialLetter={initialLetter}
      />
    );
  }

  // Branch 2: Standard User Message
  return (
    <div
      ref={messageRef}
      id={`msg-${message._id}`}
      className={cn(
        "group relative flex gap-4 transition-all flex-row mx-2 rounded-lg hover:z-10",
        "hover:bg-[#F7F6F3] dark:hover:bg-white/5 border-l-[3px] border-transparent pl-[13px] pr-4",
        spacingClasses
      )}
    >
      {/* Avatar column */}
      <div className="w-10 flex-shrink-0 flex justify-center mt-0.5">
        {!isSameUserAsPrevious ? (
          <div>
            <img 
              src={sender.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`}
              alt="avatar"
              className="w-10 h-10 rounded-full flex-shrink-0 object-cover shadow-sm"
            />
          </div>
        ) : (
          <div className="w-10 text-[0.625rem] text-[#ABABAB] dark:text-[#6B6B6B] opacity-0 group-hover:opacity-100 flex items-center justify-center h-full">
            {new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      {/* Content column */}
      <div className="flex flex-col flex-1 min-w-0 items-start max-w-full overflow-hidden">
        {replyParent && (
          <div
            className="flex items-center gap-1.5 mb-1 cursor-pointer group/reply"
            onClick={(e) => {
              e.stopPropagation();
              const targetId = replyParent._id;
              setScrollTargetId(targetId);
            }}
          >
            <div className="w-4 flex items-center justify-end h-full">
              <div className="w-3 h-3 rounded-tl-lg border-t-2 border-l-2 border-[#E5E5E5] dark:border-[#404040]" />
            </div>
            <span className="font-bold hover:underline text-[11px] text-[#787774] dark:text-[#9B9A97]">
              @{replyDisplayName}
            </span>
            <span className="truncate opacity-80 flex-1 text-left text-[11px] text-[#787774]">
              {getMessagePreviewText(replyParent)}
            </span>
          </div>
        )}
        {!isSameUserAsPrevious && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="text-[0.875rem] font-semibold text-[#111111] dark:text-[#E8E8E7]">
              {displayName}
            </span>
            <span className="text-[0.6875rem] text-[#787774] dark:text-[#9B9A97]">
              {new Date(message.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        <AdminMessageContent
          message={message}
          isDeleted={isDeleted}
        />

        {/* Attachments List */}
        <AdminMessageAttachments
          attachments={message.attachments}
          isDeleted={isDeleted}
          isDownloading={isDownloading}
          expandedPreviews={expandedPreviews}
          loadingPreviews={loadingPreviews}
          onDownloadFile={handleDownloadFile}
          onTogglePreview={togglePreview}
          onOpenLightbox={(file) => setLightboxFile(file)}
        />

        {/* Reaction badges */}
        {!isDeleted && message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1 justify-start">
            {Object.entries(message.reactions).map(([emoji, userIds]: [string, unknown]) => (
              <div
                key={emoji}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] border border-transparent bg-[#F0F0EE] dark:bg-white/[0.08] text-[#787774] dark:text-[#9B9A97]"
              >
                <span className="text-sm">{emoji}</span>
                <span className="text-[10px] font-bold text-[#787774] dark:text-[#9B9A97]">
                  {Array.isArray(userIds) ? userIds.length : 0}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Thread replies badge */}
        {!isDeleted && !hideThreadBadge && message.replyCount && message.replyCount > 0 ? (
          <button
            onClick={() => setActiveThreadParentId(message._id)}
            className="mt-2 flex items-center gap-2 hover:bg-[#F0F0EE] dark:hover:bg-white/5 px-2.5 py-1 rounded-[6px] transition-colors border border-[#EAEAEA] dark:border-white/[0.06] text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] cursor-pointer"
          >
            <div className="flex -space-x-1.5 overflow-hidden">
              {message.lastReplyParticipants?.filter(Boolean).map((p: unknown, idx: number) => {
                const participant = p as { fullName?: string; avatar?: string };
                return (
                <div
                  key={idx}
                  className="inline-block h-5 w-5 rounded-full ring-2 ring-white dark:ring-[#202020] bg-[#2563EB] flex-shrink-0 relative"
                  title={p.fullName}
                >
                  <img 
                    src={participant.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(participant.fullName || 'U')}&background=random`} 
                    alt="avatar" 
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              )})}
            </div>
            <span>
              {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
            </span>
            <span className="text-[#ABABAB] dark:text-[#6B6B6B] text-[10px] font-normal">
              Last reply {message.lastReplyAt ? new Date(message.lastReplyAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </button>
        ) : null}
      </div>

      {/* Lightbox Preview Modal */}
      <MediaLightbox
        file={lightboxFile}
        isDownloading={false}
        onDownload={() => {}}
        onClose={() => setLightboxFile(null)}
      />
    </div>
  );
}
