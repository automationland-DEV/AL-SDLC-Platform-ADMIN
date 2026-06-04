import api from './api';
import { API_ROUTES } from './apiRoutes';
import type { Document, PaginatedResponse } from '../types';

export const documentService = {
  // Admin: Lấy tất cả documents
  getAllAdmin: async (): Promise<Document[]> => {
    const response = await api.get<Document[]>(`${API_ROUTES.DOCUMENTS.BASE}/admin/all`);
    return response.data;
  },

  getAll: async (params?: { page?: number; limit?: number; type?: string }): Promise<PaginatedResponse<Document>> => {
    const response = await api.get<PaginatedResponse<Document>>(API_ROUTES.DOCUMENTS.BASE, { params });
    return response.data;
  },

  getById: async (id: string): Promise<Document> => {
    const response = await api.get<Document>(API_ROUTES.DOCUMENTS.BY_ID(id));
    return response.data;
  },

  getByWorkspace: async (workspaceId: string): Promise<Document[]> => {
    const response = await api.get<Document[]>(API_ROUTES.DOCUMENTS.WORKSPACE(workspaceId));
    return response.data;
  },

  upload: async (file: File, workspaceIds: string[]): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspaceIds', JSON.stringify(workspaceIds));

    const response = await api.post<Document>(API_ROUTES.DOCUMENTS.UPLOAD, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  createOnline: async (name: string, content: string, workspaceIds: string[]): Promise<Document> => {
    const response = await api.post<Document>(API_ROUTES.DOCUMENTS.CREATE_ONLINE, {
      name,
      content,
      workspaceIds,
    });
    return response.data;
  },

  update: async (id: string, data: Partial<Document>): Promise<Document> => {
    const response = await api.patch<Document>(API_ROUTES.DOCUMENTS.BY_ID(id), data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(API_ROUTES.DOCUMENTS.BY_ID(id));
  },

  attachToWorkspace: async (id: string, workspaceId: string): Promise<void> => {
    await api.post(`${API_ROUTES.DOCUMENTS.BY_ID(id)}/attach`, { workspaceId });
  },

  detachFromWorkspace: async (id: string, workspaceId: string): Promise<void> => {
    await api.post(`${API_ROUTES.DOCUMENTS.BY_ID(id)}/detach`, { workspaceId });
  },
};
