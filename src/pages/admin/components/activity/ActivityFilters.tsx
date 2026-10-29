import { Search, X, ShieldAlert } from 'lucide-react';
import { Button, Select, DatePicker } from '../../../../components/ui';
import { useActivityStore } from '../../../../stores';
import { useTranslation } from '../../../../i18n/useTranslation';

interface ActivityFiltersProps {
  onSearch: () => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export function ActivityFilters({ onSearch, onReset, hasActiveFilters }: ActivityFiltersProps) {
  const { filters, setFilters } = useActivityStore();
  const { language } = useTranslation();

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters({ [key]: value });
  };

  // "Violations only" shows the events that are kept long-term (WARN + CRITICAL).
  const violationsOnly = filters.severity === 'WARN,CRITICAL';

  const handleViolationsOnly = () => {
    setFilters({ severity: violationsOnly ? '' : 'WARN,CRITICAL' });
  };

  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-[var(--text-primary)]">
          {language === 'vi' ? 'Bộ lọc nâng cao' : 'Advanced Filters'}
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3 h-3" />
            {language === 'vi' ? 'Xóa bộ lọc' : 'Clear filters'}
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-full sm:w-48">
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            {language === 'vi' ? 'Loại sự kiện' : 'Event Type'}
          </label>
          <Select
            value={filters.type}
            onChange={(val) => handleFilterChange('type', val)}
            options={[
              { value: '', label: language === 'vi' ? 'Tất cả' : 'All' },
              { value: 'LOGIN_SUCCESS', label: language === 'vi' ? 'Đăng nhập thành công' : 'Login success' },
              { value: 'LOGIN_FAILED', label: language === 'vi' ? 'Đăng nhập thất bại' : 'Login failed' },
              { value: 'LOGOUT', label: language === 'vi' ? 'Đăng xuất' : 'Logout' },
              { value: 'UNAUTHORIZED_ACCESS', label: language === 'vi' ? 'Truy cập trái phép' : 'Unauthorized access' },
              { value: 'REFRESH_REUSED', label: language === 'vi' ? 'Tái sử dụng refresh token' : 'Refresh token reused' },
              { value: 'TOKEN_FAMILY_REVOKED', label: language === 'vi' ? 'Thu hồi token' : 'Token family revoked' },
              { value: 'RATE_LIMIT_HIT', label: language === 'vi' ? 'Vượt giới hạn truy cập' : 'Rate limit hit' },
              { value: 'PASSWORD_RESET_FAILED', label: language === 'vi' ? 'Đặt lại mật khẩu thất bại' : 'Password reset failed' },
              { value: 'TASK_VIEWED', label: language === 'vi' ? 'Xem task' : 'Task viewed' },
              { value: 'TASK_CREATE_SUCCESS', label: language === 'vi' ? 'Tạo task' : 'Task created' },
              { value: 'TASK_UPDATE_SUCCESS', label: language === 'vi' ? 'Cập nhật task' : 'Task updated' },
              { value: 'TASK_DELETE_SUCCESS', label: language === 'vi' ? 'Xóa task' : 'Task deleted' }
            ]}
            className="w-full text-sm"
          />
        </div>
        <div className="w-full sm:w-32">
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            {language === 'vi' ? 'Mức độ' : 'Severity'}
          </label>
          <Select
            value={violationsOnly ? 'VIOLATIONS' : filters.severity}
            onChange={(val) => handleFilterChange('severity', val === 'VIOLATIONS' ? 'WARN,CRITICAL' : val)}
            options={[
              { value: '', label: language === 'vi' ? 'Tất cả' : 'All' },
              { value: 'VIOLATIONS', label: language === 'vi' ? 'Chỉ vi phạm' : 'Violations only' },
              { value: 'INFO', label: 'Info' },
              { value: 'WARN', label: 'Warning' },
              { value: 'CRITICAL', label: 'Critical' }
            ]}
            className="w-full text-sm"
          />
        </div>
        <div className="w-full sm:w-40">
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            {language === 'vi' ? 'Từ ngày' : 'Start Date'}
          </label>
          <DatePicker
            value={filters.startDate}
            onChange={(val) => handleFilterChange('startDate', val)}
            className="w-full text-sm"
          />
        </div>
        <div className="w-full sm:w-40">
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            {language === 'vi' ? 'Đến ngày' : 'End Date'}
          </label>
          <DatePicker
            value={filters.endDate}
            onChange={(val) => handleFilterChange('endDate', val)}
            className="w-full text-sm"
          />
        </div>
        <div className="flex-shrink-0 w-full sm:w-auto">
          <Button onClick={onSearch} size="sm" className="w-full h-[34px]">
            <Search className="w-4 h-4 mr-1" />
            {language === 'vi' ? 'Áp dụng' : 'Apply'}
          </Button>
        </div>
      </div>
      <button
        onClick={handleViolationsOnly}
        className={`mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
          violationsOnly
            ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
            : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
        }`}
      >
        <ShieldAlert className="w-3.5 h-3.5" />
        {language === 'vi'
          ? 'Chỉ hiển thị hành vi trái phép (được lưu lâu dài)'
          : 'Show violations only (kept long-term)'}
      </button>
    </div>
  );
}
