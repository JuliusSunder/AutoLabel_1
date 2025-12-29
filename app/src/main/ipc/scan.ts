/**
 * Scan IPC Handlers
 * Handle email scanning operations
 */

import { ipcMain } from 'electron';
import { scanMailbox, refreshVintedSales } from '../email/scanner';
import type { ScanResult, ScanStatus } from '../../shared/types';
import { logError, logInfo, logDebug } from '../utils/logger';
import { getUserFriendlyError } from '../utils/error-messages';

let isScanning = false;
let scanProgress = 0;

/**
 * Register scan IPC handlers
 */
export function registerScanHandlers(): void {
  // Start email scan (with optional account filter)
  ipcMain.handle('scan:start', async (_event, accountId?: string): Promise<ScanResult> => {
    console.log('[IPC] scan:start called', accountId ? `for account: ${accountId}` : 'for all accounts');
    logInfo('Email scan started', { accountId: accountId || 'all' });

    if (isScanning) {
      logDebug('Scan already in progress, rejecting new scan request');
      return {
        scannedCount: 0,
        newSales: 0,
        errors: ['Scan already in progress'],
      };
    }

    isScanning = true;
    scanProgress = 0;

    try {
      const result = await scanMailbox(accountId);
      logInfo('Email scan completed', { 
        accountId: accountId || 'all',
        scannedCount: result.scannedCount,
        newSales: result.newSales,
        hasErrors: result.errors && result.errors.length > 0,
      });
      return result;
    } catch (error) {
      console.error('[IPC] Scan failed:', error);
      logError('Email scan failed', error, { accountId: accountId || 'all' });
      
      const userFriendlyMessage = getUserFriendlyError(error);
      return {
        scannedCount: 0,
        newSales: 0,
        errors: [userFriendlyMessage],
      };
    } finally {
      isScanning = false;
      scanProgress = 0;
    }
  });

  // Get scan status
  ipcMain.handle('scan:status', async (): Promise<ScanStatus> => {
    return {
      isScanning,
      progress: scanProgress,
    };
  });

  // Refresh Vinted sales (new simplified scan)
  ipcMain.handle('scan:refreshVinted', async (): Promise<ScanResult> => {
    console.log('[IPC] scan:refreshVinted called');
    logInfo('Vinted refresh started');

    try {
      const result = await refreshVintedSales();
      console.log('[IPC] Vinted refresh complete:', result);
      logInfo('Vinted refresh completed', {
        scannedCount: result.scannedCount,
        newSales: result.newSales,
        hasErrors: result.errors && result.errors.length > 0,
      });
      return result;
    } catch (error) {
      console.error('[IPC] Vinted refresh failed:', error);
      logError('Vinted refresh failed', error);
      
      const userFriendlyMessage = getUserFriendlyError(error);
      return {
        scannedCount: 0,
        newSales: 0,
        errors: [userFriendlyMessage],
      };
    }
  });

}

/**
 * Update scan progress (called by scanner in Phase 2)
 */
export function updateScanProgress(progress: number, currentEmail?: string): void {
  isScanning = true;
  scanProgress = progress;
  // TODO: Send progress updates to renderer via webContents.send
}

/**
 * Mark scan as complete
 */
export function completeScan(): void {
  isScanning = false;
  scanProgress = 0;
}
