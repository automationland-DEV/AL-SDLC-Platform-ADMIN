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
import { useTranslation } from '../../../../i18n/useTranslation';

export interface WorkspaceDistributionItem {
  name: string;
  todo: number;
  inProgress: number;
  done: number;
}

interface WorkspaceDistributionChartProps {
  data: WorkspaceDistributionItem[];
}

export function WorkspaceDistributionChart({ data }: WorkspaceDistributionChartProps) {
  const { language } = useTranslation();

  return (
    <div className="bg-[var(--bg-card)] p-5 rounded-xl border border-[var(--border-color)] h-full flex flex-col">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
        {language === 'vi' ? 'Phân bổ theo Workspace (Top 5)' : 'Workspace Distribution (Top 5)'}
      </h3>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        {language === 'vi' ? 'Khối lượng công việc theo trạng thái' : 'Workload by status across top workspaces'}
      </p>
      
      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
            barSize={20}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
            <XAxis 
              type="number"
              stroke="var(--text-muted)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <YAxis 
              type="category"
              dataKey="name" 
              stroke="var(--text-muted)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={100}
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
              dataKey="done" 
              name={language === 'vi' ? 'Hoàn thành' : 'Done'} 
              stackId="a" 
              fill="#22c55e" 
              radius={[0, 0, 0, 0]} 
            />
            <Bar 
              dataKey="inProgress" 
              name={language === 'vi' ? 'Đang làm' : 'In Progress'} 
              stackId="a" 
              fill="#3b82f6" 
              radius={[0, 0, 0, 0]} 
            />
            <Bar 
              dataKey="todo" 
              name={language === 'vi' ? 'Chưa thực hiện' : 'To Do'} 
              stackId="a" 
              fill="#94a3b8" 
              radius={[0, 4, 4, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
