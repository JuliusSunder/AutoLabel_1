/**
 * Token Storage
 * Secure storage for authentication tokens using electron-store with encryption
 */

import Store from 'electron-store';
import { logDebug, logError, logInfo } from '../utils/logger';

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Timestamp in milliseconds
}

interface UserData {
  id: string;
  email: string;
  name: string | null;
}

interface SubscriptionData {
  plan: 'free' | 'plus' | 'pro';
  status: string;
  expiresAt: string | null;
}

// Create encrypted store for tokens
const tokenStore = new Store<TokenData>({
  name: 'auth-tokens',
  encryptionKey: 'autolabel-secure-key-2024', // In production: from env or generated
  clearInvalidConfig: true,
});

// Separate store for user info (also encrypted)
const userStore = new Store<{ user: UserData; subscription: SubscriptionData }>({
  name: 'auth-user',
  encryptionKey: 'autolabel-secure-key-2024',
  clearInvalidConfig: true,
});

/**
 * Save authentication tokens
 */
export function saveTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): void {
  try {
    const expiresAt = Date.now() + expiresIn * 1000;

    tokenStore.set('accessToken', accessToken);
    tokenStore.set('refreshToken', refreshToken);
    tokenStore.set('expiresAt', expiresAt);

    logDebug('Tokens saved successfully', { expiresAt: new Date(expiresAt).toISOString() });
  } catch (error) {
    logError('Failed to save tokens', error);
    throw error;
  }
}

/**
 * Get access token
 */
export function getAccessToken(): string | null {
  try {
    const token = tokenStore.get('accessToken');
    return token || null;
  } catch (error) {
    logError('Failed to get access token', error);
    return null;
  }
}

/**
 * Get refresh token
 */
export function getRefreshToken(): string | null {
  try {
    const token = tokenStore.get('refreshToken');
    return token || null;
  } catch (error) {
    logError('Failed to get refresh token', error);
    return null;
  }
}

/**
 * Get token expiry timestamp
 */
export function getTokenExpiry(): number | null {
  try {
    const expiresAt = tokenStore.get('expiresAt');
    return expiresAt || null;
  } catch (error) {
    logError('Failed to get token expiry', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(): boolean {
  const expiresAt = getTokenExpiry();
  if (!expiresAt) {
    return true;
  }
  return Date.now() >= expiresAt;
}

/**
 * Check if token expires soon (within 2 minutes)
 */
export function isTokenExpiringSoon(): boolean {
  const expiresAt = getTokenExpiry();
  if (!expiresAt) {
    return true;
  }
  const twoMinutes = 2 * 60 * 1000;
  return Date.now() >= expiresAt - twoMinutes;
}

/**
 * Clear all tokens
 */
export function clearTokens(): void {
  try {
    tokenStore.clear();
    logInfo('Tokens cleared');
  } catch (error) {
    logError('Failed to clear tokens', error);
  }
}

/**
 * Check if tokens exist
 */
export function hasTokens(): boolean {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  return !!(accessToken && refreshToken);
}

/**
 * Save user info
 */
export function saveUserInfo(user: UserData, subscription: SubscriptionData): void {
  try {
    userStore.set('user', user);
    userStore.set('subscription', subscription);
    logDebug('User info saved', { email: user.email, plan: subscription.plan });
  } catch (error) {
    logError('Failed to save user info', error);
    throw error;
  }
}

/**
 * Get user info
 */
export function getUserInfo(): UserData | null {
  try {
    const user = userStore.get('user');
    return user || null;
  } catch (error) {
    logError('Failed to get user info', error);
    return null;
  }
}

/**
 * Get subscription info
 */
export function getSubscriptionInfo(): SubscriptionData | null {
  try {
    const subscription = userStore.get('subscription');
    return subscription || null;
  } catch (error) {
    logError('Failed to get subscription info', error);
    return null;
  }
}

/**
 * Clear user info
 */
export function clearUserInfo(): void {
  try {
    userStore.clear();
    logInfo('User info cleared');
  } catch (error) {
    logError('Failed to clear user info', error);
  }
}

/**
 * Clear all auth data
 */
export function clearAllAuthData(): void {
  clearTokens();
  clearUserInfo();
  logInfo('All auth data cleared');
}

