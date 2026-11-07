import api from './api';
import { API_BASE_URL } from './apiRoutes';

export interface StickerOverviewStats {
  source: {
    name: string;
    version: number;
    packCount: number;
    stickerCount: number;
    keywordCount: number;
    mediaCount: number;
    datasetPath: string;
  };
  imported: {
    packCount: number;
    activePackCount: number;
    stickerCount: number;
    activeStickerCount: number;
    totalStorageBytes: number;
    totalUsageCount: number;
    storagePath: string;
  };
}

export interface SourceStickerPreview {
  id: string;
  dir: string;
  animatedType: string;
  width: number;
  height: number;
  frames: number;
  keywords: string[];
  thumbUrl: string;
  animatedUrl: string;
}

export interface SourcePackItem {
  cateId: string;
  name: string;
  customTitle: string;
  dir: string;
  count: number;
  topKeywords: string[];
  importedCount: number;
  isFullyImported: boolean;
  isPartiallyImported: boolean;
  isImported: boolean;
  backendPackActive: boolean | null;
  previewStickers: SourceStickerPreview[];
}

export interface SourceStickerItem {
  id: string;
  cateId: string;
  packName: string;
  packDir: string;
  dir: string;
  animated: string;
  thumb: string;
  animatedType: string;
  width: number;
  height: number;
  frames: number;
  keywords: string[];
  sourceThumbUrl: string;
  sourceAnimatedUrl: string;
  isImported: boolean;
  importedData: {
    _id: string;
    title: string;
    keywords?: string[];
    isActive: boolean;
    usageCount: number;
    animatedSize?: number;
    thumbSize?: number;
    animatedUrl: string;
    thumbUrl: string;
    storagePath?: string;
    updatedAt?: string;
  } | null;
}

export interface SourcePackDetail {
  cateId: string;
  name: string;
  dir: string;
  count: number;
  topKeywords: string[];
  importedCount: number;
  isFullyImported: boolean;
  importedPack: {
    _id: string;
    title: string;
    description: string;
    isActive: boolean;
    order: number;
    stickerCount: number;
    storagePath: string;
  } | null;
  stickers: SourceStickerItem[];
}

export interface ImportedStickerItem {
  _id: string;
  stickerId: string;
  cateId: string;
  packDir: string;
  dir: string;
  title: string;
  keywords: string[];
  animatedFile: string;
  thumbFile: string;
  animatedType: string;
  width: number;
  height: number;
  frames: number;
  animatedSize: number;
  thumbSize: number;
  animatedMd5: string;
  thumbMd5: string;
  animatedUrl: string;
  thumbUrl: string;
  storagePath: string;
  isActive: boolean;
  order: number;
  usageCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImportedPackItem {
  _id: string;
  cateId: string;
  name: string;
  title: string;
  description: string;
  dir: string;
  topKeywords: string[];
  stickerCount: number;
  activeStickerCount: number;
  sourceStickerCount: number;
  totalStorageBytes: number;
  coverStickerId: string;
  coverThumbUrl: string;
  coverAnimatedUrl: string;
  storagePath: string;
  isActive: boolean;
  order: number;
  previewStickers: ImportedStickerItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ImportedPackDetail extends ImportedPackItem {
  stickers: ImportedStickerItem[];
}

const unwrap = <T,>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const inner = (payload as { data?: unknown }).data;
    if (inner !== undefined && inner !== null) {
      return inner as T;
    }
  }
  return payload as T;
};

export function resolveStickerMediaUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = API_BASE_URL.replace(/\/$/, '');
  const pathPart = url.startsWith('/') ? url : `/${url}`;
  return `${base}${pathPart}`;
}

