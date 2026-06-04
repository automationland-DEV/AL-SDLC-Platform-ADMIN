// API Routes matching BE
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    USERS: '/auth/users',
    USER_ROLE: (id: string) => `/auth/users/${id}/role`,
    USER_STATUS: (id: string) => `/auth/users/${id}/status`,
    GOOGLE: '/auth/google',
    SSO_CALLBACK: '/auth/sso/callback',
  },
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    PROFILE: '/users/me',
  },
  WORKSPACES: {
    BASE: '/workspaces',
    ADMIN_ALL: '/workspaces/admin/all',
    BY_ID: (id: string) => `/workspaces/${id}`,
    MEMBERS: (id: string) => `/workspaces/${id}/members`,
    ADD_MEMBER: (id: string) => `/workspaces/${id}/members`,
    UPDATE_MEMBER: (workspaceId: string, userId: string) => `/workspaces/${workspaceId}/members/${userId}`,
    REMOVE_MEMBER: (workspaceId: string, userId: string) => `/workspaces/${workspaceId}/members/${userId}`,
    RESTORE: (id: string) => `/workspaces/${id}/restore`,
  },
  DOCUMENTS: {
    BASE: '/documents',
    BY_ID: (id: string) => `/documents/${id}`,
    CONTENT: (id: string) => `/documents/${id}/content`,
    WORKSPACE: (workspaceId: string) => `/documents/workspace/${workspaceId}`,
    UPLOAD: '/documents/upload',
    CREATE_ONLINE: '/documents/create-online',
  },
  PERMISSIONS: {
    BASE: '/permissionsapi',
    USER: (userId: string) => `/permissionsapi/user/${userId}`,
    INITIALIZE: '/permissionsapi/initialize',
  },
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5512';
