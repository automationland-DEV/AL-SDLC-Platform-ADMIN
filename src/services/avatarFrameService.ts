import api from './api';

export interface AvatarFrameItem {
  id: string;
  name: string;
  category: string;
  filename: string;
  previewUrl: string;
  mediaUrl: string;
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

export const avatarFrameAdminService = {
  getOverview: async (): Promise<AdminAvatarFrameOverview> => {
    const res = await api.get('/admin/avatar-frames/overview');
    return res.data;
  },

  searchUsers: async (search?: string, limit = 50): Promise<AdminAvatarFrameUserSearchItem[]> => {
    const res = await api.get('/admin/avatar-frames/users', {
      params: { search: search || undefined, limit },
    });
    return res.data;
  },

  assignFrame: async (
    userId: string,
    frameId: string | null,
  ): Promise<{ success: boolean; avatarFrame: string | null; user: AdminAvatarFrameUser }> => {
    const res = await api.post('/admin/avatar-frames/assign', {
      userId,
      frameId,
    });
    return res.data;
  },
};
