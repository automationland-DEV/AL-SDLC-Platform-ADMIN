import api from './api';
import { API_ROUTES } from './apiRoutes';
import type { Document, PaginatedResponse } from '../types';

export const documentService = {
  // Admin: Lấy tất cả documents
  getAllAdmin: async (params?: { page?: number; limit?: number; type?: string; workspaceId?: string }): Promise<PaginatedResponse<Document>> => {
    const response = await api.get<PaginatedResponse<Document>>(`${API_ROUTES.DOCUMENTS.BASE}/admin/all`, { params });
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

  getContent: async (id: string): Promise<string> => {
    const response = await api.get<{ content: string }>(`${API_ROUTES.DOCUMENTS.BY_ID(id)}/content`);
    return response.data.content;
  },

  getByWorkspace: async (workspaceId: string): Promise<Document[]> => {
    const response = await api.get<Document[]>(API_ROUTES.DOCUMENTS.WORKSPACE(workspaceId));
    return response.data;
  },

  upload: async (file: File, name: string, workspaceIds: string[]): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    if (name) {
      formData.append('name', name);
    }
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

  updateContent: async (id: string, content: string): Promise<void> => {
    await api.patch(`${API_ROUTES.DOCUMENTS.BY_ID(id)}/content`, { content });
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

  download: async (id: string, isOnline: boolean): Promise<{ data: Blob, filename: string | null }> => {
    const endpoint = isOnline 
      ? `${API_ROUTES.DOCUMENTS.BY_ID(id)}/export/docx`
      : `${API_ROUTES.DOCUMENTS.BY_ID(id)}/download`;
      
    const response = await api.get(endpoint, {
      responseType: 'blob',
    });
    
    let filename: string | null = null;
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = decodeURIComponent(escape(match[1])); // Handle UTF-8 encoding if needed
      }
    }
    
    return { data: response.data, filename };
  },
};
