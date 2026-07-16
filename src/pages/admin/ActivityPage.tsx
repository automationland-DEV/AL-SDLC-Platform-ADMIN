import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, RefreshCw } from 'lucide-react';
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
        {/* Left Sidebar: User List */}
        <ActivitySidebar selectedUserId={selectedUserId} onUserSelect={handleUserSelect} />

        {/* Right Column: Activity Logs */}
        <div className="col-span-1 md:col-span-3 flex flex-col h-[calc(100vh-7rem)] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Nhật ký hoạt động {selectedUserId !== 'all' && '- Chi tiết User'}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant={showFilters ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-1" />
                Bộ lọc
                {hasActiveFilters && (
                  <span className="ml-1 w-2 h-2 bg-primary-600 rounded-full" />
                )}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleSearch}>
                <RefreshCw className={`w-4 h-4 mr-1 ${logsLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </div>
          </div>

          {/* Stats Section */}
          <ActivityStats selectedUserId={selectedUserId} />

          {/* Filters Panel */}
          {showFilters && (
            <ActivityFilters 
              onSearch={handleSearch} 
              onReset={handleReset} 
              hasActiveFilters={hasActiveFilters} 
            />
          )}

          {/* Activity List */}
          <ActivityList selectedUserId={selectedUserId} />
        </div>
      </div>
    </div>
  );
}
