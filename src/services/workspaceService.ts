import api from './api';
import { API_ROUTES } from './apiRoutes';
import type { Workspace, PaginatedResponse } from '../types';

export const workspaceService = {
  getAllAdmin: async (params?: { page?: number; limit?: number; status?: string; search?: string; sortField?: string; sortOrder?: string }): Promise<PaginatedResponse<Workspace>> => {
    const response = await api.get<unknown>(API_ROUTES.WORKSPACES.BASE, { params });
    const raw = response.data as Record<string, unknown> | Workspace[] | null;
    
    let items: Workspace[] = [];
    if (Array.isArray(raw)) items = raw as Workspace[];
    else if (raw && Array.isArray((raw as Record<string, unknown>).data)) items = (raw as Record<string, unknown>).data as Workspace[];
    else if (raw && Array.isArray((raw as Record<string, unknown>).workspaces)) items = (raw as Record<string, unknown>).workspaces as Workspace[];

    let total = items.length;
    let totalPages = 1;
    const rawObj = raw && !Array.isArray(raw) ? raw as Record<string, unknown> : null;
    if (rawObj && typeof rawObj.total === 'number') {
      total = rawObj.total;
      totalPages = (rawObj.totalPages as number) || 1;
    } else if (rawObj && rawObj.pagination && typeof rawObj.pagination === 'object') {
      const pagination = rawObj.pagination as Record<string, unknown>;
      total = (pagination.total as number) || items.length;
      totalPages = (pagination.totalPages as number) || 1;
    }

    return { data: items, total, page: params?.page || 1, limit: params?.limit || 20, totalPages };
  },

  getOptionsAdmin: async (): Promise<Workspace[]> => {
    const response = await api.get<unknown>(API_ROUTES.WORKSPACES.OPTIONS);
    const data = response.data as { data?: Workspace[] } | Workspace[] | null;
    if (Array.isArray(data)) return data as Workspace[];
    return (data as { data?: Workspace[] })?.data ?? [];
  },

  getById: async (id: string): Promise<Workspace> => {
    const response = await api.get<Workspace>(API_ROUTES.WORKSPACES.BY_ID(id));
    return response.data;
  },

  update: async (id: string, data: Partial<Workspace>): Promise<Workspace> => {
    const response = await api.put<Workspace>(API_ROUTES.WORKSPACES.BY_ID(id), data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(API_ROUTES.WORKSPACES.BY_ID(id));
  },

  create: async (data: Partial<Workspace>): Promise<Workspace> => {
    const response = await api.post<unknown>(API_ROUTES.WORKSPACES.BASE, data);
    const raw = response.data as Record<string, unknown>;
    return (raw?.data ?? raw) as Workspace;
  },

  restore: async (id: string): Promise<Workspace> => {
    const response = await api.post<Workspace>(API_ROUTES.WORKSPACES.RESTORE(id));
    return response.data;
  },

  archive: async (id: string): Promise<Workspace> => {
    const response = await api.post<Workspace>(API_ROUTES.WORKSPACES.ARCHIVE(id));
    return response.data;
  },

  getMembers: async (workspaceId: string): Promise<{ userId: string; role: string }[]> => {
    const response = await api.get<{ userId: string; role: string }[]>(API_ROUTES.WORKSPACES.MEMBERS(workspaceId));
    return response.data;
  },

  addMember: async (workspaceId: string, email: string, role: string): Promise<void> => {
    await api.post(API_ROUTES.WORKSPACES.ADD_MEMBER(workspaceId), { email, role });
  },

  updateMember: async (workspaceId: string, userId: string, role: string): Promise<void> => {
    await api.put(API_ROUTES.WORKSPACES.UPDATE_MEMBER(workspaceId, userId), { role });
  },

  removeMember: async (workspaceId: string, userId: string): Promise<void> => {
    await api.delete(API_ROUTES.WORKSPACES.REMOVE_MEMBER(workspaceId, userId));
  },
};
