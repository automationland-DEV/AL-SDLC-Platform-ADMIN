// User Types - matching FE-dev auth.types.ts
export type UserRole = 'super_admin' | 'user';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatar?: string;
  phone?: string;
  address?: string;
  birthday?: string;
  gender?: 'male' | 'female' | 'other';
  role: UserRole;
  status: UserStatus;
  mfaEnabled?: boolean;
  googleId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type UserStatus = 'pending_verification' | 'active' | 'inactive' | 'suspended';

export interface AuthUser extends User {
  permissions: Permission[];
}

export interface Permission {
  id?: string;
  resource: string;
  action: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  message: string;
}

// Workspace Types
export interface WorkspaceMember {
  userId: string | { _id?: string; id?: string; fullName?: string; email?: string; avatar?: string };
  role: WorkspaceRoleName;
}

export type WorkspaceRoleName = 'workspace_admin' | 'member' | 'viewer';
export type WorkspaceType = 'kanban' | 'scrum';
export type WorkspaceAccess = 'private' | 'public';

export interface Workspace {
  _id: string;
  name: string;
  key: string;
  slug?: string;
  avatar?: string;
  ownerId?: string | { _id?: string; id?: string; fullName?: string; email?: string; avatar?: string };
  members?: WorkspaceMember[];
  description?: string;
  visibility: WorkspaceAccess;
  template?: WorkspaceType;
  type?: WorkspaceType;
  status?: 'active' | 'archived';
  access?: WorkspaceAccess;
  settings?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

// Document Types
export interface Document {
  _id: string;
  uploadedBy?: string | { _id?: string; fullName?: string; email?: string; avatar?: string };
  name: string;
  originalName?: string;
  filename?: string;
  storagePath?: string;
  mimeType?: string;
  extension?: string;
  size?: number;
  documentType?: 'upload' | 'online';
  content?: string;
  workspaceIds?: string[];
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Chat Channel Types
export type ChannelType = 'general' | 'announcement' | 'workspace' | 'dm' | 'custom';

export interface ChannelMember {
  userId: string;
  role: 'channel_admin' | 'channel_member';
  joinedAt?: string;
  invitedBy?: string;
}

export interface ChannelLastMessage {
  content?: string;
  senderId?: string;
  senderName?: string;
  sentAt?: string;
  type?: string;
}

export interface ChatChannel {
  _id: string;
  name: string;
  description?: string;
  type: ChannelType;
  isPrivate?: boolean;
  workspaceId?: string | { _id?: string; name?: string; key?: string };
  members?: string[];
  channelMembers?: ChannelMember[];
  lastMessage?: ChannelLastMessage;
  createdBy?: string | { _id?: string; fullName?: string; email?: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatAttachment {
  url: string;
  name?: string;
  size?: number;
  type?: string;
  mimeType?: string;
}

export interface ChatMessage {
  _id: string;
  senderId?: { _id?: string; fullName?: string; email?: string; avatar?: string };
  content: string;
  type?: string;
  attachments?: ChatAttachment[];
  reactions?: Record<string, unknown>;
  isDeleted?: boolean;
  replyCount?: number;
  replyUsers?: { _id?: string; fullName?: string; avatar?: string }[];
  stickerId?: { url: string };
  editedAt?: string;
  replyToId?: { _id: string; senderId?: { _id?: string; fullName?: string; email?: string; avatar?: string }; content?: string; type?: string; stickerId?: { url: string } } | null;
  threadParentId?: string | null;
  lastReplyParticipants?: { userId?: string; _id?: string; fullName?: string; avatar?: string }[];
  createdAt: string;
  lastReplyAt?: string;
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

// Task Types
export interface TaskUserSummary {
  id: string;
  fullName?: string;
  email?: string;
  avatar?: string;
}

export interface TaskLabelSummary {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  workspaceId: string;
  sprintId?: string;
  boardId?: string;
  columnId?: string;
  key: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  rank?: string;
  version: number;
  assigneeId?: string;
  labels?: TaskLabelSummary[];
  reporterId: string;
  storyPoints?: number;
  startDate?: string;
  dueDate?: string;
  epicId?: string;
  isArchived: boolean;
  archivedAt?: string;
  archivedBy?: string;
  archivedByUser?: TaskUserSummary;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  timeLogged?: number;
  timeEstimated?: number;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
}
