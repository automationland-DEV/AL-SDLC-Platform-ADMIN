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
    set({ user, isAuthenticated: !!user, isInitialized: true }),

  setLoading: (isLoading) => set({ isLoading }),

  setInitialized: (isInitialized) => set({ isInitialized }),

  setError: (error) => set({ error }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login({ email, password });
      let userObj = response?.user;
      if (!userObj) {
        userObj = await authService.getCurrentUser();
      }
      set({ user: userObj, isAuthenticated: true, isLoading: false, isInitialized: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      set({ error: message, isLoading: false, isInitialized: true });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem('accessToken');
      set({ user: null, isAuthenticated: false, isLoading: false, isInitialized: true });
    }
  },

  checkAuth: async () => {
    const state = useAuthStore.getState();
    if (state.isInitialized && state.isAuthenticated) return;

    set({ isLoading: true });
    try {
      const user = await authService.getCurrentUser();
      if (user && user.role) {
        set({ user, isAuthenticated: true, isLoading: false, isInitialized: true });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false, isInitialized: true });
      }
    } catch {
      localStorage.removeItem('accessToken');
      set({ user: null, isAuthenticated: false, isLoading: false, isInitialized: true });
    }
  },
}));

// Selector helpers
export const selectUser = (state: AuthStore) => state.user;
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated;
export const selectIsSuperAdmin = (state: AuthStore) => {
  const r = state.user?.role ? String(state.user.role).toLowerCase() : '';
  return r === 'super_admin' || r === 'admin';
};
