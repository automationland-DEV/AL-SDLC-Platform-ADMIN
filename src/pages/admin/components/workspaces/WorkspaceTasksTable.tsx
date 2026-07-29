import { useState } from 'react';
import { Search, Eye, Trash2, CheckCircle2, CircleDashed, ArrowRightCircle } from 'lucide-react';
import { Button, Badge, Table, TableRow, TableCell, ConfirmModal } from '../../../../components/ui';
import { useTranslation } from '../../../../i18n/useTranslation';
import { useWorkspaceTasksQuery, useDeleteTaskMutation } from '../../../../hooks/queries';
import toast from 'react-hot-toast';
import type { Task } from '../../../../types';

interface WorkspaceTasksTableProps {
  workspaceId: string;
}

const getStatusBadge = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes('done') || s.includes('completed')) {
    return <Badge variant="success" className="gap-1"><CheckCircle2 className="w-3 h-3" /> Done</Badge>;
  }
  if (s.includes('progress') || s.includes('doing')) {
    return <Badge variant="info" className="gap-1"><ArrowRightCircle className="w-3 h-3" /> In Progress</Badge>;
  }
  return <Badge variant="default" className="gap-1"><CircleDashed className="w-3 h-3" /> {status || 'To Do'}</Badge>;
};

const getPriorityBadge = (priority: string) => {
  const p = priority.toLowerCase();
  if (p === 'highest' || p === 'critical') return <Badge variant="danger" mono>{priority}</Badge>;
  if (p === 'high') return <Badge variant="warning" mono>{priority}</Badge>;
  if (p === 'low' || p === 'lowest') return <Badge variant="default" mono>{priority}</Badge>;
  return <Badge variant="secondary" mono>{priority}</Badge>;
};

export function WorkspaceTasksTable({ workspaceId }: WorkspaceTasksTableProps) {
  const { language } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  
  const { data, isLoading } = useWorkspaceTasksQuery(workspaceId, { 
    page, 
    limit: 10,
    search: searchTerm || undefined 
  });
  
  const deleteTaskMutation = useDeleteTaskMutation();
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    taskId: string;
    taskTitle: string;
  }>({
    isOpen: false,
    taskId: '',
    taskTitle: ''
  });

  const tasks = data?.tasks || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10) || 1;

  const handleDeleteClick = (task: Task) => {
    setConfirmModal({
      isOpen: true,
      taskId: task.id,
      taskTitle: task.title
    });
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteTaskMutation.mutateAsync({ workspaceId, taskId: confirmModal.taskId });
      toast.success(language === 'vi' ? 'Đã xoá task thành công' : 'Task deleted successfully');
    } catch (error) {
      toast.error(language === 'vi' ? 'Xoá task thất bại' : 'Failed to delete task');
    } finally {
      setConfirmModal({ isOpen: false, taskId: '', taskTitle: '' });
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-2.5">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder={language === 'vi' ? 'Tìm kiếm task...' : 'Search tasks...'}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-mono-code transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-sky-500 border-t-transparent"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 text-[var(--text-muted)] space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto stroke-1" />
            <p className="text-xs font-medium">
              {language === 'vi' ? 'Chưa có công việc nào' : 'No tasks found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table
              fixedLayout
              headers={[
                { label: 'KEY', className: 'w-[10%]' },
                { label: language === 'vi' ? 'TÊN CÔNG VIỆC' : 'TITLE', className: 'w-[30%]' },
                { label: language === 'vi' ? 'TRẠNG THÁI' : 'STATUS', align: 'center', className: 'w-[15%]' },
                { label: language === 'vi' ? 'ƯU TIÊN' : 'PRIORITY', align: 'center', className: 'w-[10%]' },
                { label: language === 'vi' ? 'NGƯỜI GIAO' : 'ASSIGNEE', className: 'w-[15%]' },
                { label: language === 'vi' ? 'NGÀY TẠO' : 'CREATED', align: 'center', className: 'w-[10%]' },
                { label: language === 'vi' ? 'THAO TÁC' : 'ACTIONS', align: 'center', className: 'w-[10%]' },
              ]}
            >
              {tasks.map(task => (
                <TableRow key={task.id}>
                  <TableCell className="font-mono-code text-xs font-bold text-sky-600 dark:text-sky-400">
                    {task.key}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[var(--text-primary)] truncate" title={task.title}>
                        {task.title}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] font-mono-code mt-0.5">
                        {task.type}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(task.status)}
                  </TableCell>
                  <TableCell className="text-center">
                    {getPriorityBadge(task.priority)}
                  </TableCell>
                  <TableCell>
                    {task.assigneeId ? (
                      <span className="text-xs font-medium text-[var(--text-primary)] font-mono-code truncate block">
                        {task.assigneeId}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)] italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center text-xs text-[var(--text-secondary)] font-mono-code">
                    {task.createdAt ? `${new Date(task.createdAt).getDate()}/${new Date(task.createdAt).getMonth() + 1}/${new Date(task.createdAt).getFullYear()}` : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => alert(`View detail task: ${task.key}\nTính năng xem chi tiết Task sẽ được cập nhật sau.`)}
                        className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-sky-500 transition-colors cursor-pointer"
                        title="Xem"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(task)}
                        className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-rose-500 transition-colors cursor-pointer"
                        title="Xoá"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)]/30">
            <p className="text-xs font-mono-code text-[var(--text-muted)]">
              {language === 'vi' ? 'Trang' : 'Page'} {page} / {totalPages} ({total} {language === 'vi' ? 'công việc' : 'tasks'})
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                {language === 'vi' ? 'Trang trước' : 'Previous'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                {language === 'vi' ? 'Trang sau' : 'Next'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={language === 'vi' ? 'Xoá công việc' : 'Delete Task'}
        message={`${language === 'vi' ? 'Bạn có chắc chắn muốn xoá task này không?' : 'Are you sure you want to delete this task?'} (${confirmModal.taskTitle})`}
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, taskId: '', taskTitle: '' })}
      />
    </div>
  );
}
