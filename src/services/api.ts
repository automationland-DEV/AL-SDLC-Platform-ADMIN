import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import { API_BASE_URL } from './apiRoutes';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const AUTH_PATHS = ['/auth/refresh', '/auth/login'];

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (error?: unknown) => void;
}> = [];

const processQueue = (error: unknown | null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const requestPath = originalRequest?.url || '';

    if (AUTH_PATHS.some((path) => requestPath.includes(path))) {
      return Promise.reject(error);
    }

    if (error.response?.status === 429) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          const token = localStorage.getItem('accessToken');
          if (token && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post('/auth/refresh', {}, { withCredentials: true });
        const resData = response.data as Record<string, unknown>;
        const rawTokens = (resData?.tokens as Record<string, unknown>) || resData;
        const newToken =
          (rawTokens?.accessToken as string) ||
          (rawTokens?.access_token as string) ||
          (resData?.accessToken as string);

        if (newToken) {
          localStorage.setItem('accessToken', newToken);
        }

        processQueue(null);

        const token = localStorage.getItem('accessToken');
        if (token && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
