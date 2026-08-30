import api from './api';
import { API_ROUTES } from './apiRoutes';
import type { Document, PaginatedResponse } from '../types';

export const documentService = {
  getAllAdmin: async (params?: { page?: number; limit?: number; search?: string; type?: string; workspaceId?: string }): Promise<PaginatedResponse<Document>> => {
    const response = await api.get<unknown>(API_ROUTES.DOCUMENTS.BASE, { params });
    const raw = response.data;
    
    let items: Document[] = [];
    if (Array.isArray(raw)) items = raw;
    else if (Array.isArray(raw?.data)) items = raw.data;
    else if (Array.isArray(raw?.documents)) items = raw.documents;

    let total = items.length;
    let totalPages = 1;
    if (raw && typeof raw.total === 'number') {
      total = raw.total;
      totalPages = raw.totalPages || 1;
    } else if (raw?.pagination) {
      total = raw.pagination.total || items.length;
      totalPages = raw.pagination.totalPages || 1;
    }

    return { data: items, total, page: params?.page || 1, limit: params?.limit || 20, totalPages };
  },

  getById: async (id: string): Promise<Document> => {
    const response = await api.get<Document>(API_ROUTES.DOCUMENTS.BY_ID(id));
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(API_ROUTES.DOCUMENTS.BY_ID(id));
  },
};
