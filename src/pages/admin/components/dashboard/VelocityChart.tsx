import { useState, useMemo, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useTranslation } from '../../../../i18n/useTranslation';

export interface VelocityItem {
  date: string;
  created: number;
  completed: number;
}

interface VelocityChartProps {
  data: VelocityItem[];
  dateRange?: string;
}

export function VelocityChart({ data, dateRange = '30d' }: VelocityChartProps) {
  const { language } = useTranslation();
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>(() => 
    dateRange === '90d' ? 'weekly' : 'daily'
  );

  useEffect(() => {
    if (dateRange === '90d') {
      setViewMode('weekly');
    } else {
      setViewMode('daily');
    }
  }, [dateRange]);

  const getDateRangeLabel = () => {
    if (dateRange === '7d') return language === 'vi' ? '7 ngày qua' : 'Last 7 days';
    if (dateRange === '30d') return language === 'vi' ? '30 ngày qua' : 'Last 30 days';
    if (dateRange === '90d') return language === 'vi' ? '90 ngày qua' : 'Last 90 days';
    return language === 'vi' ? 'Tất cả thời gian' : 'All time';
  };

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (viewMode === 'daily' || data.length <= 10) return data;

    // Group into 7-day weekly buckets
    const weekly: VelocityItem[] = [];
    const chunkSize = 7;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const createdSum = chunk.reduce((sum, item) => sum + (item.created || 0), 0);
      const completedSum = chunk.reduce((sum, item) => sum + (item.completed || 0), 0);
      const startDate = chunk[0]?.date || '';
      const endDate = chunk[chunk.length - 1]?.date || '';
      weekly.push({
        date: startDate === endDate ? startDate : `${startDate} - ${endDate}`,
        created: createdSum,
        completed: completedSum,
      });
    }
    return weekly;
  }, [data, viewMode]);

  return (
    <div className="bg-[var(--bg-card)] p-5 rounded-xl border border-[var(--border-color)] h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            {language === 'vi' ? `Lưu lượng Task (${getDateRangeLabel()})` : `Task Throughput (${getDateRangeLabel()})`}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            {viewMode === 'weekly'
              ? (language === 'vi' ? 'Tổng số Task tạo mới và Task hoàn thành theo từng tuần' : 'Total tasks created and completed per week')
              : (language === 'vi' ? 'So sánh số lượng Task tạo mới và Task hoàn thành mỗi ngày' : 'Daily comparison of newly created vs. completed tasks')}
          </p>
        </div>

        {data && data.length > 10 && (
          <div className="inline-flex rounded-lg bg-[var(--bg-tertiary)] p-0.5 border border-[var(--border-color)] shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'weekly'
                  ? 'bg-[var(--bg-card)] text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {language === 'vi' ? 'Theo tuần' : 'Weekly'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'daily'
                  ? 'bg-[var(--bg-card)] text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {language === 'vi' ? 'Theo ngày' : 'Daily'}
            </button>
          </div>
        )}
      </div>
      
      <div className="flex-1 w-full min-h-[300px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="var(--text-muted)" 
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={10}
              minTickGap={28}
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
              itemStyle={{ fontSize: '13px', fontWeight: 500 }}
            />
            <Legend 
              iconType="circle"
              wrapperStyle={{ paddingTop: '20px' }} 
            />
            <Area 
              type="monotone" 
              dataKey="created" 
              name={language === 'vi' ? 'Task tạo mới' : 'Tasks Created'} 
              stroke="#3b82f6" 
              fillOpacity={1} 
              fill="url(#colorCreated)" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2 }}
            />
            <Area 
              type="monotone" 
              dataKey="completed" 
              name={language === 'vi' ? 'Task hoàn thành' : 'Tasks Completed'} 
              stroke="#10b981" 
              fillOpacity={1} 
              fill="url(#colorCompleted)" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, stroke: '#10b981', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
