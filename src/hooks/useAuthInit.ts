import { useEffect } from 'react';
import { useAuthStore } from '../stores';

export function useAuthInit() {
  const { checkAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) {
      checkAuth();
    }
  }, [checkAuth, isInitialized]);

  return { isInitialized };
}
