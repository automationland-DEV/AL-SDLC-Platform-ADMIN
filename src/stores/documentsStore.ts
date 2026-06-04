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
}

interface DocumentsActions {
  setDocuments: (documents: Document[], total: number, page: number, totalPages: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: (filter: string) => void;
  fetchDocuments: (page?: number, type?: string) => Promise<void>;
  createDocument: (data: Partial<Document>) => Promise<void>;
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

  setDocuments: (documents, total, page, totalPages) => set({ documents, total, page, totalPages }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setFilter: (filter) => set({ filter }),

  fetchDocuments: async (_page = 1, type = get().filter) => {
    set({ isLoading: true, error: null });
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await documentService.getAllAdmin();

      // Handle both array and paginated responses
      let documents: Document[] = [];
      let total = 0;

      if (Array.isArray(response)) {
        documents = response;
        total = response.length;
      } else {
        documents = response.data || [];
        total = response.total || documents.length;
      }

      // Filter by type if needed
      if (type !== 'all') {
        documents = documents.filter((doc) => doc.documentType === type);
        total = documents.length;
      }

      set({
        documents,
        total,
        page: 1,
        totalPages: 1,
        isLoading: false,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch documents';
      set({ error: message, isLoading: false });
    }
  },

  createDocument: async (data) => {
    set({ isLoading: true });
    try {
      await documentService.upload(data as unknown as File, data.workspaceIds || []);
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
