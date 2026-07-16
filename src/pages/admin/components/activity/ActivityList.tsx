import { LogIn, LogOut, AlertTriangle, Info, Shield, Clock, User as UserIcon, MapPin, Activity, RefreshCw } from 'lucide-react';
import { Badge, Button } from '../../../../components/ui';
import { useActivityStore } from '../../../../stores';

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

interface ActivityListProps {
  selectedUserId: string;
}

export function ActivityList({ selectedUserId }: ActivityListProps) {
  const { logs, total, page, totalPages, isLoading, fetchLogs } = useActivityStore();

  const handlePageChange = (newPage: number) => {
    fetchLogs(newPage);
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

  return (
    <div className="bg-[var(--card-bg)] rounded-xl shadow-sm border border-[var(--border-color)] flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border-color)]">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[var(--text-primary)]">
            Lịch sử hoạt động
            <span className="ml-2 text-sm font-normal text-[var(--text-secondary)]">
              ({total.toLocaleString()} sự kiện)
            </span>
          </h3>
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span>Trang {page} / {totalPages || 1}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
          <span className="text-sm text-[var(--text-secondary)]">Đang tải dữ liệu...</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16">
          <Activity className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">
            {selectedUserId === 'all' ? 'Không có hoạt động nào được ghi nhận' : 'Người dùng này chưa có hoạt động nào'}
          </p>
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
                className="px-6 py-2.5 hover:bg-[var(--hover-bg)] transition-colors"
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
                          <UserIcon className="w-3 h-3" />
                          <span className="truncate max-w-[200px]">{log.email}</span>
                        </div>
                      )}
                      {log.userId && selectedUserId === 'all' && (
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
                      <div className="mt-2 px-3 py-2 bg-[var(--bg-tertiary)] rounded-lg text-xs text-[var(--text-secondary)] font-mono overflow-x-auto">
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
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-2.5 border-t border-[var(--border-color)]">
          <p className="text-sm text-[var(--text-secondary)] hidden md:block">
            Hiển thị {(page - 1) * 20 + 1} - {Math.min(page * 20, total)} của {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1 || isLoading}
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
                    disabled={isLoading}
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
              disabled={page >= totalPages || isLoading}
              onClick={() => handlePageChange(page + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
