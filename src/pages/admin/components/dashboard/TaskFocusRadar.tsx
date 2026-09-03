import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { useTranslation } from '../../../../i18n/useTranslation';

export interface TaskFocusItem {
  subject: string;
  A: number;
  fullMark?: number;
}

interface TaskFocusRadarProps {
  data: TaskFocusItem[];
}

export function TaskFocusRadar({ data }: TaskFocusRadarProps) {
  const { language } = useTranslation();

  return (
    <div className="bg-[var(--bg-card)] p-5 rounded-xl border border-[var(--border-color)] h-full flex flex-col">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
        {language === 'vi' ? 'Trọng tâm công việc' : 'Task Focus Radar'}
      </h3>
      <p className="text-sm text-[var(--text-secondary)] mb-2">
        {language === 'vi' ? 'Phân bổ nguồn lực theo loại task' : 'Resource distribution by task type'}
      </p>
      
      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="var(--border-color)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: 'var(--text-muted)' }} />
            <Radar
              name={language === 'vi' ? 'Số lượng' : 'Count'}
              dataKey="A"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.5}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)'
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
