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
    ARCHIVE: (id: string) => `/workspaces/${id}/archive`,
  },
  DOCUMENTS: {
    BASE: '/documents',
    BY_ID: (id: string) => `/documents/${id}`,
    CONTENT: (id: string) => `/documents/${id}/content`,
    WORKSPACE: (workspaceId: string) => `/documents/workspace/${workspaceId}`,
    UPLOAD: '/documents/upload',
    CREATE_ONLINE: '/documents/create-online',
    DOWNLOAD: (id: string) => `/documents/${id}/download`,
    EXPORT_DOCX: (id: string) => `/documents/${id}/export/docx`,
  },
  PERMISSIONS: {
    BASE: '/permissionsapi',
    USER: (userId: string) => `/permissionsapi/user/${userId}`,
    INITIALIZE: '/permissionsapi/initialize',
  },
  AUDIT: {
    LOGS: '/audit/logs',
    STATS: '/audit/stats',
    LOG_BY_ID: (id: string) => `/audit/logs/${id}`,
  },
  CHAT: {
    CHANNELS: '/chat/channels',
    ADMIN_CHANNELS: '/chat/admin/channels',
    CHANNEL_BY_ID: (id: string) => `/chat/${id}`,
    CHANNEL_MEMBERS: (id: string) => `/chat/channels/${id}/members`,
    CHANNEL_MESSAGES: (id: string) => `/chat/channels/${id}/messages`,
    THREAD_REPLIES: (channelId: string, messageId: string) => `/chat/channels/${channelId}/messages/${messageId}/replies`,
    DELETE_CHANNEL: (id: string) => `/chat/channels/${id}`,
    UPDATE_CHANNEL: (id: string) => `/chat/channels/${id}`,
    KICK_MEMBER: (channelId: string, userId: string) => `/chat/channels/${channelId}/members/${userId}`,
    UPDATE_MEMBER_ROLE: (channelId: string, userId: string) => `/chat/channels/${channelId}/members/${userId}`,
    SEARCH_MESSAGES: (id: string) => `/chat/channels/${id}/messages/search`,
  },
  ATTACHMENTS: {
    BASE: '/attachments',
  },
  IMAGES: {
    BASE: '/imagesapi',
    UPLOAD: '/imagesapi/upload',
  }
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5512';
