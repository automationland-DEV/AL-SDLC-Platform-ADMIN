import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, RefreshCw, Users, ChevronDown } from 'lucide-react';
import { Button } from '../../components/ui';
import { useActivityStore } from '../../stores';

import {
  ActivitySidebar,
  ActivityStats,
  ActivityFilters,
  ActivityList
} from './components/activity';

export default function ActivityPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedUserId = searchParams.get('userId') || 'all';

  const {
    filters,
    setFilters,
    resetFilters,
    fetchLogs,
    fetchStats,
    isLoading: logsLoading,
  } = useActivityStore();

  const [showFilters, setShowFilters] = useState(false);
  const [showMobileUsers, setShowMobileUsers] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (selectedUserId === 'all') {
      setFilters({ userId: '' });
    } else {
      setFilters({ userId: selectedUserId });
    }
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId, fetchLogs]);

  const handleSearch = () => {
    fetchLogs(1);
    if (selectedUserId === 'all') fetchStats();
  };

  const handleReset = () => {
    resetFilters();
    if (selectedUserId !== 'all') {
      setFilters({ userId: selectedUserId });
    }
    fetchLogs(1);
    if (selectedUserId === 'all') fetchStats();
  };

  const handleUserSelect = (id: string) => {
    if (id === 'all') {
      searchParams.delete('userId');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ userId: id });
    }
  };

  const hasActiveFilters = Object.entries(filters).some(([k, v]) => k !== 'userId' && v !== '');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Mobile User List Toggle */}
        <div className="md:hidden relative z-30">
          <Button 
            variant="secondary" 
            className="w-full justify-between"
            onClick={() => setShowMobileUsers(!showMobileUsers)}
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {selectedUserId === 'all' ? 'Tất cả hệ thống' : 'Đang chọn 1 User'}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showMobileUsers ? 'rotate-180' : ''}`} />
          </Button>

          {/* Mobile Sidebar Dropdown */}
          <div className={`${showMobileUsers ? 'absolute top-full left-0 right-0 mt-2 shadow-2xl rounded-xl border border-[var(--border-color)] overflow-hidden bg-[var(--card-bg)]' : 'hidden'}`}>
            <ActivitySidebar selectedUserId={selectedUserId} onUserSelect={(id) => {
               handleUserSelect(id);
               setShowMobileUsers(false);
            }} />
          </div>
        </div>

        {/* Desktop Sidebar: User List */}
        <div className="hidden md:block col-span-1">
          <ActivitySidebar selectedUserId={selectedUserId} onUserSelect={(id) => {
             handleUserSelect(id);
             setShowMobileUsers(false);
          }} />
        </div>

        {/* Right Column: Activity Logs */}
        <div className="col-span-1 md:col-span-3 flex flex-col h-[calc(100vh-11rem)] md:h-[calc(100vh-7rem)] space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 relative z-20">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Nhật ký hoạt động {selectedUserId !== 'all' && '- Chi tiết User'}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant={showFilters ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="relative pr-6"
              >
                <Filter className="w-4 h-4 mr-1" />
                Bộ lọc
                <span className={`absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary-600 dark:bg-primary-400 rounded-full transition-all duration-200 ${hasActiveFilters ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
              </Button>
              <Button variant="secondary" size="sm" onClick={handleSearch}>
                <RefreshCw className={`w-4 h-4 mr-1 ${logsLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </div>

            {/* Mobile Filters Dropdown */}
            {showFilters && (
              <div className="absolute top-full left-0 right-0 mt-4 shadow-2xl rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] md:hidden">
                <ActivityFilters 
                  onSearch={() => { handleSearch(); setShowFilters(false); }} 
                  onReset={handleReset} 
                  hasActiveFilters={hasActiveFilters} 
                />
              </div>
            )}
          </div>

          {/* Stats Section */}
          <div className="hidden md:block">
            <ActivityStats selectedUserId={selectedUserId} />
          </div>

          {/* Desktop Filters Panel */}
          {showFilters && (
            <div className="hidden md:block">
              <ActivityFilters 
                onSearch={handleSearch} 
                onReset={handleReset} 
                hasActiveFilters={hasActiveFilters} 
              />
            </div>
          )}

          {/* Activity List */}
          <ActivityList selectedUserId={selectedUserId} />
        </div>
      </div>
    </div>
  );
}
