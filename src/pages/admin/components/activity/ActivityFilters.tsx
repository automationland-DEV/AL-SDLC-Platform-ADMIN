import { Search, X } from 'lucide-react';
import { Button } from '../../../../components/ui';
import { useActivityStore } from '../../../../stores';

interface ActivityFiltersProps {
  onSearch: () => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export function ActivityFilters({ onSearch, onReset, hasActiveFilters }: ActivityFiltersProps) {
  const { filters, setFilters } = useActivityStore();

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters({ [key]: value });
  };

  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-[var(--text-primary)]">Bộ lọc nâng cao</h3>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Xóa bộ lọc
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-full sm:w-48">
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Loại sự kiện</label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="w-full px-3 py-1.5 border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
          >
            <option value="">Tất cả</option>
            <option value="LOGIN_SUCCESS">Đăng nhập thành công</option>
            <option value="LOGIN_FAILED">Đăng nhập thất bại</option>
            <option value="LOGOUT">Đăng xuất</option>
            <option value="UNAUTHORIZED_ACCESS">Truy cập trái phép</option>
            <option value="TASK_VIEWED">Xem task</option>
            <option value="TASK_CREATE_SUCCESS">Tạo task</option>
            <option value="TASK_UPDATE_SUCCESS">Cập nhật task</option>
            <option value="TASK_DELETE_SUCCESS">Xóa task</option>
          </select>
        </div>
        <div className="w-full sm:w-32">
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Mức độ</label>
          <select
            value={filters.severity}
            onChange={(e) => handleFilterChange('severity', e.target.value)}
            className="w-full px-3 py-1.5 border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
          >
            <option value="">Tất cả</option>
            <option value="INFO">Info</option>
            <option value="WARN">Warning</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
        <div className="w-full sm:w-40">
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Từ ngày</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="w-full px-3 py-1.5 border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
          />
        </div>
        <div className="w-full sm:w-40">
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Đến ngày</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="w-full px-3 py-1.5 border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
          />
        </div>
        <div className="flex-shrink-0 w-full sm:w-auto">
          <Button onClick={onSearch} size="sm" className="w-full h-[34px]">
            <Search className="w-4 h-4 mr-1" />
            Áp dụng
          </Button>
        </div>
      </div>
    </div>
  );
}
