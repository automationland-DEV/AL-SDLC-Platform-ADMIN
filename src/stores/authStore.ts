import { create } from 'zustand';
import type { AuthUser } from '../types';
import { authService } from '../services';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AuthActions {
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  error: null,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user }),

  setLoading: (isLoading) => set({ isLoading }),

  setInitialized: (isInitialized) => set({ isInitialized }),

  setError: (error) => set({ error }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login({ email, password });
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  checkAuth: async () => {
    // Skip if already initialized
    const state = useAuthStore.getState();
    if (state.isInitialized && state.isAuthenticated) return;

    set({ isLoading: true });
    try {
      const user = await authService.getCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false, isInitialized: true });
    } catch {
      // Clear any invalid tokens
      localStorage.removeItem('accessToken');
      set({ user: null, isAuthenticated: false, isLoading: false, isInitialized: true });
    }
  },
}));

// Selector helpers
export const selectUser = (state: AuthStore) => state.user;
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated;
export const selectIsSuperAdmin = (state: AuthStore) => state.user?.role === 'super_admin';
