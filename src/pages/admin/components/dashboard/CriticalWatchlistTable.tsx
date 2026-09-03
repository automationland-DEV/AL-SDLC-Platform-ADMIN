import { AlertCircle, Clock } from 'lucide-react';
import { useTranslation } from '../../../../i18n/useTranslation';

export interface CriticalWatchlistTask {
  id: string;
  title: string;
  priority: string;
  status: string;
  assignee: string;
  daysOverdue: number;
  workspace: string;
}

interface CriticalWatchlistTableProps {
  data: CriticalWatchlistTask[];
}

export function CriticalWatchlistTable({ data }: CriticalWatchlistTableProps) {
  const { language } = useTranslation();

  const renderStatusBadge = (val: string) => {
    const trimmed = (val || '').trim();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(trimmed);
    const lower = trimmed.toLowerCase();

    let category: 'todo' | 'inprogress' | 'done';
    if (['todo', 'to-do', 'to do', 'backlog', 'new', 'open', 'chưa thực hiện', 'chưa làm'].includes(lower)) {
      category = 'todo';
    } else if (['done', 'completed', 'resolved', 'closed', 'hoàn thành'].includes(lower)) {
      category = 'done';
    } else {
      category = 'inprogress';
    }

    const categoryConfig = {
      todo: {
        badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
        dot: 'bg-slate-400',
        defaultLabel: language === 'vi' ? 'Chưa thực hiện' : 'To Do',
        categoryName: language === 'vi' ? 'Chưa thực hiện' : 'To Do',
      },
      inprogress: {
        badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        dot: 'bg-blue-500',
        defaultLabel: language === 'vi' ? 'Đang làm' : 'In Progress',
        categoryName: language === 'vi' ? 'Đang xử lý' : 'In Progress',
      },
      done: {
        badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        dot: 'bg-emerald-500',
        defaultLabel: language === 'vi' ? 'Hoàn thành' : 'Done',
        categoryName: language === 'vi' ? 'Hoàn thành' : 'Done',
      },
    };

    const config = categoryConfig[category];
    const isDefaultName = ['todo', 'to-do', 'to do', 'inprogress', 'in-progress', 'in progress', 'done'].includes(lower);
    const displayLabel = isUUID || isDefaultName ? config.defaultLabel : trimmed;
    const tooltipText = isDefaultName || isUUID
      ? config.defaultLabel
      : `${trimmed} (${config.categoryName})`;

    return (
      <div 
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${config.badge} max-w-[150px]`}
        title={tooltipText}
      >
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
        <span className="truncate">{displayLabel}</span>
      </div>
    );
  };

  const renderPriorityBadge = (val: string) => {
    const colorClass = ['Highest', 'Rất cao'].includes(val) ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500';
    const label = language === 'vi' 
      ? (val === 'Highest' ? 'Rất cao' : (val === 'High' ? 'Cao' : (val === 'Medium' ? 'Trung bình' : val)))
      : val;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colorClass}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between bg-red-500/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
            <AlertCircle size={18} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {language === 'vi' ? 'Công việc cần chú ý khẩn cấp' : 'Critical Tasks'}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {language === 'vi' 
                ? 'Các công việc có mức ưu tiên cao hoặc đang bị quá hạn cần xử lý ngay' 
                : 'High-priority or overdue tasks requiring immediate attention'}
            </p>
          </div>
        </div>
        {data.length > 0 && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            {data.length} {language === 'vi' ? 'công việc' : 'tasks'}
          </span>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
              <th className="p-4 text-sm font-semibold text-[var(--text-secondary)] whitespace-nowrap">Task ID</th>
              <th className="p-4 text-sm font-semibold text-[var(--text-secondary)] whitespace-nowrap">{language === 'vi' ? 'Tiêu đề' : 'Title'}</th>
              <th className="p-4 text-sm font-semibold text-[var(--text-secondary)] whitespace-nowrap">Workspace</th>
              <th className="p-4 text-sm font-semibold text-[var(--text-secondary)] whitespace-nowrap">{language === 'vi' ? 'Ưu tiên' : 'Priority'}</th>
              <th className="p-4 text-sm font-semibold text-[var(--text-secondary)] whitespace-nowrap">{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
              <th className="p-4 text-sm font-semibold text-[var(--text-secondary)] whitespace-nowrap">{language === 'vi' ? 'Người được giao' : 'Assignee'}</th>
              <th className="p-4 text-sm font-semibold text-[var(--text-secondary)] whitespace-nowrap">{language === 'vi' ? 'Trễ hạn' : 'Overdue'}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((task) => (
              <tr key={task.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors">
                <td className="p-4 whitespace-nowrap">
                  <span className="text-blue-500 font-medium hover:underline cursor-pointer">
                    {task.id}
                  </span>
                </td>
                <td className="p-4 whitespace-nowrap">
                  <span className="text-[var(--text-primary)] font-medium max-w-[200px] truncate block" title={task.title}>
                    {task.title}
                  </span>
                </td>
                <td className="p-4 whitespace-nowrap">
                  <span className="text-[var(--text-secondary)] text-sm">
                    {task.workspace}
                  </span>
                </td>
                <td className="p-4 whitespace-nowrap">
                  {renderPriorityBadge(task.priority)}
                </td>
                <td className="p-4 whitespace-nowrap">
                  {renderStatusBadge(task.status)}
                </td>
                <td className="p-4 whitespace-nowrap">
                  <span className={`text-sm ${task.assignee === 'Unassigned' ? 'text-red-500 italic' : 'text-[var(--text-primary)]'}`}>
                    {task.assignee === 'Unassigned' ? (language === 'vi' ? 'Chưa giao' : 'Unassigned') : task.assignee}
                  </span>
                </td>
                <td className="p-4 whitespace-nowrap">
                  {task.daysOverdue === 0 ? (
                    <span className="text-green-500 text-sm">{language === 'vi' ? 'Hôm nay' : 'Today'}</span>
                  ) : (
                    <div className="flex items-center gap-1 text-red-500 text-sm font-medium">
                      <Clock size={14} />
                      {task.daysOverdue} {language === 'vi' ? 'ngày' : 'days'}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[var(--text-secondary)]">
                  {language === 'vi' ? 'Không có task nào cần chú ý khẩn cấp.' : 'No critical tasks found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
