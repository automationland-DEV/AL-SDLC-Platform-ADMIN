import api from './api';
import { API_ROUTES } from './apiRoutes';
import type { Document, PaginatedResponse } from '../types';

export const documentService = {
  getAllAdmin: async (params?: { page?: number; limit?: number; search?: string; type?: string; workspaceId?: string }): Promise<PaginatedResponse<Document>> => {
    const response = await api.get<unknown>(API_ROUTES.DOCUMENTS.BASE, { params });
    const raw = response.data as Record<string, unknown> | Document[] | null;
    
    let items: Document[] = [];
    if (Array.isArray(raw)) items = raw as Document[];
    else if (raw && Array.isArray((raw as Record<string, unknown>).data)) items = (raw as Record<string, unknown>).data as Document[];
    else if (raw && Array.isArray((raw as Record<string, unknown>).documents)) items = (raw as Record<string, unknown>).documents as Document[];

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

  getById: async (id: string): Promise<Document> => {
    const response = await api.get<unknown>(API_ROUTES.DOCUMENTS.BY_ID(id));
    const raw = response.data as Record<string, unknown>;
    return (raw?.data ?? raw) as Document;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(API_ROUTES.DOCUMENTS.BY_ID(id));
  },

  upload: async (file: File, name: string, workspaceIds: string[]): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    workspaceIds.forEach((id) => formData.append('workspaceIds[]', id));
    const response = await api.post<unknown>(API_ROUTES.DOCUMENTS.BASE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const raw = response.data as Record<string, unknown>;
    return (raw?.data ?? raw) as Document;
  },

  createOnline: async (name: string, content: string, workspaceIds: string[]): Promise<Document> => {
    const response = await api.post<unknown>(API_ROUTES.DOCUMENTS.BASE, { name, content, workspaceIds, documentType: 'online' });
    const raw = response.data as Record<string, unknown>;
    return (raw?.data ?? raw) as Document;
  },

  update: async (id: string, data: Partial<Document>): Promise<Document> => {
    const response = await api.put<unknown>(API_ROUTES.DOCUMENTS.BY_ID(id), data);
    const raw = response.data as Record<string, unknown>;
    return (raw?.data ?? raw) as Document;
  },

  getContent: async (id: string): Promise<string> => {
    const response = await api.get<unknown>(`${API_ROUTES.DOCUMENTS.BY_ID(id)}/content`);
    const data = response.data as Record<string, unknown> | string;
    if (typeof data === 'string') return data;
    if (data && typeof data === 'object') {
      if (typeof data.content === 'string') return data.content;
      const nested = data.data as Record<string, unknown> | string | undefined;
      if (typeof nested === 'string') return nested;
      if (nested && typeof nested === 'object' && typeof nested.content === 'string') return nested.content;
    }
    return '';
  },

  download: async (id: string, isOnline?: boolean, defaultFilename?: string): Promise<{ data: Blob; filename: string }> => {
    const url = isOnline
      ? `${API_ROUTES.DOCUMENTS.BY_ID(id)}/export`
      : `${API_ROUTES.DOCUMENTS.BY_ID(id)}/download`;
    const response = await api.get<Blob>(url, { responseType: 'blob' });
    const disposition = (response.headers['content-disposition'] as string) || '';

    let filename = '';
    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match && utf8Match[1]) {
      try {
        filename = decodeURIComponent(utf8Match[1]);
      } catch {
        filename = utf8Match[1];
      }
    } else {
      const match = disposition.match(/filename[^;=\n]*=((['"]).+?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = match[1].replace(/["']/g, '').trim();
        try {
          filename = decodeURIComponent(filename);
        } catch {
          filename = match[1].replace(/["']/g, '').trim();
        }
      }
    }

    const resolvedFilename = filename || defaultFilename || 'document';
    return { data: response.data, filename: resolvedFilename };
  },
};
