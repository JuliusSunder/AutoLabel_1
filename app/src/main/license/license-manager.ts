/**
 * License Manager
 * Handles license validation, usage tracking, and plan limits
 */

import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { logError, logInfo, logDebug } from '../utils/logger';

// Usage Limits Definition
export const USAGE_LIMITS = {
  free: {
    labelsPerMonth: 10,
    batchPrinting: false,
    customFooter: false,
  },
  plus: {
    labelsPerMonth: 60,
    batchPrinting: true,
    customFooter: true,
  },
  pro: {
    labelsPerMonth: -1, // -1 = unlimited
    batchPrinting: true,
    customFooter: true,
  },
} as const;

export type Plan = keyof typeof USAGE_LIMITS;

export interface LicenseInfo {
  plan: Plan;
  licenseKey: string | null;
  expiresAt: string | null;
  validatedAt: string;
  isValid: boolean;
}

export interface UsageInfo {
  labelsUsed: number;
  month: string; // Format: "YYYY-MM"
  limit: number; // -1 = unlimited
  remaining: number; // -1 = unlimited
}

export interface LicenseLimits {
  labelsPerMonth: number;
  batchPrinting: boolean;
  customFooter: boolean;
}

/**
 * Get data directory for license and usage files
 */
function getDataDirectory(): string {
  if (!app.isReady()) {
    // Fallback if app is not ready yet
    return path.join(process.env.APPDATA || process.env.HOME || process.cwd(), 'AutoLabel', 'data');
  }
  return path.join(app.getPath('userData'), 'data');
}

/**
 * Get license file path
 */
function getLicenseFilePath(): string {
  const dataDir = getDataDirectory();
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'license.json');
}

/**
 * Get usage file path
 */
function getUsageFilePath(): string {
  const dataDir = getDataDirectory();
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'usage.json');
}

/**
 * Get current month string (YYYY-MM)
 */
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Load license info from file
 */
function loadLicenseInfo(): LicenseInfo | null {
  try {
    const filePath = getLicenseFilePath();
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const data = fs.readFileSync(filePath, 'utf-8');
    const license = JSON.parse(data) as LicenseInfo;
    
    logDebug('License info loaded', { plan: license.plan, hasKey: !!license.licenseKey });
    return license;
  } catch (error) {
    logError('Failed to load license info', error);
    return null;
  }
}

/**
 * Save license info to file
 */
function saveLicenseInfo(license: LicenseInfo): void {
  try {
    const filePath = getLicenseFilePath();
    fs.writeFileSync(filePath, JSON.stringify(license, null, 2), 'utf-8');
    logInfo('License info saved', { plan: license.plan, hasKey: !!license.licenseKey });
  } catch (error) {
    logError('Failed to save license info', error);
    throw error;
  }
}

/**
 * Load usage info from file
 */
function loadUsageInfo(): { labelsUsed: number; month: string } {
  try {
    const filePath = getUsageFilePath();
    if (!fs.existsSync(filePath)) {
      return { labelsUsed: 0, month: getCurrentMonth() };
    }

    const data = fs.readFileSync(filePath, 'utf-8');
    const usage = JSON.parse(data) as { labelsUsed: number; month: string };
    
    // Reset if month changed
    const currentMonth = getCurrentMonth();
    if (usage.month !== currentMonth) {
      logInfo('Usage reset - new month', { oldMonth: usage.month, newMonth: currentMonth });
      return { labelsUsed: 0, month: currentMonth };
    }

    return usage;
  } catch (error) {
    logError('Failed to load usage info', error);
    return { labelsUsed: 0, month: getCurrentMonth() };
  }
}

/**
 * Save usage info to file
 */
function saveUsageInfo(usage: { labelsUsed: number; month: string }): void {
  try {
    const filePath = getUsageFilePath();
    fs.writeFileSync(filePath, JSON.stringify(usage, null, 2), 'utf-8');
    logDebug('Usage info saved', usage);
  } catch (error) {
    logError('Failed to save usage info', error);
    throw error;
  }
}

/**
 * Get current license
 */
