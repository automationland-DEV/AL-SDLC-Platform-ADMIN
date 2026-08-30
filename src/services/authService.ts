import api from './api';
import { API_ROUTES } from './apiRoutes';
import type { AuthUser, LoginRequest, LoginResponse, User, PaginatedResponse } from '../types';

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>(API_ROUTES.AUTH.LOGIN, data, {
      withCredentials: true,
    });
    const resData = response.data as unknown as Record<string, unknown>;
    const token =
      (resData?.accessToken as string) ||
      (resData?.access_token as string) ||
      ((resData?.data as Record<string, unknown>)?.accessToken as string) ||
      ((resData?.data as Record<string, unknown>)?.access_token as string);

    if (token) {
      localStorage.setItem('accessToken', token);
    }

    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post(API_ROUTES.AUTH.LOGOUT, {}, { withCredentials: true });
    } catch {
      // Logout errors are intentionally ignored
    } finally {
      localStorage.removeItem('accessToken');
    }
  },

  getCurrentUser: async (): Promise<AuthUser> => {
    const response = await api.get<AuthUser>(API_ROUTES.AUTH.ME, {
      withCredentials: true,
    });
    const data = response.data as unknown as Record<string, unknown>;
    if (data && data.data && typeof data.data === 'object') {
      return data.data as AuthUser;
    }
    return response.data;
  },

  checkSuperAdmin: (user: User | null): boolean => {
    if (!user || !user.role) return false;
    const r = user.role.toLowerCase();
    return r === 'super_admin' || r === 'admin';
  },
};

export const userService = {
  getAllUsers: async (params?: { page?: number; limit?: number; search?: string; role?: string; status?: string }): Promise<PaginatedResponse<User>> => {
    const response = await api.get<unknown>(API_ROUTES.USERS.BASE, { params });
    const raw = response.data;
    
    let items: User[] = [];
    if (Array.isArray(raw)) items = raw;
    else if (Array.isArray(raw?.data)) items = raw.data;
    else if (Array.isArray(raw?.users)) items = raw.users;

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

  getUserById: async (id: string): Promise<User> => {
    const response = await api.get<User>(API_ROUTES.USERS.BY_ID(id));
    return response.data;
  },

  updateProfile: async (data: {
    fullName?: string;
    phone?: string;
    address?: string;
    birthday?: string;
    gender?: string;
    avatar?: string;
  }): Promise<User> => {
    const response = await api.put<User>(API_ROUTES.USERS.ME, data);
    return response.data;
  },

  updatePassword: async (data: { currentPassword: string; password: string }): Promise<void> => {
    await api.put(API_ROUTES.USERS.ME_PASSWORD, data);
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.put<User>(API_ROUTES.USERS.BY_ID(id), data);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(API_ROUTES.USERS.BY_ID(id));
  },

  updateUserRole: async (id: string, role: string): Promise<User> => {
    const response = await api.put<User>(API_ROUTES.AUTH.USER_ROLE(id), { role });
    return response.data;
  },

  updateUserStatus: async (id: string, status: string): Promise<User> => {
    const response = await api.put<User>(API_ROUTES.AUTH.USER_STATUS(id), { status });
    return response.data;
  },
};
