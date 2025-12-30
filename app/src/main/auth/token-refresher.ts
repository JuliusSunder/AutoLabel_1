/**
 * Token Refresher
 * Automatically refreshes access tokens before they expire
 */

import { refreshToken } from './auth-manager';
import { getTokenExpiry, isTokenExpiringSoon } from './token-storage';
import { logInfo, logError, logDebug } from '../utils/logger';

let refreshInterval: NodeJS.Timeout | null = null;
const CHECK_INTERVAL = 10 * 60 * 1000; // Check every 10 minutes
const REFRESH_THRESHOLD = 2 * 60 * 1000; // Refresh if expires in < 2 minutes

/**
 * Start automatic token refresh service
 */
export function startTokenRefresher(): void {
  if (refreshInterval) {
    logDebug('Token refresher already running');
    return;
  }

  logInfo('Starting token refresher service');

  // Check immediately on start
  checkAndRefreshToken();

  // Then check periodically
  refreshInterval = setInterval(() => {
    checkAndRefreshToken();
  }, CHECK_INTERVAL);
}

/**
 * Stop automatic token refresh service
 */
export function stopTokenRefresher(): void {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
    logInfo('Token refresher service stopped');
  }
}

/**
 * Check token expiry and refresh if needed
 */
async function checkAndRefreshToken(): Promise<void> {
  try {
    const expiresAt = getTokenExpiry();

    if (!expiresAt) {
      logDebug('No token expiry found, skipping refresh check');
      return;
    }

    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;

    logDebug('Token refresh check', {
      expiresAt: new Date(expiresAt).toISOString(),
      timeUntilExpiry: `${Math.floor(timeUntilExpiry / 1000)}s`,
    });

    // Check if token expires soon
    if (isTokenExpiringSoon()) {
      logInfo('Token expiring soon, refreshing...', {
        expiresIn: `${Math.floor(timeUntilExpiry / 1000)}s`,
      });

      const result = await refreshToken();

      if (result.success) {
        logInfo('Token refreshed successfully');
      } else {
        logError('Token refresh failed', new Error(result.error || 'Unknown error'));
      }
    } else {
      logDebug('Token still valid, no refresh needed', {
        expiresIn: `${Math.floor(timeUntilExpiry / 1000)}s`,
      });
    }
  } catch (error) {
    logError('Error in token refresh check', error);
  }
}

/**
 * Force token refresh (for manual refresh)
 */
export async function forceTokenRefresh(): Promise<boolean> {
  try {
    logInfo('Forcing token refresh');
    const result = await refreshToken();
    return result.success;
  } catch (error) {
    logError('Force token refresh failed', error);
    return false;
  }
}

