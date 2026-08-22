import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AdminLayout } from './components/layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage, UnauthorizedPage } from './pages/auth';
import {
  DashboardPage,
  UsersPage,
  WorkspacesPage,
  DocumentsPage,
  ActivityPage,
  SettingsPage,
  ChatChannelsPage,
  ProfilePage,
  UserNewPage,
  UserImportPage,
  UserDetailPage,
  UserEditPage,
  WorkspaceNewPage,
  WorkspaceDetailPage,
  WorkspaceEditPage,
  DocNewPage,
  DocUploadPage,
  DocDetailPage,
  DocEditPage,
  ChannelDetailPage,
  ChatViewerPage,
} from './pages/admin';
import { useAuthStore } from './stores';
import { Toaster } from 'react-hot-toast';
import { useSettings } from './hooks/useSettings';

function App() {
  useSettings();
  const { checkAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Protected Admin Routes - Super Admin Only */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/new" element={<UserNewPage />} />
          <Route path="users/import" element={<UserImportPage />} />
          <Route path="users/:id" element={<UserDetailPage />} />
          <Route path="users/:id/edit" element={<UserEditPage />} />
          
          <Route path="workspaces" element={<WorkspacesPage />} />
          <Route path="workspaces/new" element={<WorkspaceNewPage />} />
          <Route path="workspaces/:id" element={<WorkspaceDetailPage />} />
          <Route path="workspaces/:id/edit" element={<WorkspaceEditPage />} />
          
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="documents/new" element={<DocNewPage />} />
          <Route path="documents/upload" element={<DocUploadPage />} />
          <Route path="documents/:id" element={<DocDetailPage />} />
          <Route path="documents/:id/edit" element={<DocEditPage />} />
          
          <Route path="channels" element={<ChatChannelsPage />} />
          <Route path="channels/:id" element={<ChannelDetailPage />} />
          <Route path="channels/:id/chat" element={<ChatViewerPage />} />
          <Route path="chat-channels" element={<Navigate to="/channels" replace />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
