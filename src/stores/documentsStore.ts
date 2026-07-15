import { create } from 'zustand';
import type { Document } from '../types';
import { documentService } from '../services';

interface DocumentsState {
  documents: Document[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  filter: string;
  workspaceFilter: string;
  absoluteTotal: number;
}

interface DocumentsActions {
  setDocuments: (documents: Document[], total: number, page: number, totalPages: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: (filter: string) => void;
  setWorkspaceFilter: (workspaceFilter: string) => void;
  fetchDocuments: (page?: number, type?: string, workspaceId?: string) => Promise<void>;
  createDocument: (file: File, name: string, workspaceIds: string[]) => Promise<void>;
  updateDocument: (id: string, data: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

type DocumentsStore = DocumentsState & DocumentsActions;

export const useDocumentsStore = create<DocumentsStore>((set, get) => ({
  documents: [],
  total: 0,
  page: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
  filter: 'all',
  workspaceFilter: 'all',
  absoluteTotal: 0,

  setDocuments: (documents, total, page, totalPages) => set({ documents, total, page, totalPages }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setFilter: (filter) => set({ filter }),

  setWorkspaceFilter: (workspaceFilter) => set({ workspaceFilter }),

  fetchDocuments: async (_page = 1, type = get().filter, workspaceId = get().workspaceFilter) => {
    set({ isLoading: true, error: null });
    try {
      const params: Record<string, string | number> = { page: _page, limit: 20 };
      if (type !== 'all') params.type = type;
      if (workspaceId !== 'all') params.workspaceId = workspaceId;

      const response = await documentService.getAllAdmin(params);

      const documents = response.data || [];
      const total = response.total || 0;
      const totalPages = response.totalPages || 1;

      set((state) => ({
        documents,
        total,
        absoluteTotal: type === 'all' && workspaceId === 'all' && _page === 1 ? total : state.absoluteTotal || total,
        page: _page,
        totalPages,
        isLoading: false,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch documents';
      set({ error: message, isLoading: false });
    }
  },

  createDocument: async (file, name, workspaceIds) => {
    set({ isLoading: true });
    try {
      await documentService.upload(file, name, workspaceIds);
      await get().fetchDocuments();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create document';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateDocument: async (id, data) => {
    set({ isLoading: true });
    try {
      await documentService.update(id, data);
      await get().fetchDocuments();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update document';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteDocument: async (id) => {
    set({ isLoading: true });
    try {
      await documentService.delete(id);
      await get().fetchDocuments();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete document';
      set({ error: message, isLoading: false });
      throw error;
    }
  },
}));
