import { X, Calendar, Clock, User, Tag, Layers, CheckCircle2, AlertCircle, FileText, Loader2, ArrowRightCircle, CircleDashed } from 'lucide-react';
import { Badge, Button } from '../../../../components/ui';
import { useTranslation } from '../../../../i18n/useTranslation';
import { useTaskDetailQuery } from '../../../../hooks/queries';

interface TaskDetailModalProps {
  isOpen: boolean;
  workspaceId: string;
  taskId: string;
  onClose: () => void;
}

const getStatusBadge = (status: string, lang: 'vi' | 'en') => {
  const s = (status || '').toLowerCase();
  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-/.test(status || '');

  if (s.includes('done') || s.includes('completed')) {
    return (
      <Badge variant="success" className="gap-1">
        <CheckCircle2 className="w-3.5 h-3.5" />
        {lang === 'vi' ? 'Hoàn thành' : 'Done'}
      </Badge>
    );
  }
  if (s.includes('progress') || s.includes('doing') || isUuid) {
    return (
      <Badge variant="info" className="gap-1">
        <ArrowRightCircle className="w-3.5 h-3.5" />
        {lang === 'vi' ? 'Đang thực hiện' : 'In Progress'}
      </Badge>
    );
  }
  return (
    <Badge variant="default" className="gap-1">
      <CircleDashed className="w-3.5 h-3.5" />
      {lang === 'vi' ? 'Cần làm' : 'To Do'}
    </Badge>
  );
};

const getPriorityBadge = (priority: string, lang: 'vi' | 'en') => {
  const p = (priority || '').toLowerCase();
  if (p === 'highest' || p === 'critical') {
    return <Badge variant="danger">{lang === 'vi' ? 'Rất cao' : 'Highest'}</Badge>;
  }
  if (p === 'high') {
    return <Badge variant="warning">{lang === 'vi' ? 'Cao' : 'High'}</Badge>;
  }
  if (p === 'low' || p === 'lowest') {
    return <Badge variant="default">{lang === 'vi' ? 'Thấp' : 'Low'}</Badge>;
  }
  return <Badge variant="info">{lang === 'vi' ? 'Trung bình' : 'Medium'}</Badge>;
};

const getTypeBadge = (type: string, lang: 'vi' | 'en') => {
  const t = (type || '').toLowerCase();
  let label = type.toUpperCase();
  if (t === 'bug') label = lang === 'vi' ? 'LỖI' : 'BUG';
  else if (t === 'story') label = lang === 'vi' ? 'STORY' : 'STORY';
  else if (t === 'subtask') label = lang === 'vi' ? 'TASK CON' : 'SUBTASK';
  else if (t === 'task') label = lang === 'vi' ? 'CÔNG VIỆC' : 'TASK';

  if (t === 'bug') return <Badge variant="danger">{label}</Badge>;
  if (t === 'epic') return <Badge variant="warning">{label}</Badge>;
  if (t === 'story') return <Badge variant="success">{label}</Badge>;
  return <Badge variant="default">{label}</Badge>;
};

