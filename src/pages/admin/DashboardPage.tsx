import { useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useDashboardData } from './hooks/useDashboardData';

// Import New Components
import { DashboardFilters } from './components/dashboard/DashboardFilters';
import { OverviewCards } from './components/dashboard/OverviewCards';
import { SprintBurndownChart } from './components/dashboard/SprintBurndownChart';
import { VelocityChart } from './components/dashboard/VelocityChart';
import { WorkspaceDistributionChart } from './components/dashboard/WorkspaceDistributionChart';
import { TaskFocusRadar } from './components/dashboard/TaskFocusRadar';
import { PriorityBottleneckChart } from './components/dashboard/PriorityBottleneckChart';
import { CriticalWatchlistTable } from './components/dashboard/CriticalWatchlistTable';

export default function DashboardPage() {
  const { language } = useTranslation();
  
  // Global Filters State
  const [filters, setFilters] = useState({
    dateRange: '30d',
    workspace: 'all',
    sprint: 'all',
  });

  // Fetch aggregated data via React Query (mocked for now)
  const { data, isLoading, isError } = useDashboardData(filters);

  // Fallback Error State
  if (isError) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-500 mb-2">
            {language === 'vi' ? 'Không thể tải dữ liệu Dashboard' : 'Failed to load Dashboard data'}
          </h2>
          <p className="text-[var(--text-secondary)]">
            {language === 'vi' ? 'Vui lòng thử lại sau.' : 'Please try again later.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 max-w-[1600px] mx-auto font-sans">
      {/* Row 0: Global Filters */}
      <div className="sticky -top-5 z-20 -mt-5 pt-5 pb-3 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 bg-[var(--bg-primary)] border-b border-[var(--border-color)]/40">
        <DashboardFilters filters={filters} setFilters={setFilters} />
      </div>

      {/* Row 1: Overview KPIs */}
      <OverviewCards data={data?.overview} isLoading={isLoading} />

      {!isLoading && data && (
        <>
          {/* Row 2: Velocity / Burndown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px]">
            {/* Show Velocity across all workspaces, but if a specific workspace/sprint is selected, prioritize Burndown */}
            {filters.workspace !== 'all' ? (
              <SprintBurndownChart data={data.burndown} />
            ) : (
              <VelocityChart data={data.velocity} dateRange={filters.dateRange} />
            )}
            
            {/* If both fits or we want to show Velocity side by side with Burndown */}
            {filters.workspace !== 'all' ? (
              <VelocityChart data={data.velocity} dateRange={filters.dateRange} />
            ) : (
              <SprintBurndownChart data={data.burndown} />
            )}
          </div>

          {/* Row 3: Workspace Distribution & Task Focus */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[400px]">
            <div className="lg:col-span-2">
              <WorkspaceDistributionChart data={data.workspaceDistribution} />
            </div>
            <div className="lg:col-span-1">
              <TaskFocusRadar data={data.taskFocus} />
            </div>
          </div>

          {/* Row 4: Priority Bottleneck */}
          <div className="w-full min-h-[400px]">
            <PriorityBottleneckChart data={data.priorityBottlenecks} />
          </div>

          {/* Row 5: Critical Watchlist Table */}
          <div className="w-full">
            <CriticalWatchlistTable data={data.criticalWatchlist} />
          </div>
        </>
      )}
    </div>
  );
}
