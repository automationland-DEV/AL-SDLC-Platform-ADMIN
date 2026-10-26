import api from './api';
import { API_ROUTES } from './apiRoutes';

export type MailBroadcastAudience = 'all' | 'role' | 'status' | 'selected';

export type MailBroadcastStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'failed'
  | 'cancelled';

export type MailDeliveryMode = 'internal' | 'both' | 'email';

export interface MailBroadcast {
  _id: string;
  subject: string;
  body: string;
  bodyHtml?: string | null;
  createdBy: string;
  createdByName: string;
  audience: MailBroadcastAudience;
  filters?: { role?: string | null; status?: string | null } | null;
  selectedRecipientIds: string[];
  deliveryMode: MailDeliveryMode;
  status: MailBroadcastStatus;
  scheduledAt?: string | null;
  sentAt?: string | null;
  totalRecipients: number;
  deliveredCount: number;
  failedCount: number;
  readCount: number;
  lastError?: string | null;
  templateId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MailTemplate {
  _id: string;
  name: string;
  subject: string;
  body: string;
  bodyHtml?: string | null;
  description?: string;
  category?: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MailAdminStats {
  totalBroadcasts: number;
  sentBroadcasts: number;
  scheduledBroadcasts: number;
  draftBroadcasts: number;
  failedBroadcasts: number;
  totalRecipients: number;
  totalDelivered: number;
  totalFailed: number;
}

export interface MailRecipient {
  id: string;
  email: string;
  fullName?: string;
  avatar?: string;
}

/** A mail exchanged inside the platform, as shown to the admin. */
export interface AdminMailMessage {
  id: string;
  subject: string;
  body: string;
  bodyHtml?: string | null;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderAvatar?: string | null;
  recipientIds: string[];
  recipientNames: string[];
  kind: 'direct' | 'broadcast';
  deliveryMode: MailDeliveryMode;
  broadcastId?: string | null;
  threadId?: string | null;
  readCount: number;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminMailDetail {
  message: AdminMailMessage;
  thread: { id: string; subject: string; participantIds: string[] } | null;
  messages: AdminMailMessage[];
}

export interface AdminInternalMailStats {
  totalInternal: number;
  totalBroadcast: number;
  totalThreads: number;
  unreadMessages: number;
  uniqueSenders: number;
  last7Days: number;
}

export interface MailMediaUpload {
  url: string;
  publicId: string;
  kind: 'image' | 'video';
  mimeType: string;
  size: number;
  originalName: string;
}

export interface CreateBroadcastPayload {
  subject: string;
  /** Plain-text body. Derived from `bodyHtml` by the backend when omitted. */
  body?: string;
  bodyHtml?: string;
  audience: MailBroadcastAudience;
  role?: string;
  status?: string;
  recipientIds?: string[];
  deliveryMode?: MailDeliveryMode;
  scheduledAt?: string;
  sendNow?: boolean;
  templateId?: string;
}

/** Only the audience selection is needed to count the recipients. */
export interface PreviewAudiencePayload {
  audience: MailBroadcastAudience;
  role?: string;
  status?: string;
  recipientIds?: string[];
}

export interface CreateTemplatePayload {
  name: string;
  subject: string;
  /** Plain-text body. Derived from `bodyHtml` by the backend when omitted. */
  body?: string;
  bodyHtml?: string;
  description?: string;
  category?: string;
}

interface Envelope<T> {
  success?: boolean;
  data?: T;
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

const unwrap = <T,>(raw: unknown): T => {
  const envelope = raw as Envelope<T> | null;
  if (envelope && typeof envelope === 'object' && 'data' in envelope) {
    return envelope.data as T;
  }
  return raw as T;
};

export const mailService = {
  getStats: async (): Promise<MailAdminStats> => {
    const response = await api.get(API_ROUTES.MAIL.ADMIN_STATS);
    return unwrap<MailAdminStats>(response.data);
  },

  listBroadcasts: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ broadcasts: MailBroadcast[]; total: number; page: number; limit: number }> => {
    const response = await api.get(API_ROUTES.MAIL.BROADCASTS, { params });
    const raw = response.data as Envelope<MailBroadcast[]>;
    const broadcasts = (raw?.data ?? []) as MailBroadcast[];

    return {
      broadcasts,
      total: raw?.pagination?.total ?? broadcasts.length,
      page: raw?.pagination?.page ?? params?.page ?? 1,
      limit: raw?.pagination?.limit ?? params?.limit ?? 20,
    };
  },

  getBroadcast: async (id: string): Promise<MailBroadcast> => {
    const response = await api.get(API_ROUTES.MAIL.BROADCAST_BY_ID(id));
    return unwrap<MailBroadcast>(response.data);
  },

  createBroadcast: async (payload: CreateBroadcastPayload): Promise<MailBroadcast> => {
    const response = await api.post(API_ROUTES.MAIL.BROADCASTS, payload);
    return unwrap<MailBroadcast>(response.data);
  },

  cancelBroadcast: async (id: string): Promise<MailBroadcast> => {
    const response = await api.patch(API_ROUTES.MAIL.CANCEL_BROADCAST(id));
    return unwrap<MailBroadcast>(response.data);
  },

  previewAudience: async (
    payload: PreviewAudiencePayload,
  ): Promise<{ count: number; sample: MailRecipient[] }> => {
    const response = await api.post(API_ROUTES.MAIL.AUDIENCE_PREVIEW, payload);
    return unwrap<{ count: number; sample: MailRecipient[] }>(response.data);
  },

  listTemplates: async (params?: {
    search?: string;
    category?: string;
    includeInactive?: boolean;
  }): Promise<MailTemplate[]> => {
    const response = await api.get(API_ROUTES.MAIL.TEMPLATES, { params });
    const raw = response.data as Envelope<MailTemplate[]>;
    return (raw?.data ?? []) as MailTemplate[];
  },

  createTemplate: async (payload: CreateTemplatePayload): Promise<MailTemplate> => {
    const response = await api.post(API_ROUTES.MAIL.TEMPLATES, payload);
    return unwrap<MailTemplate>(response.data);
  },

  updateTemplate: async (
    id: string,
    payload: Partial<CreateTemplatePayload> & { isActive?: boolean },
  ): Promise<MailTemplate> => {
    const response = await api.patch(API_ROUTES.MAIL.TEMPLATE_BY_ID(id), payload);
    return unwrap<MailTemplate>(response.data);
  },

  deleteTemplate: async (id: string): Promise<void> => {
    await api.delete(API_ROUTES.MAIL.TEMPLATE_BY_ID(id));
  },

  uploadMedia: async (file: File): Promise<MailMediaUpload> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(API_ROUTES.MAIL.MEDIA, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap<MailMediaUpload>(response.data);
  },

  searchRecipients: async (search: string, limit = 20): Promise<MailRecipient[]> => {
    const response = await api.get(API_ROUTES.MAIL.SEARCH_RECIPIENTS, {
      params: { search, limit },
    });
    const raw = response.data as Envelope<MailRecipient[]>;
    return (raw?.data ?? []) as MailRecipient[];
  },

  /** Every internal mail, including the ones users send to each other. */
  listInternalMessages: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    kind?: 'direct' | 'broadcast' | 'all';
    senderId?: string;
    recipientId?: string;
    from?: string;
    to?: string;
  }): Promise<{ messages: AdminMailMessage[]; total: number; page: number; limit: number }> => {
    const response = await api.get(API_ROUTES.MAIL.INTERNAL_MESSAGES, { params });
    const raw = response.data as Envelope<AdminMailMessage[]>;
    const messages = (raw?.data ?? []) as AdminMailMessage[];

    return {
      messages,
      total: raw?.pagination?.total ?? messages.length,
      page: raw?.pagination?.page ?? params?.page ?? 1,
      limit: raw?.pagination?.limit ?? params?.limit ?? 20,
    };
  },

  getInternalMailStats: async (): Promise<AdminInternalMailStats> => {
    const response = await api.get(API_ROUTES.MAIL.INTERNAL_MESSAGE_STATS);
    return unwrap<AdminInternalMailStats>(response.data);
  },

  getInternalMessage: async (id: string): Promise<AdminMailDetail> => {
    const response = await api.get(API_ROUTES.MAIL.INTERNAL_MESSAGE_BY_ID(id));
    return unwrap<AdminMailDetail>(response.data);
  },

  deleteInternalMessage: async (id: string, scope: 'message' | 'thread' = 'message'): Promise<void> => {
    await api.delete(API_ROUTES.MAIL.INTERNAL_MESSAGE_BY_ID(id), {
      params: scope === 'thread' ? { scope } : undefined,
    });
  },
};
