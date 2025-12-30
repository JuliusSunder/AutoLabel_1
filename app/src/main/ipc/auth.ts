/**
 * Auth IPC Handlers
 * Handle authentication-related IPC calls from renderer process
 */

import { ipcMain } from 'electron';
import {
  login,
  logout,
  getSession,
  validateLabelCreation,
  isAuthenticated,
  getDeviceId,
  getCachedUserInfo,
  refreshToken,
  type AuthResult,
  type SessionInfo,
  type ValidationResult,
} from '../auth/auth-manager';
import { startTokenRefresher, stopTokenRefresher } from '../auth/token-refresher';
import { logInfo, logError, logDebug } from '../utils/logger';

/**
 * Register auth IPC handlers
 */
export function registerAuthHandlers(): void {
  // Login
  ipcMain.handle(
    'auth:login',
    async (_event, email: string, password: string): Promise<AuthResult> => {
      console.log('[IPC] auth:login called');
      logInfo('Login attempt', { email });

      try {
        const result = await login(email, password);

        if (result.success) {
          console.log('[IPC] Login successful');
          logInfo('Login successful', { email });

          // Start token refresher after successful login
          startTokenRefresher();
        } else {
          console.log('[IPC] Login failed:', result.error);
          logError('Login failed', new Error(result.error));
        }

        return result;
      } catch (error) {
        console.error('[IPC] Login error:', error);
        logError('Login error', error);

        return {
          success: false,
          error: 'Ein unerwarteter Fehler ist aufgetreten',
        };
      }
    }
  );

  // Logout
  ipcMain.handle('auth:logout', async (): Promise<{ success: boolean }> => {
    console.log('[IPC] auth:logout called');
    logInfo('Logout');

    try {
      logout();

      // Stop token refresher
      stopTokenRefresher();

      console.log('[IPC] Logout successful');
      return { success: true };
    } catch (error) {
      console.error('[IPC] Logout error:', error);
      logError('Logout error', error);
      return { success: false };
    }
  });

  // Get session
  ipcMain.handle('auth:getSession', async (): Promise<SessionInfo | null> => {
    console.log('[IPC] auth:getSession called');
    logDebug('Getting session info');

    try {
      const session = await getSession();

      if (session) {
        console.log('[IPC] Session info retrieved');
      } else {
        console.log('[IPC] No session found');
      }

      return session;
    } catch (error) {
      console.error('[IPC] Get session error:', error);
      logError('Get session error', error);
      return null;
    }
  });

  // Refresh token
  ipcMain.handle('auth:refreshToken', async (): Promise<{ success: boolean }> => {
    console.log('[IPC] auth:refreshToken called');
    logDebug('Manual token refresh');

    try {
      const result = await refreshToken();
      return { success: result.success };
    } catch (error) {
      console.error('[IPC] Refresh token error:', error);
      logError('Refresh token error', error);
      return { success: false };
    }
  });

  // Validate label creation
  ipcMain.handle(
    'auth:validateLabelCreation',
    async (_event, count: number): Promise<ValidationResult> => {
      console.log('[IPC] auth:validateLabelCreation called', { count });
      logDebug('Validating label creation', { count });

      try {
        const result = await validateLabelCreation(count);

        if (result.allowed) {
          console.log('[IPC] Label creation allowed', { remaining: result.remaining });
        } else {
          console.log('[IPC] Label creation denied:', result.reason);
        }

        return result;
      } catch (error) {
        console.error('[IPC] Validate label creation error:', error);
        logError('Validate label creation error', error);

        return {
          allowed: false,
          reason: 'Ein unerwarteter Fehler ist aufgetreten',
        };
      }
    }
  );

  // Get device ID
  ipcMain.handle('auth:getDeviceId', async (): Promise<string> => {
    console.log('[IPC] auth:getDeviceId called');
    logDebug('Getting device ID');

    try {
      const deviceId = getDeviceId();
      console.log('[IPC] Device ID:', deviceId);
      return deviceId;
    } catch (error) {
      console.error('[IPC] Get device ID error:', error);
      logError('Get device ID error', error);
      throw error;
    }
  });

  // Check if authenticated
  ipcMain.handle('auth:isAuthenticated', async (): Promise<boolean> => {
    console.log('[IPC] auth:isAuthenticated called');
    logDebug('Checking authentication status');

    try {
      const authenticated = isAuthenticated();
      console.log('[IPC] Authenticated:', authenticated);
      return authenticated;
    } catch (error) {
      console.error('[IPC] Check authentication error:', error);
      logError('Check authentication error', error);
      return false;
    }
  });

  // Get cached user info (no server call)
  ipcMain.handle(
    'auth:getCachedUserInfo',
    async (): Promise<{
      user: { id: string; email: string; name: string | null } | null;
      subscription: { plan: 'free' | 'plus' | 'pro'; status: string; expiresAt: string | null } | null;
    }> => {
      console.log('[IPC] auth:getCachedUserInfo called');
      logDebug('Getting cached user info');

      try {
        const info = getCachedUserInfo();
        console.log('[IPC] Cached user info:', info.user?.email);
        return info;
      } catch (error) {
        console.error('[IPC] Get cached user info error:', error);
        logError('Get cached user info error', error);
        return { user: null, subscription: null };
      }
    }
  );

  console.log('[IPC] Auth handlers registered');
}

