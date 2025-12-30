/**
 * License IPC Handlers
 * Handle license validation, usage tracking, and plan limits
 */

import { ipcMain } from 'electron';
import {
  getLicense,
  validateLicenseKey,
  removeLicense,
  getUsage,
  canCreateLabels,
  canBatchPrint,
  canCustomFooter,
  getLimits,
  resetUsage,
} from '../license/license-manager';
import type { LicenseInfo, UsageInfo, LicenseLimits } from '../license/license-manager';
import { logError, logInfo, logDebug } from '../utils/logger';

/**
 * Register license IPC handlers
 */
export function registerLicenseHandlers(): void {
  // Get current license
  ipcMain.handle('license:get', async (): Promise<LicenseInfo> => {
    console.log('[IPC] license:get called');
    logDebug('Getting license info');

    try {
      const license = getLicense();
      console.log('[IPC] License info:', license);
      return license;
    } catch (error) {
      console.error('[IPC] Error getting license:', error);
      logError('Failed to get license', error);
      
      // Return free plan as fallback
      return {
        plan: 'free',
        licenseKey: null,
        expiresAt: null,
        validatedAt: new Date().toISOString(),
        isValid: true,
      };
    }
  });

  // Validate license key
  ipcMain.handle(
    'license:validate',
    async (_event, licenseKey: string): Promise<{ success: boolean; error?: string; license?: LicenseInfo }> => {
      console.log('[IPC] license:validate called');
      logInfo('Validating license key');

      try {
        const result = await validateLicenseKey(licenseKey);
        
        if (result.success) {
          console.log('[IPC] License validated successfully');
          logInfo('License validated successfully', { plan: result.license?.plan });
        } else {
          console.log('[IPC] License validation failed:', result.error);
          logError('License validation failed', new Error(result.error));
        }

        return result;
      } catch (error) {
        console.error('[IPC] Error validating license:', error);
        logError('Failed to validate license', error);
        
        return {
          success: false,
          error: 'Ein unerwarteter Fehler ist aufgetreten',
        };
      }
    }
  );

  // Remove license (downgrade to free)
  ipcMain.handle('license:remove', async (): Promise<{ success: boolean }> => {
    console.log('[IPC] license:remove called');
    logInfo('Removing license');

    try {
      removeLicense();
      console.log('[IPC] License removed successfully');
      return { success: true };
    } catch (error) {
      console.error('[IPC] Error removing license:', error);
      logError('Failed to remove license', error);
      return { success: false };
    }
  });

  // Get current usage
  ipcMain.handle('license:usage', async (): Promise<UsageInfo> => {
    console.log('[IPC] license:usage called');
    logDebug('Getting usage info');

    try {
      const usage = getUsage();
      console.log('[IPC] Usage info:', usage);
      return usage;
    } catch (error) {
      console.error('[IPC] Error getting usage:', error);
      logError('Failed to get usage', error);
      
      // Return default usage as fallback
      return {
        labelsUsed: 0,
        month: new Date().toISOString().slice(0, 7),
        limit: 10,
        remaining: 10,
      };
    }
  });

  // Check if can create labels
  ipcMain.handle(
    'license:canCreateLabels',
    async (_event, count: number = 1): Promise<{ allowed: boolean; reason?: string }> => {
      console.log('[IPC] license:canCreateLabels called with count:', count);
      logDebug('Checking if can create labels', { count });

      try {
        const result = canCreateLabels(count);
        console.log('[IPC] Can create labels:', result);
        return result;
      } catch (error) {
        console.error('[IPC] Error checking if can create labels:', error);
        logError('Failed to check if can create labels', error);
        
        return {
          allowed: false,
          reason: 'Ein Fehler ist aufgetreten',
        };
      }
    }
  );

  // Check if batch printing is allowed
  ipcMain.handle('license:canBatchPrint', async (): Promise<boolean> => {
    console.log('[IPC] license:canBatchPrint called');
    logDebug('Checking if batch printing is allowed');

    try {
      const allowed = canBatchPrint();
      console.log('[IPC] Batch printing allowed:', allowed);
      return allowed;
    } catch (error) {
      console.error('[IPC] Error checking batch printing:', error);
      logError('Failed to check batch printing', error);
      return false;
    }
  });

  // Check if custom footer is allowed
  ipcMain.handle('license:canCustomFooter', async (): Promise<boolean> => {
    console.log('[IPC] license:canCustomFooter called');
    logDebug('Checking if custom footer is allowed');

    try {
      const allowed = canCustomFooter();
      console.log('[IPC] Custom footer allowed:', allowed);
      return allowed;
    } catch (error) {
      console.error('[IPC] Error checking custom footer:', error);
      logError('Failed to check custom footer', error);
      return false;
    }
  });

  // Get plan limits
  ipcMain.handle('license:getLimits', async (): Promise<LicenseLimits> => {
    console.log('[IPC] license:getLimits called');
    logDebug('Getting plan limits');

    try {
      const limits = getLimits();
      console.log('[IPC] Plan limits:', limits);
      return limits;
    } catch (error) {
      console.error('[IPC] Error getting limits:', error);
      logError('Failed to get limits', error);
      
      // Return free plan limits as fallback
      return {
        labelsPerMonth: 10,
        batchPrinting: true, // ✓ Batch Printing available in Free Plan
        customFooter: false, // ✗ Custom Footer locked in Free Plan
      };
    }
  });

  // Reset usage (for testing)
  ipcMain.handle('license:resetUsage', async (): Promise<{ success: boolean }> => {
    console.log('[IPC] license:resetUsage called');
    logInfo('Resetting usage');

    try {
      resetUsage();
      console.log('[IPC] Usage reset successfully');
      return { success: true };
    } catch (error) {
      console.error('[IPC] Error resetting usage:', error);
      logError('Failed to reset usage', error);
      return { success: false };
    }
  });

  console.log('[IPC] License handlers registered');
}

