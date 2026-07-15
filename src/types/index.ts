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
