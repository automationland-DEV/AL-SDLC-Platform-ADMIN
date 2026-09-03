import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useTranslation } from '../../../../i18n/useTranslation';

export interface SprintBurndownItem {
  day: string;
  ideal: number;
  actual: number;
}

interface SprintBurndownChartProps {
  data: SprintBurndownItem[];
}

export function SprintBurndownChart({ data }: SprintBurndownChartProps) {
  const { language } = useTranslation();

  return (
    <div className="bg-[var(--bg-card)] p-5 rounded-xl border border-[var(--border-color)] h-full flex flex-col">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
        {language === 'vi' ? 'Sprint Burndown' : 'Sprint Burndown'}
      </h3>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        {language === 'vi' 
          ? 'Theo dõi Story Points còn lại theo từng ngày so với kế hoạch' 
          : 'Track remaining Story Points per day vs. planned target'}
      </p>
      
      <div className="flex-1 w-full min-h-[300px]">
        {!data || data.length === 0 ? (
          <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-tertiary)]/20">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {language === 'vi' ? 'Không có dữ liệu Sprint' : 'No Sprint Data'}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
              {language === 'vi' 
                ? 'Không tìm thấy Sprint đang hoạt động hoặc không có Story Points trong bộ lọc hiện tại.' 
                : 'No active sprint or tasks with story points found in the current filter.'}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
            >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis 
              dataKey="day" 
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
                `${Math.round(Number(value))} pts`,
                String(name)
              ]}
              itemStyle={{ fontSize: '13px', fontWeight: 500 }}
            />
            <Legend 
              iconType="circle"
              wrapperStyle={{ paddingTop: '20px' }} 
            />
            <Line 
              type="monotone" 
              dataKey="ideal" 
              name={language === 'vi' ? 'Mục tiêu kế hoạch' : 'Ideal Target'} 
              stroke="#94a3b8" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 2, fill: '#94a3b8' }}
            />
            <Line 
              type="monotone" 
              dataKey="remaining" 
              name={language === 'vi' ? 'Điểm còn lại thực tế' : 'Actual Remaining'} 
              stroke="#ef4444" 
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: '#ef4444' }}
              activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
