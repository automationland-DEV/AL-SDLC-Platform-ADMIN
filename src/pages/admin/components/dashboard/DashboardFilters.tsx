import { Calendar, Filter, LayoutGrid } from 'lucide-react';
import { useTranslation } from '../../../../i18n/useTranslation';
import { useQuery } from '@tanstack/react-query';
import { workspaceService } from '../../../../services/workspaceService';

export interface DashboardFiltersState {
  dateRange: string;
  workspace: string;
  sprint: string;
}

export interface WorkspaceOption {
  _id?: string;
  id?: string;
  name: string;
}

interface DashboardFiltersProps {
  filters: DashboardFiltersState;
  setFilters: (filters: DashboardFiltersState) => void;
}

export function DashboardFilters({ filters, setFilters }: DashboardFiltersProps) {
  const { language } = useTranslation();
  
  // Fetch actual workspaces
  const { data: workspaces = [] } = useQuery<WorkspaceOption[]>({
    queryKey: ['adminWorkspacesOptions'],
    queryFn: () => workspaceService.getOptionsAdmin(),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-color)]">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
          <Filter size={18} />
        </div>
        <h2 className="font-semibold text-lg text-[var(--text-primary)]">
          {language === 'vi' ? 'Bộ lọc toàn cục' : 'Global Filters'}
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        {/* Date Range Filter */}
        <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] px-3 py-2 rounded-lg border border-[var(--border-color)]">
          <Calendar size={16} className="text-[var(--text-secondary)]" />
          <select 
            className="bg-transparent text-sm text-[var(--text-primary)] outline-none focus:ring-0 cursor-pointer"
            value={filters.dateRange || '30d'}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
          >
            <option value="7d">{language === 'vi' ? '7 ngày qua' : 'Last 7 days'}</option>
            <option value="30d">{language === 'vi' ? '30 ngày qua' : 'Last 30 days'}</option>
            <option value="90d">{language === 'vi' ? '90 ngày qua' : 'Last 90 days'}</option>
            <option value="all">{language === 'vi' ? 'Tất cả thời gian' : 'All time'}</option>
          </select>
        </div>

        {/* Workspace Filter */}
        <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] px-3 py-2 rounded-lg border border-[var(--border-color)]">
          <LayoutGrid size={16} className="text-[var(--text-secondary)]" />
          <select 
            className="bg-transparent text-sm text-[var(--text-primary)] outline-none focus:ring-0 cursor-pointer max-w-[150px] truncate"
            value={filters.workspace || 'all'}
            onChange={(e) => setFilters({ ...filters, workspace: e.target.value, sprint: 'all' })}
          >
            <option value="all">{language === 'vi' ? 'Tất cả Workspace' : 'All Workspaces'}</option>
            {workspaces.map((ws: WorkspaceOption) => (
              <option key={ws._id || ws.id} value={ws._id || ws.id}>{ws.name}</option>
            ))}
          </select>
        </div>

        {/* Sprint Filter (Disabled if 'all' workspaces selected) */}
        <div className={`flex items-center gap-2 bg-[var(--bg-tertiary)] px-3 py-2 rounded-lg border border-[var(--border-color)] ${filters.workspace === 'all' ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <select 
            className="bg-transparent text-sm text-[var(--text-primary)] outline-none focus:ring-0 cursor-pointer"
            value={filters.sprint || 'all'}
            onChange={(e) => setFilters({ ...filters, sprint: e.target.value })}
            disabled={filters.workspace === 'all'}
          >
            {filters.workspace === 'all' ? (
              <option value="none">{language === 'vi' ? 'Chọn Workspace trước' : 'Select Workspace first'}</option>
            ) : (
              <>
                <option value="all">{language === 'vi' ? 'Tất cả Sprint' : 'All Sprints'}</option>
                <option value="active">{language === 'vi' ? 'Sprint hiện tại' : 'Active Sprint'}</option>
              </>
            )}
          </select>
        </div>
      </div>
    </div>
  );
}
