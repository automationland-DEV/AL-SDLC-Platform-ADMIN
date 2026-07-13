import api from './api';
import { API_ROUTES } from './apiRoutes';
import type { AuthUser, LoginRequest, LoginResponse, User, PaginatedResponse } from '../types';

// Auth Service
export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>(API_ROUTES.AUTH.LOGIN, data, {
      withCredentials: true,
    });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post(API_ROUTES.AUTH.LOGOUT, {}, { withCredentials: true });
    localStorage.removeItem('accessToken');
  },

  getCurrentUser: async (): Promise<AuthUser> => {
    const response = await api.get<AuthUser>(API_ROUTES.AUTH.ME, {
      withCredentials: true,
    });
    return response.data;
  },

  checkSuperAdmin: (user: User | null): boolean => {
    return user?.role === 'super_admin';
  },

  // Google OAuth - redirect to backend
  initiateGoogleLogin: (): void => {
    const callbackUrl = `${window.location.origin}/login`;
    window.location.href = `${API_ROUTES.AUTH.GOOGLE}?callback_url=${encodeURIComponent(callbackUrl)}`;
  },

  // Handle SSO callback after OAuth redirect
  handleSsoCallback: async (): Promise<AuthUser | null> => {
    try {
      const response = await api.post<{ user: AuthUser }>(
        API_ROUTES.AUTH.SSO_CALLBACK,
        {},
        { withCredentials: true }
      );
      return response.data.user;
    } catch {
      return null;
    }
  },
};

// User Service
export const userService = {
  getAllUsers: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<User>> => {
    const response = await api.get<PaginatedResponse<User>>(API_ROUTES.AUTH.USERS, { params });
    return response.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await api.get<User>(API_ROUTES.USERS.BY_ID(id));
    return response.data;
  },

  createUser: async (data: Partial<User>): Promise<User> => {
    const response = await api.post<User>(API_ROUTES.USERS.BASE, data);
    return response.data;
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

  importUsersCsv: async (file: File): Promise<{
    success: boolean;
    insertedCount: number;
    skippedCount: number;
    errors: string[];
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/users/import-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
