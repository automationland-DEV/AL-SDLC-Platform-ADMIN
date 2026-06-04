import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores';

interface RequireSuperAdminProps {
  children: ReactNode;
}

export function RequireSuperAdmin({ children }: RequireSuperAdminProps) {
  const { user, isAuthenticated, isInitialized } = useAuthStore();
  const location = useLocation();

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'super_admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
