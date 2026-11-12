import api from './api';

export interface AvatarFrameItem {
  id: string;
  name: string;
  nameVi?: string;
  category: string;
  categoryVi?: string;
  fileName?: string;
}

export interface AvatarFrameCategory {
  id: string;
  name: string;
  nameVi: string;
}

export interface AdminAvatarFrameUser {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  avatarFrame?: string | null;
  role: string;
  status: string;
}

export interface AdminAvatarFrameOverview {
  totalFrames: number;
  totalUsersWithFrame: number;
  categories: AvatarFrameCategory[];
  catalog: AvatarFrameItem[];
  usersWithFrames: AdminAvatarFrameUser[];
}

export interface AdminAvatarFrameUserSearchItem {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  avatarFrame?: string | null;
  role: string;
  status: string;
}

/**
 * The admin API returns raw user documents (`_id`, `avatar`), while the admin
 * UI works with a normalised shape (`id`, `avatarUrl`). This maps the API
 * payload onto the shape the components expect.
 */
function normalizeUser(raw: unknown): AdminAvatarFrameUserSearchItem {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id ?? r._id ?? ''),
    fullName: typeof r.fullName === 'string' ? r.fullName : '',
    email: typeof r.email === 'string' ? r.email : '',
    avatarUrl:
      typeof r.avatarUrl === 'string'
        ? r.avatarUrl
        : typeof r.avatar === 'string'
          ? r.avatar
          : null,
    avatarFrame: typeof r.avatarFrame === 'string' ? r.avatarFrame : null,
    role: typeof r.role === 'string' ? r.role : 'user',
    status: typeof r.status === 'string' ? r.status : 'active',
  };
}

export const avatarFrameAdminService = {
  getOverview: async (): Promise<AdminAvatarFrameOverview> => {
    const res = await api.get('/admin/avatar-frames/overview');
    const data = res.data ?? {};
    return {
      totalFrames: data.totalFrames ?? 0,
      totalUsersWithFrame: data.totalUsersWithFrame ?? 0,
      categories: data.categories ?? [],
      catalog: data.catalog ?? [],
      usersWithFrames: (data.usersWithFrames ?? []).map(normalizeUser),
    };
  },

  searchUsers: async (search?: string, limit = 50): Promise<AdminAvatarFrameUserSearchItem[]> => {
    const res = await api.get('/admin/avatar-frames/users', {
      params: { search: search || undefined, limit },
    });
    const list = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
    return list.map(normalizeUser);
  },

  assignFrame: async (
    userId: string,
    frameId: string | null,
  ): Promise<{ success: boolean; avatarFrame: string | null; user: AdminAvatarFrameUser }> => {
    const res = await api.post('/admin/avatar-frames/assign', {
      userId,
      frameId,
    });
    const data = res.data ?? {};
    return {
      success: data.success ?? true,
      avatarFrame: data.avatarFrame ?? null,
      user: normalizeUser(data.user),
    };
  },
};
