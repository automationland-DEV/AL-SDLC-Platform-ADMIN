import api from './api';

export type StorageSourceType = 'image' | 'attachment' | 'feed' | 'daily-report';

export type StorageUsageBreakdown = {
  imageBytes: number;
  attachmentBytes: number;
  feedBytes: number;
  dailyReportBytes: number;
};

export type AdminStorageUserItem = {
  userId: string;
  email: string;
  fullName?: string;
  avatar?: string;
  role: string;
  status: string;
  usedBytes: number;
  quotaBytes: number;
  customQuota: boolean;
  percentUsed: number;
  breakdown: StorageUsageBreakdown;
};

export type AdminStorageOverview = {
  usedBytes: number;
  breakdown: StorageUsageBreakdown;
  defaultQuotaBytes: number;
};

export type StorageMediaItem = {
  id: string;
  source: StorageSourceType;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
  targetType?: string;
  targetId?: string;
};

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const idx = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, idx);
  return `${value >= 100 ? Math.round(value) : Math.round(value * 100) / 100} ${units[idx]}`;
}

export const storageService = {
  getOverview: async (): Promise<AdminStorageOverview> => {
    const res = await api.get('/admin/storage/overview');
    return (res.data?.data ?? res.data) as AdminStorageOverview;
  },

  getUsers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    minPercentUsed?: number;
  }): Promise<{
    items: AdminStorageUserItem[];
    total: number;
    page: number;
    limit: number;
    defaultQuotaBytes: number;
  }> => {
    const res = await api.get('/admin/storage/users', { params });
    const body = res.data ?? {};
    return {
      items: (body.data ?? []) as AdminStorageUserItem[],
      total: body.pagination?.total ?? 0,
      page: body.pagination?.page ?? params.page ?? 1,
      limit: body.pagination?.limit ?? params.limit ?? 20,
      defaultQuotaBytes: body.meta?.defaultQuotaBytes ?? 0,
    };
  },

  setQuota: async (
    userId: string,
    quotaBytes: number,
    note?: string,
  ): Promise<void> => {
    await api.put(`/admin/storage/users/${userId}/quota`, { quotaBytes, note });
  },

  clearQuota: async (userId: string): Promise<void> => {
    await api.delete(`/admin/storage/users/${userId}/quota`);
  },

  getUserMedia: async (params: {
    userId: string;
    page?: number;
    limit?: number;
    source?: StorageSourceType;
  }): Promise<{ items: StorageMediaItem[]; total: number }> => {
    const res = await api.get('/admin/storage/media', { params });
    const body = res.data ?? {};
    return {
      items: (body.data ?? []) as StorageMediaItem[],
      total: body.pagination?.total ?? 0,
    };
  },

  deleteUserMedia: async (
    items: Array<{ source: StorageSourceType; id: string }>,
  ): Promise<{ deleted: number; skipped: number }> => {
    const res = await api.delete('/admin/storage/media', { data: { items } });
    return (res.data?.data ?? { deleted: 0, skipped: 0 }) as {
      deleted: number;
      skipped: number;
    };
  },
};
