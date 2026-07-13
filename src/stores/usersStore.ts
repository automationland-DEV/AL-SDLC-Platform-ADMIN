import { create } from 'zustand';
import type { User } from '../types';
import { userService } from '../services';

interface UsersState {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  search: string;
}

interface UsersActions {
  setUsers: (users: User[], total: number, page: number, totalPages: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearch: (search: string) => void;
  fetchUsers: (page?: number, search?: string) => Promise<void>;
  createUser: (data: Partial<User>) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateUserStatus: (id: string, status: string) => Promise<void>;
  updateUserRole: (id: string, role: string) => Promise<void>;
  importUsersCsv: (file: File) => Promise<{
    success: boolean;
    insertedCount: number;
    skippedCount: number;
    errors: string[];
  }>;
}

type UsersStore = UsersState & UsersActions;

export const useUsersStore = create<UsersStore>((set, get) => ({
  users: [],
  total: 0,
  page: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
  search: '',

  setUsers: (users, total, page, totalPages) => set({ users, total, page, totalPages }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setSearch: (search) => set({ search }),

  fetchUsers: async (page = 1, search = get().search) => {
    set({ isLoading: true, error: null });
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await userService.getAllUsers({ page, search, limit: 20 });

      // Handle both paginated and non-paginated responses
      let users: User[] = [];
      let total = 0;
      let currentPage = 1;
      let pages = 1;

      if (Array.isArray(response)) {
        // Non-paginated response
        users = response;
        total = response.length;
      } else if (response.pagination) {
        // Paginated with pagination object: { data: [...], pagination: { page, limit, total, totalPages } }
        users = response.data;
        total = response.pagination.total;
        currentPage = response.pagination.page;
        pages = response.pagination.totalPages;
      } else {
        // Paginated with flat fields: { data: [...], total, page, totalPages }
        users = response.data;
        total = response.total;
        currentPage = response.page;
        pages = response.totalPages;
      }

      set({
        users,
        total,
        page: currentPage,
        totalPages: pages,
        isLoading: false,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch users';
      set({ error: message, isLoading: false });
    }
  },

  createUser: async (data) => {
    set({ isLoading: true });
    try {
      await userService.createUser(data);
      await get().fetchUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateUser: async (id, data) => {
    set({ isLoading: true });
    try {
      await userService.updateUser(id, data);
      await get().fetchUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update user';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteUser: async (id) => {
    set({ isLoading: true });
    try {
      await userService.deleteUser(id);
      await get().fetchUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete user';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateUserRole: async (id, role) => {
    try {
      await userService.updateUserRole(id, role);
      await get().fetchUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update role';
      set({ error: message });
      throw error;
    }
  },

  updateUserStatus: async (id, status) => {
    try {
      await userService.updateUserStatus(id, status);
      await get().fetchUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update status';
      set({ error: message });
      throw error;
    }
  },

  importUsersCsv: async (file) => {
    set({ isLoading: true });
    try {
      const result = await userService.importUsersCsv(file);
      await get().fetchUsers();
      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to import users';
      set({ error: message, isLoading: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
