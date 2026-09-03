import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { AdminLayout } from './components/layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage, UnauthorizedPage } from './pages/auth';
import { useAuthStore } from './stores';
import { Toaster } from 'react-hot-toast';
import { useSettings } from './hooks/useSettings';

const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const UsersPage = lazy(() => import('./pages/admin/users/UsersPage'));
const UserNewPage = lazy(() => import('./pages/admin/users/UserNewPage'));
const UserImportPage = lazy(() => import('./pages/admin/users/UserImportPage'));
const UserDetailPage = lazy(() => import('./pages/admin/users/UserDetailPage'));
const UserEditPage = lazy(() => import('./pages/admin/users/UserEditPage'));
const WorkspacesPage = lazy(() => import('./pages/admin/workspaces/WorkspacesPage'));
const WorkspaceNewPage = lazy(() => import('./pages/admin/workspaces/WorkspaceNewPage'));
const WorkspaceDetailPage = lazy(() => import('./pages/admin/workspaces/WorkspaceDetailPage'));
const WorkspaceEditPage = lazy(() => import('./pages/admin/workspaces/WorkspaceEditPage'));
const DocumentsPage = lazy(() => import('./pages/admin/documents/DocumentsPage'));
const DocNewPage = lazy(() => import('./pages/admin/documents/DocNewPage'));
const DocUploadPage = lazy(() => import('./pages/admin/documents/DocUploadPage'));
const DocDetailPage = lazy(() => import('./pages/admin/documents/DocDetailPage'));
const DocEditPage = lazy(() => import('./pages/admin/documents/DocEditPage'));
const ActivityPage = lazy(() => import('./pages/admin/ActivityPage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));
const ChatChannelsPage = lazy(() => import('./pages/admin/channels/ChatChannelsPage'));
const ChannelDetailPage = lazy(() => import('./pages/admin/channels/ChannelDetailPage'));
const ChatViewerPage = lazy(() => import('./pages/admin/channels/ChatViewerPage'));
const ProfilePage = lazy(() => import('./pages/admin/ProfilePage'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent" />
    </div>
  );
}

function App() {
  useSettings();
  const { checkAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isInitialized) {
    return <PageLoader />;
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
