import api from './api';
import { API_ROUTES } from './apiRoutes';
import type { Workspace, PaginatedResponse } from '../types';

export const workspaceService = {
  // Admin: Lấy tất cả workspaces (bao gồm cả đã xóa)
  getAllAdmin: async (): Promise<Workspace[]> => {
    const response = await api.get<Workspace[]>(API_ROUTES.WORKSPACES.ADMIN_ALL);
    return response.data;
  },

  // User thường: Lấy workspaces của mình
  getAll: async (params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<Workspace>> => {
    const response = await api.get<PaginatedResponse<Workspace>>(API_ROUTES.WORKSPACES.BASE, { params });
    return response.data;
  },

  getById: async (id: string): Promise<Workspace> => {
    const response = await api.get<Workspace>(API_ROUTES.WORKSPACES.BY_ID(id));
    return response.data;
  },

  create: async (data: Partial<Workspace>): Promise<Workspace> => {
    const response = await api.post<Workspace>(API_ROUTES.WORKSPACES.BASE, data);
    return response.data;
  },

  update: async (id: string, data: Partial<Workspace>): Promise<Workspace> => {
    const response = await api.put<Workspace>(API_ROUTES.WORKSPACES.BY_ID(id), data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(API_ROUTES.WORKSPACES.BY_ID(id));
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
