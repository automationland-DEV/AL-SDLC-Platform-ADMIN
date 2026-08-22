import { useState, useEffect, useMemo } from 'react';
import { Search, Globe } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '../../../../services';
import { useTranslation } from '../../../../i18n/useTranslation';
import type { User } from '../../../../types';

interface ActivitySidebarProps {
  selectedUserId: string;
  onUserSelect: (id: string) => void;
}

export function ActivitySidebar({ selectedUserId, onUserSelect }: ActivitySidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { language } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: rawUsers, isLoading } = useQuery({
    queryKey: ['users', 'sidebar-all'],
    queryFn: () => userService.getAllUsers({ limit: 1000 }),
    staleTime: 1000 * 60 * 5,
  });

  const users: User[] = useMemo(() => {
    if (Array.isArray(rawUsers)) return rawUsers as User[];
    if (rawUsers && typeof rawUsers === 'object') {
      const resObj = rawUsers as unknown as Record<string, unknown>;
      return (resObj.data || resObj.users || resObj.items || resObj.results || []) as User[];
    }
    return [];
  }, [rawUsers]);

  const filteredUsers = useMemo(() => {
    if (!debouncedSearch) return users;
    const lowerSearch = debouncedSearch.toLowerCase();
    return users.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(lowerSearch) ||
        u.email?.toLowerCase().includes(lowerSearch)
    );
  }, [users, debouncedSearch]);

  return (
    <div className="md:sticky md:top-6 space-y-4 font-sans">
      <div className="bg-[var(--bg-card)] rounded-xl shadow-xs border border-[var(--border-color)] flex flex-col h-[400px] md:h-[calc(100vh-7rem)] overflow-hidden">
        <div className="p-3.5 border-b border-[var(--border-color)]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
            {language === 'vi' ? 'Lọc theo Tài khoản' : 'Filter by User'}
          </h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder={language === 'vi' ? 'Tìm tên, email...' : 'Search name, email...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-[var(--border-color)] rounded-lg text-xs focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 bg-[var(--bg-input)] text-[var(--text-primary)] font-mono-code transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
          <button
            onClick={() => onUserSelect('all')}
            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-all duration-180 cursor-pointer ${
              selectedUserId === 'all'
                ? 'bg-sky-500/10 border-l-3 border-sky-500 text-sky-600 dark:text-sky-400 font-bold'
                : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
            }`}
          >
            <div className="w-7 h-7 rounded-md bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-500 shrink-0">
              <Globe size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">
                {language === 'vi' ? 'Tất cả hệ thống' : 'All System Logs'}
              </p>
              <p className="text-[10px] font-mono-code text-[var(--text-muted)] truncate">
                {language === 'vi' ? 'Xem toàn bộ logs' : 'View all logs'}
              </p>
            </div>
          </button>

          {isLoading ? (
            <div className="p-4 text-center text-xs text-[var(--text-muted)] font-mono-code">
              {language === 'vi' ? 'Đang tải...' : 'Loading...'}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-xs text-[var(--text-muted)]">
              {language === 'vi' ? 'Không tìm thấy user phù hợp' : 'No matching users found'}
            </div>
          ) : (
            filteredUsers.map((u) => {
              const uid = u.id || (u as { _id?: string })._id || '';
              const isSelected = selectedUserId === uid;
              const fallbackId = uid ? uid.toString() : '0000';
              const displayName = u.fullName || `User #${fallbackId.slice(-4)}`;

              return (
                <button
                  key={uid}
                  onClick={() => onUserSelect(uid)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-all duration-180 cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500/10 border-l-3 border-sky-500 text-sky-600 dark:text-sky-400 font-bold'
                      : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
                  }`}
                >
                  {u.avatar ? (
                    <img src={u.avatar} alt={displayName} className="w-7 h-7 rounded-md object-cover border border-[var(--border-color)] shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-md bg-sky-500/10 border border-sky-500/30 flex items-center justify-center font-mono-code font-bold text-[10px] text-sky-500 shrink-0">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{displayName}</p>
                    <p className="text-[10px] font-mono-code text-[var(--text-muted)] truncate">{u.email}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