export function getLicense(): LicenseInfo {
  const license = loadLicenseInfo();
  
  if (!license) {
    // Default to free plan
    return {
      plan: 'free',
      licenseKey: null,
      expiresAt: null,
      validatedAt: new Date().toISOString(),
      isValid: true,
    };
  }

  // Check if license is expired
  if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
    logInfo('License expired', { expiresAt: license.expiresAt });
    // Downgrade to free plan
    const freeLicense: LicenseInfo = {
      plan: 'free',
      licenseKey: null,
      expiresAt: null,
      validatedAt: new Date().toISOString(),
      isValid: true,
    };
    saveLicenseInfo(freeLicense);
    return freeLicense;
  }

  return license;
}

/**
 * Validate license key with server
 */
export async function validateLicenseKey(
  licenseKey: string,
  apiUrl: string = process.env.WEBSITE_URL || 'http://localhost:3000'
): Promise<{ success: boolean; error?: string; license?: LicenseInfo }> {
  try {
    logInfo('Validating license key', { apiUrl });

    const response = await fetch(`${apiUrl}/api/license/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ licenseKey }),
    });

    const data = await response.json();

    if (!response.ok) {
      logError('License validation failed', new Error(data.error || 'Unknown error'));
      return { success: false, error: data.error || 'Validierung fehlgeschlagen' };
    }

    // Save license info
    const license: LicenseInfo = {
      plan: data.plan as Plan,
      licenseKey: licenseKey,
      expiresAt: data.expiresAt,
      validatedAt: new Date().toISOString(),
      isValid: true,
    };

    saveLicenseInfo(license);
    logInfo('License validated successfully', { plan: license.plan });

    return { success: true, license };
  } catch (error) {
    logError('License validation error', error);
    return { 
      success: false, 
      error: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.' 
    };
  }
}

/**
 * Remove license (downgrade to free)
 */
export function removeLicense(): void {
  const freeLicense: LicenseInfo = {
    plan: 'free',
    licenseKey: null,
    expiresAt: null,
    validatedAt: new Date().toISOString(),
    isValid: true,
  };
  saveLicenseInfo(freeLicense);
  logInfo('License removed, downgraded to free plan');
}

/**
 * Get current usage
 */
export function getUsage(): UsageInfo {
  const license = getLicense();
  const usage = loadUsageInfo();
  const limits = USAGE_LIMITS[license.plan];

  return {
    labelsUsed: usage.labelsUsed,
    month: usage.month,
    limit: limits.labelsPerMonth,
    remaining: limits.labelsPerMonth === -1 ? -1 : Math.max(0, limits.labelsPerMonth - usage.labelsUsed),
  };
}

/**
 * Check if can create labels
 */
export function canCreateLabels(count: number = 1): { allowed: boolean; reason?: string } {
  const license = getLicense();
  const usage = loadUsageInfo();
  const limits = USAGE_LIMITS[license.plan];

  // Unlimited plan
  if (limits.labelsPerMonth === -1) {
    return { allowed: true };
  }

  // Check if would exceed limit
  if (usage.labelsUsed + count > limits.labelsPerMonth) {
    return {
      allowed: false,
      reason: `Monatslimit erreicht. Sie haben ${usage.labelsUsed} von ${limits.labelsPerMonth} Labels verwendet. Upgraden Sie für mehr Labels.`,
    };
  }

  return { allowed: true };
}

/**
 * Increment usage counter
 */
export function incrementUsage(count: number = 1): void {
  const usage = loadUsageInfo();
  usage.labelsUsed += count;
  saveUsageInfo(usage);
  logInfo('Usage incremented', { count, total: usage.labelsUsed });
}

/**
 * Check if batch printing is allowed
 */
export function canBatchPrint(): boolean {
  const license = getLicense();
  const limits = USAGE_LIMITS[license.plan];
  return limits.batchPrinting;
}

/**
 * Check if custom footer is allowed
 */
export function canCustomFooter(): boolean {
  const license = getLicense();
  const limits = USAGE_LIMITS[license.plan];
  return limits.customFooter;
}

/**
 * Get plan limits
 */
export function getLimits(): LicenseLimits {
  const license = getLicense();
  return USAGE_LIMITS[license.plan];
}

/**
 * Reset usage (for testing or manual reset)
 */
export function resetUsage(): void {
  const usage = {
    labelsUsed: 0,
    month: getCurrentMonth(),
  };
  saveUsageInfo(usage);
  logInfo('Usage reset');
}

