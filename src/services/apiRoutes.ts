export const API_ROUTES = {
  AUTH: {
    LOGIN: '/admin/auth/login',
    LOGOUT: '/admin/auth/logout',
    ME: '/admin/auth/me',
    USER_ROLE: (id: string) => `/admin/auth/users/${id}/role`,
    USER_STATUS: (id: string) => `/admin/auth/users/${id}/status`,
  },
  USERS: {
    BASE: '/admin/users',
    BY_ID: (id: string) => `/admin/users/${id}`,
    ME: '/admin/users/me',
    ME_PASSWORD: '/admin/users/me/password',
  },
  WORKSPACES: {
    BASE: '/admin/workspaces',
    OPTIONS: '/admin/workspaces/options',
    BY_ID: (id: string) => `/admin/workspaces/${id}`,
    MEMBERS: (id: string) => `/admin/workspaces/${id}/members`,
    ADD_MEMBER: (id: string) => `/admin/workspaces/${id}/members`,
    UPDATE_MEMBER: (workspaceId: string, userId: string) => `/admin/workspaces/${workspaceId}/members/${userId}`,
    REMOVE_MEMBER: (workspaceId: string, userId: string) => `/admin/workspaces/${workspaceId}/members/${userId}`,
    RESTORE: (id: string) => `/admin/workspaces/${id}/restore`,
    ARCHIVE: (id: string) => `/admin/workspaces/${id}/archive`,
  },
  DOCUMENTS: {
    BASE: '/admin/documents',
    BY_ID: (id: string) => `/admin/documents/${id}`,
  },
  DASHBOARD: {
    ADMIN_STATS: '/admin/dashboard/stats',
  },
  AUDIT: {
    LOGS: '/admin/audit/logs',
    STATS: '/admin/audit/stats',
    LOG_BY_ID: (id: string) => `/admin/audit/logs/${id}`,
  },
  CHAT: {
    ADMIN_CHANNELS: '/admin/chat/channels',
    ADMIN_CHANNEL_BY_ID: (id: string) => `/admin/chat/channels/${id}`,
    CHANNEL_MEMBERS: (id: string) => `/admin/chat/channels/${id}/members`,
    ADMIN_CHANNEL_MESSAGES: (id: string) => `/admin/chat/channels/${id}/messages`,
    ADMIN_SEARCH_MESSAGES: (id: string) => `/admin/chat/channels/${id}/messages/search`,
    ADMIN_THREAD_REPLIES: (channelId: string, messageId: string) => `/admin/chat/channels/${channelId}/messages/${messageId}/replies`,
    ADMIN_ACTIVE_THREADS: (channelId: string) => `/admin/chat/channels/${channelId}/threads`,
  },
  ATTACHMENTS: {
    BASE: '/attachments',
  },
  IMAGES: {
    BASE: '/imagesapi',
    UPLOAD: '/imagesapi/upload',
  },
};

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== '') return envUrl;

  if (typeof window !== 'undefined' && window.location.hostname.includes('automationland.vn')) {
    return 'https://api-sdlc-platform.automationland.vn';
  }
  return 'http://localhost:5512';
};

export const API_BASE_URL = getApiBaseUrl();
