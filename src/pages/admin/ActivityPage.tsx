import { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  LogIn,
  LogOut,
  AlertTriangle,
  Info,
  Shield,
  Clock,
  User,
  MapPin,
  X,
  Activity,
} from 'lucide-react';
import { Button, Card, Badge } from '../../components/ui';
import { useActivityStore } from '../../stores';

const EVENT_LABELS: Record<string, string> = {
  LOGIN_SUCCESS: 'Đăng nhập thành công',
  LOGIN_FAILED: 'Đăng nhập thất bại',
  LOGOUT: 'Đăng xuất',
  REGISTER_SUCCESS: 'Đăng ký thành công',
  REGISTER_FAILED: 'Đăng ký thất bại',
  REFRESH_SUCCESS: 'Làm mới token thành công',
  REFRESH_FAILED: 'Làm mới token thất bại',
  TOKEN_FAMILY_REVOKED: 'Token bị thu hồi',
  UNAUTHORIZED_ACCESS: 'Truy cập trái phép',
  TASK_VIEWED: 'Xem task',
  TASK_CREATE_SUCCESS: 'Tạo task thành công',
  TASK_UPDATE_SUCCESS: 'Cập nhật task thành công',
  TASK_DELETE_SUCCESS: 'Xóa task thành công',
};

const SEVERITY_CONFIG = {
  INFO: { icon: Info, bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', badge: 'info' as const },
  WARN: { icon: AlertTriangle, bg: 'bg-yellow-50 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', badge: 'warning' as const },
  CRITICAL: { icon: Shield, bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', badge: 'danger' as const },
};

export default function ActivityPage() {
  const {
    logs,
    stats,
    total,
    page,
    totalPages,
    isLoading,
    filters,
    setFilters,
    resetFilters,
    fetchLogs,
    fetchStats,
  } = useActivityStore();

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchLogs(1);
    fetchStats();
  }, [fetchLogs, fetchStats]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters({ [key]: value });
  };

  const handleSearch = () => {
    fetchLogs(1);
    fetchStats();
  };

  const handlePageChange = (newPage: number) => {
    fetchLogs(newPage);
  };

  const handleReset = () => {
    resetFilters();
    fetchLogs(1);
    fetchStats();
  };

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

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Nhật ký hoạt động</h2>
          <p className="text-[var(--text-secondary)] mt-1">Theo dõi tất cả hoạt động của users trong hệ thống</p>
        </div>
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
          <Button variant="secondary" size="sm" onClick={() => { fetchLogs(1); fetchStats(); }}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Tổng sự kiện</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">{stats.total.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30">
                <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">24 giờ qua</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">{stats.recentCount}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/30">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Cảnh báo</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">
                  {(stats.bySeverity['WARN'] || 0) + (stats.bySeverity['CRITICAL'] || 0)}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30">
                <Info className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Loại sự kiện</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">{Object.keys(stats.byType).length}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <Card className="!p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--text-primary)]">Bộ lọc nâng cao</h3>
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Xóa bộ lọc
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">User ID</label>
              <input
                type="text"
                placeholder="User ID..."
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Loại sự kiện</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
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
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Mức độ</label>
              <select
                value={filters.severity}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
              >
                <option value="">Tất cả</option>
                <option value="INFO">Info</option>
                <option value="WARN">Warning</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">IP Address</label>
              <input
                type="text"
                placeholder="IP..."
                value={filters.ip}
                onChange={(e) => handleFilterChange('ip', e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Từ ngày</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Đến ngày</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--input-bg)] text-[var(--text-primary)]"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSearch} size="sm">
              <Search className="w-4 h-4 mr-1" />
              Áp dụng bộ lọc
            </Button>
          </div>
        </Card>
      )}

      {/* Activity List */}
      <Card>
        <div className="px-6 py-4 border-b border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[var(--text-primary)]">
              Lịch sử hoạt động
              <span className="ml-2 text-sm font-normal text-[var(--text-secondary)]">
                ({total.toLocaleString()} sự kiện)
              </span>
            </h3>
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <span>Trang {page} / {totalPages}</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <Activity className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
            <p className="text-[var(--text-secondary)]">Không có hoạt động nào được ghi nhận</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">Thử thay đổi bộ lọc hoặc quay lại sau</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-color)]">
            {logs.map((log) => {
              const severity = SEVERITY_CONFIG[log.severity] || SEVERITY_CONFIG['INFO'];
              const SeverityIcon = severity.icon;
              const eventLabel = EVENT_LABELS[log.type] || log.type;
              const isAuthEvent = log.type.includes('LOGIN') || log.type.includes('LOGOUT') || log.type.includes('REGISTER');

              return (
                <div
                  key={log._id}
                  className="px-6 py-4 hover:bg-[var(--hover-bg)] transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-2 rounded-full ${severity.bg} flex-shrink-0`}>
                      <SeverityIcon className={`w-4 h-4 ${severity.text}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-[var(--text-primary)]">{eventLabel}</h4>
                        <Badge variant={severity.badge}>{log.severity}</Badge>
                        {isAuthEvent && (
                          <Badge variant="default">
                            {log.type.includes('SUCCESS') || log.type === 'LOGOUT' ? (
                              <LogIn className="w-3 h-3 mr-1" />
                            ) : (
                              <LogOut className="w-3 h-3 mr-1" />
                            )}
                            Auth
                          </Badge>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--text-secondary)]">
                        {log.email && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">{log.email}</span>
                          </div>
                        )}
                        {log.userId && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs">ID: {log.userId.slice(-8)}</span>
                          </div>
                        )}
                        {log.ip && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{log.ip}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(log.createdAt)}</span>
                        </div>
                      </div>

                      {/* Extra metadata */}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-2 px-3 py-2 bg-[var(--bg-tertiary)] rounded-lg text-xs text-[var(--text-secondary)] font-mono">
                          {JSON.stringify(log.metadata, null, 0)}
                        </div>
                      )}
                    </div>

                    {/* Type badge */}
                    <div className="flex-shrink-0">
                      <span className="text-xs text-[var(--text-muted)] font-mono">
                        {log.type.length > 20 ? log.type.slice(0, 20) + '...' : log.type}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-color)]">
            <p className="text-sm text-[var(--text-secondary)]">
              Hiển thị {(page - 1) * 20 + 1} - {Math.min(page * 20, total)} của {total}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                Trước
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        page === pageNum
                          ? 'bg-primary-600 text-white'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
