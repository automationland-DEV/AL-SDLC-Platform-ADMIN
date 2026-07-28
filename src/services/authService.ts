import api from './api';
import { API_ROUTES, API_BASE_URL } from './apiRoutes';
import type { AuthUser, LoginRequest, LoginResponse, User, PaginatedResponse } from '../types';

// Auth Service
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
      // Ignore logout errors
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

  initiateGoogleLogin: (): void => {
    const callbackUrl = `${window.location.origin}/login`;
    const fullUrl = API_ROUTES.AUTH.GOOGLE.startsWith('http')
      ? API_ROUTES.AUTH.GOOGLE
      : `${API_BASE_URL}${API_ROUTES.AUTH.GOOGLE}`;
    window.location.href = `${fullUrl}?callback_url=${encodeURIComponent(callbackUrl)}`;
  },

  handleSsoCallback: async (): Promise<AuthUser | null> => {
    try {
      const response = await api.post<{ user: AuthUser }>(
        API_ROUTES.AUTH.SSO_CALLBACK,
        {},
        { withCredentials: true }
      );
      const resData = response.data as unknown as Record<string, unknown>;
      const token =
        (resData?.accessToken as string) ||
        (resData?.access_token as string) ||
        ((resData?.data as Record<string, unknown>)?.accessToken as string);

      if (token) {
        localStorage.setItem('accessToken', token);
      }

      return (
        response.data?.user ||
        ((response.data as unknown as Record<string, unknown>)?.data as AuthUser) ||
        (response.data as unknown as AuthUser)
      );
    } catch {
      return null;
    }
  },
};

export const userService = {
  getAllUsers: async (params?: { page?: number; limit?: number; search?: string; role?: string; status?: string }): Promise<PaginatedResponse<User>> => {
    const response = await api.get<PaginatedResponse<User>>(API_ROUTES.AUTH.USERS, { params });
    return response.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await api.get<User>(API_ROUTES.USERS.BY_ID(id));
    return response.data;
  },

  updateProfile: async (data: Partial<User> & { currentPassword?: string; password?: string }): Promise<User> => {
    const response = await api.put<User>(API_ROUTES.USERS.PROFILE, data);
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
