import { Search, X } from 'lucide-react';
import { Button, Select, DatePicker } from '../../../../components/ui';
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
          <Select
            value={filters.type}
            onChange={(val) => handleFilterChange('type', val)}
            options={[
              { value: '', label: 'Tất cả' },
              { value: 'LOGIN_SUCCESS', label: 'Đăng nhập thành công' },
              { value: 'LOGIN_FAILED', label: 'Đăng nhập thất bại' },
              { value: 'LOGOUT', label: 'Đăng xuất' },
              { value: 'UNAUTHORIZED_ACCESS', label: 'Truy cập trái phép' },
              { value: 'TASK_VIEWED', label: 'Xem task' },
              { value: 'TASK_CREATE_SUCCESS', label: 'Tạo task' },
              { value: 'TASK_UPDATE_SUCCESS', label: 'Cập nhật task' },
              { value: 'TASK_DELETE_SUCCESS', label: 'Xóa task' }
            ]}
            className="w-full text-sm"
          />
        </div>
        <div className="w-full sm:w-32">
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Mức độ</label>
          <Select
            value={filters.severity}
            onChange={(val) => handleFilterChange('severity', val)}
            options={[
              { value: '', label: 'Tất cả' },
              { value: 'INFO', label: 'Info' },
              { value: 'WARN', label: 'Warning' },
              { value: 'CRITICAL', label: 'Critical' }
            ]}
            className="w-full text-sm"
          />
        </div>
        <div className="w-full sm:w-40">
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Từ ngày</label>
          <DatePicker
            value={filters.startDate}
            onChange={(val) => handleFilterChange('startDate', val)}
            className="w-full text-sm"
          />
        </div>
        <div className="w-full sm:w-40">
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Đến ngày</label>
          <DatePicker
            value={filters.endDate}
            onChange={(val) => handleFilterChange('endDate', val)}
            className="w-full text-sm"
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
