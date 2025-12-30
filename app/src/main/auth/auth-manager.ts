/**
 * Auth Manager
 * Handles authentication, token management, and server communication
 */

import { getOrCreateDeviceId } from './device-manager';
import {
  saveTokens,
  getAccessToken,
  getRefreshToken,
  clearAllAuthData,
  saveUserInfo,
  getUserInfo,
  getSubscriptionInfo,
  hasTokens,
  isTokenExpired,
} from './token-storage';
import { logInfo, logError, logDebug } from '../utils/logger';

const API_URL = process.env.WEBSITE_URL || 'http://localhost:3000';

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
  subscription?: {
    plan: 'free' | 'plus' | 'pro';
    status: string;
    expiresAt: string | null;
  };
}

export interface SessionInfo {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  subscription: {
    plan: 'free' | 'plus' | 'pro';
    status: string;
    expiresAt: string | null;
  };
  device: {
    id: string;
    registeredAt: string;
    lastSeen: string;
  } | null;
}

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
  remaining?: number;
  limit?: number;
}

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<AuthResult> {
  try {
    logInfo('Attempting login', { email });

    const deviceId = getOrCreateDeviceId();

    const response = await fetch(`${API_URL}/api/auth/app/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        deviceId,
        deviceName: `AutoLabel Desktop`, // Optional device name
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      logError('Login failed', new Error(data.error || 'Unknown error'));
      return {
        success: false,
        error: data.error || 'Login fehlgeschlagen',
      };
    }

    // Save tokens
    saveTokens(data.accessToken, data.refreshToken, data.expiresIn);

    // Save user info
    saveUserInfo(data.user, data.subscription);

    logInfo('Login successful', { email: data.user.email, plan: data.subscription.plan });

    return {
      success: true,
      user: data.user,
      subscription: data.subscription,
    };
  } catch (error) {
    logError('Login error', error);
    return {
      success: false,
      error: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.',
    };
  }
}

/**
 * Refresh access token
 */
export async function refreshToken(): Promise<AuthResult> {
  try {
    logDebug('Attempting token refresh');

    const refreshTokenValue = getRefreshToken();
    if (!refreshTokenValue) {
      return {
        success: false,
        error: 'Kein Refresh Token vorhanden',
      };
    }

    const response = await fetch(`${API_URL}/api/auth/app/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: refreshTokenValue,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      logError('Token refresh failed', new Error(data.error || 'Unknown error'));
      
      // If refresh fails, clear auth data and require re-login
      if (response.status === 401) {
        clearAllAuthData();
      }

      return {
        success: false,
        error: data.error || 'Token-Refresh fehlgeschlagen',
      };
    }

    // Save new tokens
    saveTokens(data.accessToken, data.refreshToken, data.expiresIn);

    // Update subscription info (might have changed)
    const userInfo = getUserInfo();
    if (userInfo) {
      saveUserInfo(userInfo, data.subscription);
    }

    logInfo('Token refreshed successfully');

    return {
      success: true,
      subscription: data.subscription,
    };
  } catch (error) {
    logError('Token refresh error', error);
    return {
      success: false,
      error: 'Netzwerkfehler beim Token-Refresh',
    };
  }
}

/**
 * Get current session from server
 */
export async function getSession(): Promise<SessionInfo | null> {
  try {
    logDebug('Fetching session info');

    const accessToken = getAccessToken();
    if (!accessToken) {
      logError('No access token available', new Error('Missing token'));
      return null;
    }

    const response = await fetch(`${API_URL}/api/auth/app/session`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      // If 401, try to refresh token
      if (response.status === 401) {
        logDebug('Access token expired, attempting refresh');
        const refreshResult = await refreshToken();
        
        if (refreshResult.success) {
          // Retry with new token
          return await getSession();
        }
      }

      logError('Failed to get session', new Error(`Status ${response.status}`));
      return null;
    }

    const data = await response.json();

    // Update local user info
    saveUserInfo(data.user, data.subscription);

    logDebug('Session info retrieved', { email: data.user.email });

    return data;
  } catch (error) {
    logError('Get session error', error);
    return null;
  }
}

/**
 * Validate label creation with server
 */
export async function validateLabelCreation(count: number): Promise<ValidationResult> {
  try {
    logDebug('Validating label creation', { count });

    const accessToken = getAccessToken();
    if (!accessToken) {
      return {
        allowed: false,
        reason: 'Nicht authentifiziert. Bitte melden Sie sich an.',
      };
    }

    const response = await fetch(`${API_URL}/api/auth/app/validate-label-creation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ labelCount: count }),
    });

    const data = await response.json();

    if (!response.ok) {
      // If 401, try to refresh token
      if (response.status === 401) {
        logDebug('Access token expired, attempting refresh');
        const refreshResult = await refreshToken();
        
        if (refreshResult.success) {
          // Retry with new token
          return await validateLabelCreation(count);
        }

        return {
          allowed: false,
          reason: 'Authentifizierung fehlgeschlagen. Bitte melden Sie sich erneut an.',
        };
      }

      logError('Label validation failed', new Error(data.error || 'Unknown error'));
      return {
        allowed: false,
        reason: data.error || 'Validierung fehlgeschlagen',
      };
    }

    logInfo('Label validation result', { allowed: data.allowed, remaining: data.remaining });

    return data;
  } catch (error) {
    logError('Label validation error', error);
    return {
      allowed: false,
      reason: 'Keine Verbindung zum Server. Label-Erstellung nicht möglich.',
    };
  }
}

/**
 * Logout (clear local auth data)
 */
export function logout(): void {
  try {
    logInfo('Logging out');
    clearAllAuthData();
  } catch (error) {
    logError('Logout error', error);
    throw error;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (!hasTokens()) {
    return false;
  }

  // Check if token is expired
  if (isTokenExpired()) {
    logDebug('Token expired, user not authenticated');
    return false;
  }

  return true;
}

/**
 * Get device ID
 */
export function getDeviceId(): string {
  return getOrCreateDeviceId();
}

/**
 * Get cached user info (without server call)
 */
export function getCachedUserInfo(): {
  user: { id: string; email: string; name: string | null } | null;
  subscription: { plan: 'free' | 'plus' | 'pro'; status: string; expiresAt: string | null } | null;
} {
  return {
    user: getUserInfo(),
    subscription: getSubscriptionInfo(),
  };
}

