import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../../../../i18n/useTranslation';

export interface PriorityBottleneckItem {
  priority: string;
  rawPriority?: string;
  todo: number;
  inProgress: number;
  displayPriority?: string;
}

interface PriorityBottleneckChartProps {
  data: PriorityBottleneckItem[];
}

export function PriorityBottleneckChart({ data }: PriorityBottleneckChartProps) {
  const { language } = useTranslation();

  const priorityLabels: Record<string, { vi: string; en: string }> = {
    highest: { vi: 'Rất cao', en: 'Highest' },
    high: { vi: 'Cao', en: 'High' },
    medium: { vi: 'Trung bình', en: 'Medium' },
    low: { vi: 'Thấp', en: 'Low' },
    lowest: { vi: 'Rất thấp', en: 'Lowest' },
  };

  const formattedData = (data || []).map((item) => {
    const raw = (item.rawPriority || item.priority || '').toLowerCase();
    const label = priorityLabels[raw]
      ? (language === 'vi' ? priorityLabels[raw].vi : priorityLabels[raw].en)
      : item.priority;
    return { ...item, displayPriority: label };
  });

  const totalBottlenecks = formattedData.reduce(
    (acc, curr) => acc + (curr.todo || 0) + (curr.inProgress || 0),
    0
  );

  return (
    <div className="bg-[var(--bg-card)] p-5 rounded-xl border border-[var(--border-color)] h-full flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          {language === 'vi' ? 'Phân bổ công việc theo mức độ ưu tiên' : 'Task Distribution by Priority'}
        </h3>
        {totalBottlenecks > 0 && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            {totalBottlenecks} {language === 'vi' ? 'task đang xử lý' : 'active tasks'}
          </span>
        )}
      </div>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        {language === 'vi' 
          ? 'Thống kê số lượng công việc Chưa thực hiện và Đang làm theo từng cấp độ ưu tiên' 
          : 'Tasks in To Do and In Progress grouped by priority level'}
      </p>
      
      <div className="w-full h-[320px]">
        {totalBottlenecks === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-tertiary)]/20">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2 opacity-80" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {language === 'vi' ? 'Không có công việc đang xử lý' : 'No active tasks'}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
              {language === 'vi' 
                ? 'Không có công việc nào đang chờ thực hiện hoặc đang làm trong bộ lọc hiện tại.'
                : 'No pending or in-progress tasks found matching current filters.'}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={formattedData}
              margin={{ top: 10, right: 20, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis 
                dataKey="displayPriority" 
                stroke="var(--text-muted)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="var(--text-muted)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                formatter={(value: unknown, name: unknown) => [
                  `${value} task`,
                  String(name)
                ]}
                cursor={{ fill: 'var(--bg-tertiary)', opacity: 0.4 }}
              />
              <Legend 
                iconType="circle"
                wrapperStyle={{ paddingTop: '20px' }} 
              />
              <Bar 
                dataKey="todo" 
                name={language === 'vi' ? 'Chưa thực hiện' : 'To Do'} 
                fill="#f87171" 
                radius={[4, 4, 0, 0]} 
              />
              <Bar 
                dataKey="inProgress" 
                name={language === 'vi' ? 'Đang làm' : 'In Progress'} 
                fill="#38bdf8" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
