import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isInitialized, user } = useAuthStore();

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-sky-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const roleStr = user?.role ? String(user.role).toLowerCase() : '';
  const isAllowed = roleStr === 'super_admin' || roleStr === 'admin';

  if (!isAllowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
