import api from './api';
import { API_ROUTES } from './apiRoutes';
import type { ChatChannel, User, ChatMessage } from '../types';

export const chatChannelService = {
  getAllChannels: async (params?: { workspaceId?: string }): Promise<ChatChannel[]> => {
    const response = await api.get<ChatChannel[]>(API_ROUTES.CHAT.ADMIN_CHANNELS, { params });
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && 'data' in data) return (data as { data: ChatChannel[] }).data || [];
    return [];
  },

  getById: async (id: string): Promise<ChatChannel> => {
    const response = await api.get<ChatChannel>(API_ROUTES.CHAT.CHANNEL_BY_ID(id));
    return response.data;
  },

  getMembers: async (channelId: string): Promise<User[]> => {
    const response = await api.get<User[]>(API_ROUTES.CHAT.CHANNEL_MEMBERS(channelId));
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && 'data' in data) return (data as { data: User[] }).data || [];
    return [];
  },

  deleteChannel: async (id: string): Promise<void> => {
    await api.delete(API_ROUTES.CHAT.DELETE_CHANNEL(id));
  },

  updateChannel: async (id: string, data: Partial<ChatChannel>): Promise<ChatChannel> => {
    const response = await api.patch<ChatChannel>(API_ROUTES.CHAT.UPDATE_CHANNEL(id), data);
    return response.data;
  },

  kickMember: async (channelId: string, userId: string): Promise<void> => {
    await api.delete(API_ROUTES.CHAT.KICK_MEMBER(channelId, userId));
  },

  updateMemberRole: async (channelId: string, userId: string, role: string): Promise<void> => {
    await api.patch(API_ROUTES.CHAT.UPDATE_MEMBER_ROLE(channelId, userId), { role });
  },

  getMessages: async (channelId: string, cursor?: string, limit: number = 50): Promise<{ messages: ChatMessage[]; nextCursor: string | null }> => {
    const params: Record<string, unknown> = { limit };
    if (cursor) params.cursor = cursor;
    const response = await api.get<{ messages: ChatMessage[]; nextCursor: string | null }>(
      API_ROUTES.CHAT.CHANNEL_MESSAGES(channelId),
      { params }
    );
    return response.data;
  },

  getThreadReplies: async (channelId: string, messageId: string): Promise<ChatMessage[]> => {
    const response = await api.get<ChatMessage[]>(API_ROUTES.CHAT.THREAD_REPLIES(channelId, messageId));
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && 'data' in data) return (data as { data: ChatMessage[] }).data || [];
    return [];
  },

  getActiveThreads: async (channelId: string): Promise<ChatMessage[]> => {
    const response = await api.get(`/chat/channels/${channelId}/threads`);
    const data = response.data?.data ?? response.data;
    const threadsData = Array.isArray(data?.threads) ? data.threads : (Array.isArray(data) ? data : []);
    return threadsData;
  },

  searchMessages: async (channelId: string, query: string, senderId?: string): Promise<ChatMessage[]> => {
    const params: Record<string, string> = { q: query };
    if (senderId) params.senderId = senderId;
    const response = await api.get<{ messages?: ChatMessage[] } | ChatMessage[]>(
      API_ROUTES.CHAT.SEARCH_MESSAGES(channelId),
      { params }
    );
    const data = response.data;
    if (Array.isArray(data)) return data;
    return data?.messages || [];
  },

  getAttachments: async (channelId: string): Promise<unknown[]> => {
    const response = await api.get<{ data?: unknown[] } | unknown[]>(API_ROUTES.ATTACHMENTS.BASE, {
      params: { targetType: 'channel', targetId: channelId }
    });
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && 'data' in data) return (data as { data: unknown[] }).data || [];
    return [];
  },

  getImages: async (channelId: string): Promise<unknown[]> => {
    const response = await api.get<{ data?: unknown[], images?: unknown[] } | unknown[]>(API_ROUTES.IMAGES.BASE, {
      params: { targetType: 'channel', targetId: channelId, limit: 100 }
    });
    const imagesResData = response.data;
    if (Array.isArray(imagesResData)) return imagesResData;
    if (imagesResData && typeof imagesResData === 'object') {
      const obj = imagesResData as { images?: unknown[], data?: unknown[] };
      if (Array.isArray(obj.images)) return obj.images;
      if (Array.isArray(obj.data)) return obj.data;
    }
    return [];
  },
};
