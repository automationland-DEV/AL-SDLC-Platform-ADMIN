import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../../services/api';
import type { TaskListResponse } from '../../types';

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (workspaceId: string, filters: string) => [...taskKeys.lists(), workspaceId, { filters }] as const,
  detail: (workspaceId: string, taskId: string) => [...taskKeys.all, 'detail', workspaceId, taskId] as const,
};

export const useWorkspaceTasksQuery = (workspaceId: string, filters: Record<string, string | number> = {}) => {
  const queryString = new URLSearchParams(
    Object.entries(filters).reduce((acc, [k, v]) => {
      if (v !== undefined && v !== '') acc[k] = String(v);
      return acc;
    }, {} as Record<string, string>)
  ).toString();

  return useQuery({
    queryKey: taskKeys.list(workspaceId, queryString),
    queryFn: async () => {
      try {
        const url = `/workspaces/${workspaceId}/board/tasks${queryString ? `?${queryString}` : ''}`;
        const response = await api.get(url);
        
        let resData = response.data;
        // Keep unwrapping 'data' if it doesn't contain 'tasks'
        while (resData && typeof resData === 'object' && 'data' in resData && !Array.isArray(resData.tasks)) {
          resData = resData.data;
        }
        
        // Final fallback if tasks property is missing entirely but we got an array somehow
        if (resData && !resData.tasks && Array.isArray(resData)) {
          return { tasks: resData, total: resData.length, page: 1, limit: 10 } as TaskListResponse;
        }
        
        return resData as TaskListResponse;
      } catch (error) {
        console.error('Failed to fetch workspace tasks:', error);
        throw error;
      }
    },
    enabled: !!workspaceId,
    placeholderData: keepPreviousData,
  });
};

export const useTaskDetailQuery = (workspaceId: string, taskId: string) => {
  return useQuery({
    queryKey: taskKeys.detail(workspaceId, taskId),
    queryFn: async () => {
      const response = await api.get(`/workspaces/${workspaceId}/board/${taskId}`);
      let resData = response.data;
      if (resData && typeof resData === 'object' && 'data' in resData) {
        resData = resData.data;
      }
      return resData;
    },
    enabled: !!workspaceId && !!taskId,
  });
};

export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ workspaceId, taskId }: { workspaceId: string; taskId: string }) => {
      const { data } = await api.delete(`/workspaces/${workspaceId}/board/tasks/${taskId}`);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...taskKeys.lists(), variables.workspaceId] });
    },
  });
};