export function TaskDetailModal({ isOpen, workspaceId, taskId, onClose }: TaskDetailModalProps) {
  const { language } = useTranslation();
  const { data: task, isLoading, error } = useTaskDetailQuery(workspaceId, taskId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 sm:p-6 transition-all duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between gap-4 bg-[var(--bg-tertiary)]/50">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono-code text-sm font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-md border border-sky-500/20">
              {task?.key || 'TASK'}
            </span>
            {task?.type && getTypeBadge(task.type, language)}
            {task?.status && getStatusBadge(task.status, language)}
            {task?.priority && getPriorityBadge(task.priority, language)}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="py-20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
            </div>
          ) : error || !task ? (
            <div className="py-16 text-center space-y-3">
              <AlertCircle className="w-10 h-10 mx-auto text-rose-500 stroke-1" />
              <p className="text-sm text-[var(--text-muted)]">
                {language === 'vi' ? 'Không thể tải thông tin chi tiết task.' : 'Failed to load task details.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Main Content (Left 2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)] leading-tight">
                    {task.title}
                  </h2>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    {language === 'vi' ? 'Mô tả' : 'Description'}
                  </h3>
                  <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] min-h-[100px] text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                    {task.description ? task.description : (
                      <span className="text-[var(--text-muted)] italic">
                        {language === 'vi' ? 'Chưa có mô tả chi tiết cho công việc này.' : 'No description provided.'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Parent / Subtasks */}
                {task.parent && (
                  <div className="p-3.5 rounded-xl border border-[var(--border-color)] bg-sky-500/5 flex items-center gap-3">
                    <Layers className="w-4 h-4 text-sky-500" />
                    <div className="text-xs">
                      <span className="text-[var(--text-muted)]">{language === 'vi' ? 'Task cha:' : 'Parent Task:'} </span>
                      <span className="font-mono-code font-bold text-sky-600 dark:text-sky-400">{task.parent.key}</span> - <span className="font-medium text-[var(--text-primary)]">{task.parent.title}</span>
                    </div>
                  </div>
                )}

                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-4 h-4" />
                        Subtasks ({task.subtasks.length})
                      </h3>
                      {task.subtaskProgress && (
                        <span className="text-xs font-mono-code text-[var(--text-muted)]">
                          {task.subtaskProgress.done} / {task.subtaskProgress.total} Done
                        </span>
                      )}
                    </div>
                    <div className="divide-y divide-[var(--border-color)] border border-[var(--border-color)] rounded-xl overflow-hidden">
                      {task.subtasks.map((st: { id: string; key: string; title: string; status: string }) => (
                        <div key={st.id} className="p-3 flex items-center justify-between gap-3 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono-code text-xs font-bold text-sky-600 dark:text-sky-400">{st.key}</span>
                            <span className="text-xs font-medium text-[var(--text-primary)] truncate">{st.title}</span>
                          </div>
                          {getStatusBadge(st.status, language)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar / Meta Fields (Right 1 col) */}
              <div className="space-y-5 lg:border-l lg:border-[var(--border-color)] lg:pl-6">
                
                {/* Assignee */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-muted)] block flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {language === 'vi' ? 'Người thực hiện' : 'Assignee'}
                  </label>
                  {task.assignee ? (
                    <div className="flex items-center gap-2.5 p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)]/40">
                      {task.assignee.avatar ? (
                        <img src={task.assignee.avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-500 flex items-center justify-center font-bold text-xs shrink-0">
                          {task.assignee.fullName?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">{task.assignee.fullName}</p>
                        <p className="text-[10px] text-[var(--text-muted)] truncate">{task.assignee.email}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)] italic block">{language === 'vi' ? 'Chưa phân công' : 'Unassigned'}</span>
                  )}
                </div>

                {/* Reporter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-muted)] block flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {language === 'vi' ? 'Người tạo' : 'Reporter'}
                  </label>
                  {task.reporter ? (
                    <div className="flex items-center gap-2.5 p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)]/40">
                      {task.reporter.avatar ? (
                        <img src={task.reporter.avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center font-bold text-xs shrink-0">
                          {task.reporter.fullName?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">{task.reporter.fullName}</p>
                        <p className="text-[10px] text-[var(--text-muted)] truncate">{task.reporter.email}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)] italic block">N/A</span>
                  )}
                </div>

                {/* Labels */}
                {task.labels && task.labels.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-muted)] block flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      Labels
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {task.labels.map((l: { id: string; name: string }) => (
                        <Badge key={l.id} variant="default" mono>{l.name}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Story Points */}
                {task.storyPoints !== undefined && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text-muted)] block">Story Points</label>
                    <span className="text-xs font-bold font-mono-code px-2 py-1 rounded bg-[var(--bg-tertiary)] text-[var(--text-primary)] inline-block">
                      {task.storyPoints} pts
                    </span>
                  </div>
                )}

                {/* Dates */}
                <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {language === 'vi' ? 'Ngày bắt đầu:' : 'Start Date:'}
                    </span>
                    <span className="font-mono-code text-[var(--text-primary)]">
                      {task.startDate ? new Date(task.startDate).toLocaleDateString('vi-VN') : '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {language === 'vi' ? 'Hạn hoàn thành:' : 'Due Date:'}
                    </span>
                    <span className="font-mono-code text-[var(--text-primary)]">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : '-'}
                    </span>
                  </div>
                </div>

                {/* Time Tracking */}
                <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {language === 'vi' ? 'Thời gian đã log:' : 'Time Logged:'}
                    </span>
                    <span className="font-mono-code font-bold text-sky-600 dark:text-sky-400">
                      {task.timeLogged || 0}h
                    </span>
                  </div>
                  {task.timeEstimated !== undefined && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-muted)] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {language === 'vi' ? 'Ước lượng:' : 'Estimated:'}
                      </span>
                      <span className="font-mono-code text-[var(--text-primary)]">
                        {task.timeEstimated}h
                      </span>
                    </div>
                  )}
                </div>

                {/* Created / Updated */}
                <div className="space-y-1.5 pt-2 border-t border-[var(--border-color)] text-[11px] text-[var(--text-muted)] font-mono-code">
                  <p>{language === 'vi' ? 'Tạo lúc:' : 'Created:'} {task.createdAt ? new Date(task.createdAt).toLocaleString('vi-VN') : '-'}</p>
                  <p>{language === 'vi' ? 'Cập nhật:' : 'Updated:'} {task.updatedAt ? new Date(task.updatedAt).toLocaleString('vi-VN') : '-'}</p>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-tertiary)]/50 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {language === 'vi' ? 'Đóng' : 'Close'}
          </Button>
        </div>

      </div>
    </div>
  );
}
