import { useState, useRef, useEffect } from 'react';
import { Bell, UserPlus, AlertTriangle, Check, Trash2, X } from 'lucide-react';
import { useAdminNotificationStore, type AdminNotification } from '../stores/adminNotificationStore';
import { useNavigate } from 'react-router-dom';
import { useAdminSocket } from '../hooks/useAdminSocket';

function timeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} ngày trước`;
}

export default function AdminNotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useAdminSocket();

  const { notifications, unreadCount, markRead, markAllRead, clearAll } =
    useAdminNotificationStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notif: AdminNotification) => {
    markRead(notif.id);
    if (notif.type === 'user_registered') {
      navigate('/users');
      setIsOpen(false);
    }
  };

  const getIcon = (type: AdminNotification['type']) => {
    switch (type) {
      case 'user_registered':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'critical_error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  const getAccentClass = (type: AdminNotification['type']) => {
    switch (type) {
      case 'user_registered':
        return 'border-l-green-500';
      case 'critical_error':
        return 'border-l-red-500';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors group"
      >
        <Bell className="w-5 h-5 text-[var(--text-secondary)]" />

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[480px] bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-xl overflow-hidden z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[var(--text-secondary)]" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Thông báo
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllRead}
                    className="p-1.5 rounded-md hover:bg-[var(--hover-bg)] transition-colors text-[var(--text-muted)] hover:text-green-600"
                    title="Đánh dấu tất cả đã đọc"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={clearAll}
                    className="p-1.5 rounded-md hover:bg-[var(--hover-bg)] transition-colors text-[var(--text-muted)] hover:text-red-600"
                    title="Xóa tất cả"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md hover:bg-[var(--hover-bg)] transition-colors text-[var(--text-muted)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)]">
                <Bell className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm">Chưa có thông báo nào</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-color)]">
                {notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full text-left px-4 py-3 hover:bg-[var(--hover-bg)] transition-colors border-l-[3px] ${getAccentClass(notif.type)} ${
                      !notif.isRead ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm ${!notif.isRead ? 'font-semibold' : 'font-medium'} text-[var(--text-primary)] truncate`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-1">
                          {timeAgo(notif.timestamp)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
