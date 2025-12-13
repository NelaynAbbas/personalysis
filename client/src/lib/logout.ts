import { queryClient } from './queryClient';
import { toast } from '@/hooks/use-toast';
import { getWebSocketService } from './websocketService';

/**
 * Centralized logout function that can be called from anywhere
 * Clears all user data, session storage, and redirects to home
 */
export async function performLogout(options: {
  showToast?: boolean;
  redirectTo?: string;
  reason?: string;
} = {}) {
  const {
    showToast = true,
    redirectTo = '/',
    reason = 'Your session has expired. Please log in again.'
  } = options;

  try {
    // Disconnect WebSocket first
    const wsService = getWebSocketService();
    wsService.disconnect();

    // Call logout API endpoint to destroy server session
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    // Even if API call fails, continue with local cleanup
    console.error('Logout API call failed:', error);
  }

  // Clear localStorage (user data, session info)
  localStorage.removeItem('currentUser');
  localStorage.removeItem('authToken');
  localStorage.clear();

  // Clear sessionStorage as well
  sessionStorage.clear();

  // Clear all React Query cache to ensure fresh data on next login
  queryClient.clear();

  // Dispatch logout event for auth context
  window.dispatchEvent(new CustomEvent('auth:logout'));

  // Show toast notification if requested
  if (showToast) {
    toast({
      title: 'Session Expired',
      description: reason,
      variant: 'destructive',
    });
  }

  // Redirect to specified page (default: home)
  if (window.location.pathname !== redirectTo) {
    window.location.href = redirectTo;
  } else {
    // If already on the target page, reload to clear state
    window.location.reload();
  }
}

