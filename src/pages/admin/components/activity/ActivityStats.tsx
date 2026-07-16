import { Activity, Clock, AlertTriangle, Info } from 'lucide-react';
import { useActivityStore } from '../../../../stores';

interface ActivityStatsProps {
  selectedUserId: string;
}

export function ActivityStats({ selectedUserId }: ActivityStatsProps) {
  const { stats, total, logs } = useActivityStore();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (selectedUserId === 'all' && stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] px-3 py-1.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-900/30">
              <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Tổng sự kiện</p>
              <p className="text-base font-bold text-[var(--text-primary)]">{stats.total.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] px-3 py-1.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-green-50 dark:bg-green-900/30">
              <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">24 giờ qua</p>
              <p className="text-base font-bold text-[var(--text-primary)]">{stats.recentCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] px-3 py-1.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-yellow-50 dark:bg-yellow-900/30">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Cảnh báo</p>
              <p className="text-base font-bold text-[var(--text-primary)]">
                {(stats.bySeverity['WARN'] || 0) + (stats.bySeverity['CRITICAL'] || 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] px-3 py-1.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-900/30">
              <Info className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Loại sự kiện</p>
              <p className="text-base font-bold text-[var(--text-primary)]">{Object.keys(stats.byType).length}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedUserId !== 'all') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] px-3 py-1.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-900/30">
              <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Sự kiện đã lọc</p>
              <p className="text-base font-bold text-[var(--text-primary)]">{total.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] px-3 py-1.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-green-50 dark:bg-green-900/30">
              <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Hoạt động mới nhất</p>
              <p className="text-sm font-bold text-[var(--text-primary)] mt-1">
                {logs.length > 0 ? formatDate(logs[0].createdAt) : 'Chưa có'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
