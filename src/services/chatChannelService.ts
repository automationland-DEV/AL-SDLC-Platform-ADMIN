import api from './api';
import { API_ROUTES } from './apiRoutes';
import type { ChatChannel, User, ChatMessage } from '../types';

export const chatChannelService = {
  getAllChannels: async (params?: {
    workspaceId?: string;
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
  }): Promise<{ channels: ChatChannel[]; total: number; page: number; limit: number }> => {
    const response = await api.get<unknown>(API_ROUTES.CHAT.ADMIN_CHANNELS, { params });
    const data = response.data;
    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.channels)) {
        return {
          channels: obj.channels as ChatChannel[],
          total: (obj.total as number) || obj.channels.length,
          page: (obj.page as number) || 1,
          limit: (obj.limit as number) || 20,
        };
      }
    }
    return { channels: [], total: 0, page: 1, limit: 20 };
  },

  getById: async (id: string): Promise<ChatChannel> => {
    const response = await api.get<unknown>(API_ROUTES.CHAT.ADMIN_CHANNEL_BY_ID(id));
    const data = response.data as Record<string, unknown>;
    return (data?.data ?? data) as ChatChannel;
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
    const response = await api.get<unknown>(
      API_ROUTES.CHAT.ADMIN_CHANNEL_MESSAGES(channelId),
      { params }
    );
    const body = (response.data as Record<string, unknown>)?.data ?? response.data;
    const bodyObj = body as Record<string, unknown> | ChatMessage[] | null;
    const messagesData = Array.isArray(bodyObj) ? bodyObj as ChatMessage[] : (Array.isArray((bodyObj as Record<string, unknown>)?.messages) ? (bodyObj as Record<string, unknown>).messages as ChatMessage[] : []);
    const nextCursor = !Array.isArray(bodyObj) && bodyObj ? (bodyObj as Record<string, unknown>).nextCursor as string | null : null;
    return { messages: messagesData, nextCursor: nextCursor || null };
  },

  getThreadReplies: async (channelId: string, messageId: string): Promise<ChatMessage[]> => {
    const response = await api.get<unknown>(
      API_ROUTES.CHAT.ADMIN_THREAD_REPLIES(channelId, messageId)
    );
    const rawData = response.data as Record<string, unknown> | ChatMessage[];
    return ((rawData as Record<string, unknown>)?.data ?? rawData) as ChatMessage[];
  },

  getActiveThreads: async (channelId: string): Promise<ChatMessage[]> => {
    const response = await api.get(API_ROUTES.CHAT.ADMIN_ACTIVE_THREADS(channelId));
    const data = response.data?.data ?? response.data;
    const threadsData = Array.isArray(data?.threads) ? data.threads : (Array.isArray(data) ? data : []);
    return threadsData;
  },

  searchMessages: async (channelId: string, query: string, senderId?: string): Promise<ChatMessage[]> => {
    const params: Record<string, string> = { q: query };
    if (senderId) params.senderId = senderId;
    const response = await api.get<{ messages?: ChatMessage[] } | ChatMessage[]>(
      API_ROUTES.CHAT.ADMIN_SEARCH_MESSAGES(channelId),
      { params }
    );
    const data = (response.data as Record<string, unknown>)?.data ?? response.data;
    if (Array.isArray(data)) return data as ChatMessage[];
    return (data as { messages?: ChatMessage[] })?.messages || [];
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
