import { Clock, AlertTriangle, Bug, Zap, Activity } from 'lucide-react';
import { useTranslation } from '../../../../i18n/useTranslation';

export interface OverviewData {
  totalActiveTasks?: number;
  openBugs?: number;
  overdueTasks?: number;
  storyPointsDone?: number;
  avgCycleTime?: number;
  trends?: {
    totalActiveTasks?: string;
    openBugs?: string;
    overdueTasks?: string;
    storyPointsDone?: string;
    avgCycleTime?: string;
  };
}

interface OverviewCardsProps {
  data?: OverviewData;
  isLoading: boolean;
}

export function OverviewCards({ data, isLoading }: OverviewCardsProps) {
  const { language } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-4 h-28 animate-pulse">
            <div className="h-4 bg-[var(--bg-tertiary)] w-1/2 rounded mb-4"></div>
            <div className="h-8 bg-[var(--bg-tertiary)] w-1/3 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const trends = data.trends || {};

  const cards = [
    {
      label: language === 'vi' ? 'Tổng công việc' : 'Total Tasks',
      value: data.totalActiveTasks ?? 0,
      icon: Activity,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      trend: trends.totalActiveTasks === 'all_time' ? (language === 'vi' ? 'Toàn thời gian' : 'All time') : (trends.totalActiveTasks || '0%'),
      trendType: 'standard',
    },
    {
      label: language === 'vi' ? 'Bug chưa xử lý' : 'Open Bugs',
      value: data.openBugs ?? 0,
      icon: Bug,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      trend: trends.openBugs === 'all_time' ? (language === 'vi' ? 'Toàn thời gian' : 'All time') : (trends.openBugs || '0%'),
      trendType: 'invert',
    },
    {
      label: language === 'vi' ? 'Quá hạn' : 'Overdue',
      value: data.overdueTasks ?? 0,
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      trend: trends.overdueTasks ? `${trends.overdueTasks} ${language === 'vi' ? 'việc' : 'tasks'}` : '0',
      trendType: 'danger',
    },
    {
      label: language === 'vi' ? 'Story Points Done' : 'SP Done',
      value: data.storyPointsDone ?? 0,
      icon: Zap,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      trend: trends.storyPointsDone === 'all_time' ? (language === 'vi' ? 'Toàn thời gian' : 'All time') : (trends.storyPointsDone || '0%'),
      trendType: 'standard',
    },
    {
      label: language === 'vi' ? 'Cycle Time (Ngày)' : 'Cycle Time (Days)',
      value: data.avgCycleTime ?? 0,
      icon: Clock,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      trend: trends.avgCycleTime ? `${trends.avgCycleTime}` : '0d',
      trendType: 'neutral',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => {
        let trendColorClass = 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]';
        if (card.trendType === 'danger' && Number(data.overdueTasks) > 0) {
          trendColorClass = 'bg-red-500/10 text-red-600 dark:text-red-400';
        } else if (card.trendType === 'standard') {
          if (card.trend.startsWith('+')) trendColorClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
          else if (card.trend.startsWith('-')) trendColorClass = 'bg-red-500/10 text-red-600 dark:text-red-400';
        } else if (card.trendType === 'invert') {
          if (card.trend.startsWith('-')) trendColorClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
          else if (card.trend.startsWith('+')) trendColorClass = 'bg-red-500/10 text-red-600 dark:text-red-400';
        }

        return (
          <div 
            key={index} 
            className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-4 flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-[var(--text-secondary)] font-medium">
                {card.label}
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.bgColor} ${card.color}`}>
                <card.icon size={18} />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-[var(--text-primary)]">
                {card.value}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trendColorClass}`}>
                {card.trend}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
