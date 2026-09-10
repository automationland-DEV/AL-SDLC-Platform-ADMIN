export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    USER_ROLE: (id: string) => `/auth/users/${id}/role`,
    USER_STATUS: (id: string) => `/auth/users/${id}/status`,
  },
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    ME: '/users/me',
    ME_PASSWORD: '/users/me/password',
  },
  WORKSPACES: {
    BASE: '/workspaces',
    OPTIONS: '/workspaces/options',
    BY_ID: (id: string) => `/workspaces/${id}`,
    MEMBERS: (id: string) => `/workspaces/${id}/members`,
    ADD_MEMBER: (id: string) => `/workspaces/${id}/members`,
    UPDATE_MEMBER: (workspaceId: string, userId: string) => `/workspaces/${workspaceId}/members/${userId}`,
    REMOVE_MEMBER: (workspaceId: string, userId: string) => `/workspaces/${workspaceId}/members/${userId}`,
    RESTORE: (id: string) => `/workspaces/${id}/restore`,
    ARCHIVE: (id: string) => `/workspaces/${id}/archive`,
  },
  DOCUMENTS: {
    BASE: '/documents',
    BY_ID: (id: string) => `/documents/${id}`,
  },
  DASHBOARD: {
    ADMIN_STATS: '/dashboard/stats',
    SDLC_STATS: '/dashboard/sdlc',
  },
  AUDIT: {
    LOGS: '/audit/logs',
    STATS: '/audit/stats',
    LOG_BY_ID: (id: string) => `/audit/logs/${id}`,
  },
  CHAT: {
    ADMIN_CHANNELS: '/chat/channels',
    ADMIN_CHANNEL_BY_ID: (id: string) => `/chat/channels/${id}`,
    CHANNEL_MEMBERS: (id: string) => `/chat/channels/${id}/members`,
    ADMIN_CHANNEL_MESSAGES: (id: string) => `/chat/channels/${id}/messages`,
    ADMIN_SEARCH_MESSAGES: (id: string) => `/chat/channels/${id}/messages/search`,
    ADMIN_THREAD_REPLIES: (channelId: string, messageId: string) => `/chat/channels/${channelId}/messages/${messageId}/replies`,
    ADMIN_ACTIVE_THREADS: (channelId: string) => `/chat/channels/${channelId}/threads`,
    DELETE_CHANNEL: (id: string) => `/chat/channels/${id}`,
    UPDATE_CHANNEL: (id: string) => `/chat/channels/${id}`,
    KICK_MEMBER: (channelId: string, userId: string) => `/chat/channels/${channelId}/members/${userId}`,
    UPDATE_MEMBER_ROLE: (channelId: string, userId: string) => `/chat/channels/${channelId}/members/${userId}`,
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
