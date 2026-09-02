import { renderMessageContent } from '../utils/messageContentRenderer';
import { UserPlus, UserMinus } from 'lucide-react';

interface SystemMessageProps {
  message: unknown;
  sender: unknown;
  displayName: string;
  initialLetter: string;
  currentUserId?: string;
}

export default function SystemMessage({
  message,
  sender,
  displayName,
  initialLetter,
  currentUserId,
}: SystemMessageProps) {
  const msg = message as { _id: string; action?: string; content?: string; createdAt?: string | Date };
  const snd = sender as { avatar?: string; fullName?: string };
  const action = msg.action;

  if (action === 'added_members' || action === 'removed_members' || action === 'left_channel') {
    const isAdded = action === 'added_members';
    const isLeft = action === 'left_channel';
    const hasContent = Boolean(msg.content);

    return (
      <div className="flex items-center justify-center my-4 px-4">
        <div className="bg-[#F0F0EE] dark:bg-white/[0.03] text-[#787774] dark:text-[#9B9A97] px-3 py-1.5 rounded-full text-xs flex items-center gap-2">
          {isAdded ? <UserPlus className="w-3.5 h-3.5" /> : <UserMinus className="w-3.5 h-3.5" />}
          <span>
            <strong className="font-medium text-[#111111] dark:text-[#E8E8E7]">{snd.fullName || displayName}</strong>{' '}
            {isLeft ? 'left the channel' : (isAdded ? 'added' : 'removed')}{' '}
            {hasContent && <span className="font-medium text-[#111111] dark:text-[#E8E8E7]">{msg.content}</span>}
          </span>
          <span className="text-[#ABABAB] dark:text-[#6B6B6B] ml-1">
            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
      </div>
    );
  }

  const msgContent = msg.content;
  return (
    <div 
      id={`msg-${msg._id}`}
      className="flex items-center justify-center w-full my-4 px-4 gap-4 select-none"
    >
      <div className="flex-1 h-px bg-[#EAEAEA] dark:bg-white/[0.06]"></div>
      <div className="flex items-start gap-2 max-w-[70%] sm:max-w-[60%]">
        <div className="mt-0.5 sm:mt-0 shrink-0">
          {snd.avatar ? (
            <img src={snd.avatar} alt={displayName} className="w-4 h-4 rounded-full object-cover" />
          ) : (
            <div className="w-4 h-4 rounded-full bg-[#2563EB] flex items-center justify-center text-[9px] text-white font-bold">
              {initialLetter}
            </div>
          )}
        </div>
        <div className="flex-1 break-words leading-snug sm:leading-normal chat-message-content">
          <strong className="font-medium text-[#111111] dark:text-[#E8E8E7]">{displayName}</strong>{' '}
          {renderMessageContent(msgContent || '', currentUserId)}
          <span className="inline-block text-[#ABABAB] dark:text-[#6B6B6B] ml-1.5 text-[0.65rem] sm:text-[0.6875rem] font-normal whitespace-nowrap">
            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
      </div>
      <div className="flex-1 h-px bg-[#EAEAEA] dark:bg-white/[0.06]"></div>
    </div>
  );
}