export function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const stickerService = {
  getOverview: async (): Promise<StickerOverviewStats> => {
    const res = await api.get('/admin/stickers/overview');
    return unwrap<StickerOverviewStats>(res.data);
  },

  listSourcePacks: async (params: {
    search?: string;
    status?: 'all' | 'imported' | 'partial' | 'not_imported';
    page?: number;
    limit?: number;
  }) => {
    const res = await api.get('/admin/stickers/source/packs', { params });
    return unwrap<{
      items: SourcePackItem[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(res.data);
  },

  getSourcePackDetail: async (cateId: string): Promise<SourcePackDetail> => {
    const res = await api.get(`/admin/stickers/source/packs/${encodeURIComponent(cateId)}`);
    return unwrap<SourcePackDetail>(res.data);
  },

  searchSourceStickers: async (params: {
    search?: string;
    cateId?: string;
    animatedType?: string;
    status?: 'all' | 'imported' | 'not_imported';
    page?: number;
    limit?: number;
  }) => {
    const res = await api.get('/admin/stickers/source/stickers', { params });
    return unwrap<{
      items: SourceStickerItem[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(res.data);
  },

  getSourceStickerRawDetail: async (cateId: string, stickerId: string) => {
    const res = await api.get(
      `/admin/stickers/source/items/${encodeURIComponent(cateId)}/${encodeURIComponent(stickerId)}`,
    );
    return unwrap<Record<string, any>>(res.data);
  },

  importToBackend: async (payload: {
    items?: Array<{ cateId: string; stickerId: string }>;
    cateIds?: string[];
    customPackTitle?: string;
    isActive?: boolean;
  }) => {
    const res = await api.post('/admin/stickers/import', payload);
    return unwrap<{
      importedStickerCount: number;
      affectedPackCount: number;
      copiedFilesCount: number;
      backendStoragePath: string;
    }>(res.data);
  },

  listImportedPacks: async (params?: {
    search?: string;
    status?: 'all' | 'active' | 'inactive';
  }) => {
    const res = await api.get('/admin/stickers/imported/packs', { params });
    return unwrap<{ items: ImportedPackItem[]; total: number }>(res.data);
  },

  getImportedPackDetail: async (cateId: string): Promise<ImportedPackDetail> => {
    const res = await api.get(`/admin/stickers/imported/packs/${encodeURIComponent(cateId)}`);
    return unwrap<ImportedPackDetail>(res.data);
  },

  listImportedStickers: async (params?: {
    search?: string;
    cateId?: string;
    status?: 'all' | 'active' | 'inactive';
    animatedType?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await api.get('/admin/stickers/imported/items', { params });
    return unwrap<{
      items: ImportedStickerItem[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(res.data);
  },

  updateImportedPack: async (
    cateId: string,
    payload: {
      title?: string;
      description?: string;
      topKeywords?: string[];
      coverStickerId?: string;
      isActive?: boolean;
      order?: number;
    },
  ): Promise<ImportedPackItem> => {
    const res = await api.patch(
      `/admin/stickers/imported/packs/${encodeURIComponent(cateId)}`,
      payload,
    );
    return unwrap<ImportedPackItem>(res.data);
  },

  updateImportedSticker: async (
    stickerId: string,
    payload: {
      title?: string;
      keywords?: string[];
      isActive?: boolean;
      order?: number;
    },
  ): Promise<ImportedStickerItem> => {
    const res = await api.patch(
      `/admin/stickers/imported/items/${encodeURIComponent(stickerId)}`,
      payload,
    );
    return unwrap<ImportedStickerItem>(res.data);
  },

  useSticker: async (stickerId: string): Promise<ImportedStickerItem> => {
    const res = await api.post(
      `/admin/stickers/imported/items/${encodeURIComponent(stickerId)}/use`,
    );
    return unwrap<ImportedStickerItem>(res.data);
  },

  deleteImportedSticker: async (stickerId: string) => {
    const res = await api.delete(
      `/admin/stickers/imported/items/${encodeURIComponent(stickerId)}`,
    );
    return unwrap<{ deletedStickerId: string; cateId: string; remainingInPack: number }>(
      res.data,
    );
  },

  deleteImportedPack: async (cateId: string) => {
    const res = await api.delete(
      `/admin/stickers/imported/packs/${encodeURIComponent(cateId)}`,
    );
    return unwrap<{ deletedCateId: string; deletedStickerCount: number }>(res.data);
  },

  syncAllToBackend: async () => {
    const res = await api.post('/admin/stickers/sync-all');
    return unwrap<{
      alreadySeeded: boolean;
      packCount: number;
      activePackCount: number;
      stickerCount: number;
      activeStickerCount: number;
    }>(res.data);
  },

  bulkUpdateVisibility: async (payload: {
    cateIds?: string[];
    stickerIds?: string[];
    applyToAllPacks?: boolean;
    cascadeStickers?: boolean;
    isActive: boolean;
  }) => {
    const res = await api.post('/admin/stickers/visibility/bulk', payload);
    return unwrap<{
      isActive: boolean;
      modifiedPacks: number;
      modifiedStickers: number;
      activePackCount: number;
      activeStickerCount: number;
    }>(res.data);
  },
};

