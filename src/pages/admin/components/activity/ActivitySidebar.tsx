import { useState, useEffect, useMemo } from 'react';
import { Search, Globe } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '../../../../services';
import type { User } from '../../../../types';

interface ActivitySidebarProps {
  selectedUserId: string;
  onUserSelect: (id: string) => void;
}

export function ActivitySidebar({ selectedUserId, onUserSelect }: ActivitySidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // React Query cached user list — 5 min stale time
  const { data: rawUsers, isLoading } = useQuery({
    queryKey: ['users', 'sidebar-all'],
    queryFn: () => userService.getAllUsers({ limit: 1000 }),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const users: User[] = useMemo(() => {
    if (Array.isArray(rawUsers)) return rawUsers as User[];
    if (rawUsers && typeof rawUsers === 'object') {
      const resObj = rawUsers as Record<string, unknown>;
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
    <div className="md:sticky md:top-6 space-y-4">
      <div className="bg-[var(--card-bg)] rounded-xl shadow-sm border border-[var(--border-color)] flex flex-col h-[400px] md:h-[calc(100vh-7rem)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">Người dùng</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Tìm tên, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1 min-h-0">
          <button
            onClick={() => onUserSelect('all')}
            className={`w-full text-left px-3 py-3 rounded-lg flex items-center gap-3 transition-colors ${selectedUserId === 'all'
              ? 'bg-indigo-50 border-l-4 border-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-500'
              : 'hover:bg-[var(--hover-bg)] border-l-4 border-transparent'
              }`}
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Globe className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${selectedUserId === 'all' ? 'text-indigo-700 dark:text-indigo-400' : 'text-[var(--text-primary)]'}`}>
                Tất cả hệ thống
              </p>
              <p className="text-xs text-[var(--text-secondary)] truncate">Xem toàn bộ logs</p>
            </div>
          </button>

          {isLoading ? (
            <div className="p-4 text-center text-sm text-[var(--text-muted)]">Đang tải...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-sm text-[var(--text-muted)]">
              Không tìm thấy user phù hợp
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
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors ${isSelected
                    ? 'bg-indigo-50 border-l-4 border-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-500'
                    : 'hover:bg-[var(--hover-bg)] border-l-4 border-transparent'
                    }`}
                >
                  <div className="relative">
                    {u.avatar ? (
                      <img src={u.avatar} alt={displayName} className="w-8 h-8 rounded-full object-cover border border-[var(--border-color)]" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-medium text-xs text-[var(--text-secondary)] border border-[var(--border-color)]">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-indigo-700 dark:text-indigo-400' : 'text-[var(--text-primary)]'}`}>
                      {displayName}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] truncate">{u.email}</p>
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
