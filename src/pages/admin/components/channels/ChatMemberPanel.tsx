import { useState, useEffect, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { chatChannelService } from '../../../../services';
import type { User } from '../../../../types';

interface ChatMemberPanelProps {
  channelId: string;
  onClose: () => void;
}

const getRoleBadge = (role?: string, globalRole?: string) => {
  const r = (role || '').toLowerCase();
  const gr = (globalRole || '').toLowerCase();
  
  if (gr === 'super_admin' || gr === 'superadmin' || r === 'super_admin' || r === 'superadmin') {
    return (
      <span className="whitespace-nowrap inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold tracking-wider bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
        Super Admin
      </span>
    );
  }
  
  if (r === 'workspace_admin') {
    return (
      <span className="whitespace-nowrap inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold tracking-wider bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
        Workspace Admin
      </span>
    );
  }

  if (r === 'channel_admin') {
    return (
      <span className="whitespace-nowrap inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold tracking-wider bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
        Channel Admin
      </span>
    );
  }

  if (r === 'member' || r === 'channel_member') {
    return (
      <span className="whitespace-nowrap inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold tracking-wider bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        Member
      </span>
    );
  }

  return (
    <span className="whitespace-nowrap inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold tracking-wider bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
      User
    </span>
  );
};

export default function ChatMemberPanel({ channelId, onClose }: ChatMemberPanelProps) {
  const [members, setMembers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    chatChannelService.getMembers(channelId)
      .then(setMembers)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [channelId]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members;
    const lower = searchQuery.toLowerCase();
    return members.filter(m => 
      m.fullName?.toLowerCase().includes(lower) || 
      m.email?.toLowerCase().includes(lower)
    );
  }, [members, searchQuery]);

  return (
    <div className="w-80 border-l border-[var(--border-color)] bg-[var(--bg-primary)] flex flex-col h-full flex-shrink-0 animate-in slide-in-from-right-8 duration-300">
      <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-secondary)]">
        <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
          Members <span className="px-1.5 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[10px] text-[var(--text-muted)] font-medium">{members.length}</span>
        </h3>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-[var(--hover-bg)] rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 border-b border-[var(--border-color)]">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 flex justify-center">
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredMembers.length > 0 ? (
          <div className="py-2">
            {filteredMembers.map((member) => (
              <div 
                key={(member as { _id?: string })._id || member.id}
                className="flex items-center gap-3 px-4 py-2 hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.fullName || member.email} className="w-full h-full object-cover" />
                  ) : (
                    <span>{(member.fullName || member.email || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {member.fullName || member.email || 'User'}
                    </p>
                    {getRoleBadge((member as unknown as { role?: string }).role, member.role)}
                  </div>
                  {member.email && (
                    <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                      {member.email}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-[var(--text-muted)]">
            <p className="text-sm">Không tìm thấy thành viên</p>
          </div>
        )}
      </div>
    </div>
  );
}
