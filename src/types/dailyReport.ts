export type DailyReportMediaType = 'image' | 'video';

export interface AdminDailyReportMedia {
  publicId: string;
  url: string;
  type: DailyReportMediaType;
  name?: string;
  size?: number;
}

export interface AdminDailyReportReply {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  content: string;
  createdAt?: string;
}

export interface AdminDailyReport {
  id: string;
  workspaceId: string;
  reporterId: string;
  reporterName: string;
  reporterAvatar?: string | null;
  reportDate: string;
  content: string;
  plainText: string;
  media: AdminDailyReportMedia[];
  taskIds: string[];
  taskKeys: string[];
  taskTitles: string[];
  replies: AdminDailyReportReply[];
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Nhóm báo cáo theo từng người báo cáo, nằm trong một workspace. */
export interface AdminReporterGroup {
  reporterId: string;
  reporterName: string;
  reporterAvatar: string | null;
  total: number;
  reports: AdminDailyReport[];
}

/** Nhóm báo cáo theo workspace — đây là cách admin duyệt dữ liệu. */
export interface AdminWorkspaceReportGroup {
  workspaceId: string;
  workspaceName: string;
  workspaceKey: string;
  workspaceAvatar?: string;
  total: number;
  reporters: AdminReporterGroup[];
}

export interface AdminDailyReportList {
  workspaces: AdminWorkspaceReportGroup[];
  total: number;
}

export interface AdminWorkspaceOption {
  id: string;
  name: string;
  key: string;
  avatar?: string;
}

export interface AdminDailyReportQueryParams {
  workspaceId?: string;
  reporterId?: string;
  from?: string;
  to?: string;
  search?: string;
  limit?: number;
}
