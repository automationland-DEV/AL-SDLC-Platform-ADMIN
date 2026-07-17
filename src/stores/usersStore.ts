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
  absoluteTotal: number;
}

interface UsersActions {
  setUsers: (users: User[], total: number, page: number, totalPages: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearch: (search: string) => void;
  fetchUsers: (page?: number, search?: string, role?: string, status?: string) => Promise<void>;
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
  absoluteTotal: 0,

  setUsers: (users, total, page, totalPages) => set({ users, total, page, totalPages }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setSearch: (search) => set({ search }),

  fetchUsers: async (page = 1, search = get().search, role?: string, status?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await userService.getAllUsers({ page, search, limit: 20, role, status }) as unknown;

      // Handle both paginated and non-paginated responses
      let users: User[] = [];
      let total = 0;
      let currentPage = 1;
      let pages = 1;

      if (Array.isArray(response)) {
        // Non-paginated response
        users = response as User[];
        total = users.length;
      } else if (response && typeof response === 'object') {
        const resObj = response as Record<string, unknown>;
        if (resObj.pagination && typeof resObj.pagination === 'object') {
          // Paginated with pagination object: { data: [...], pagination: { page, limit, total, totalPages } }
          const pagination = resObj.pagination as Record<string, unknown>;
          users = (resObj.data as User[]) || [];
          total = (pagination.total as number) || 0;
          currentPage = (pagination.page as number) || 1;
          pages = (pagination.totalPages as number) || 1;
        } else {
          // Paginated with flat fields: { data: [...], total, page, totalPages }
          users = (resObj.data as User[]) || [];
          total = (resObj.total as number) || 0;
          currentPage = (resObj.page as number) || 1;
          pages = (resObj.totalPages as number) || 1;
        }
      }

      const isUnfiltered = !search && (!role || role === 'all') && (!status || status === 'all');

      set((state) => ({
        users,
        total,
        absoluteTotal: isUnfiltered ? total : state.absoluteTotal || total,
        page: currentPage,
        totalPages: pages,
        isLoading: false,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch users';
      set({ error: message, isLoading: false });
    }
  },

  createUser: async (data) => {
    try {
      await userService.createUser(data);
      await get().fetchUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      set({ error: message });
      throw error;
    }
  },

  updateUser: async (id, data) => {
    try {
      await userService.updateUser(id, data);
      await get().fetchUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update user';
      set({ error: message });
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      await userService.deleteUser(id);
      await get().fetchUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete user';
      set({ error: message });
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
