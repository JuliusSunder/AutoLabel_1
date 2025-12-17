/**
 * Scan IPC Handlers
 * Handle email scanning operations
 */

import { ipcMain } from 'electron';
import { scanMailbox } from '../email/scanner';
import type { ScanResult, ScanStatus } from '../../shared/types';

let isScanning = false;
let scanProgress = 0;

/**
 * Register scan IPC handlers
 */
export function registerScanHandlers(): void {
  // Start email scan
  ipcMain.handle('scan:start', async (): Promise<ScanResult> => {
    console.log('[IPC] scan:start called');

    if (isScanning) {
      return {
        scannedCount: 0,
        newSales: 0,
        errors: ['Scan already in progress'],
      };
    }

    isScanning = true;
    scanProgress = 0;

    try {
      const result = await scanMailbox();
      return result;
    } catch (error) {
      console.error('[IPC] Scan failed:', error);
      return {
        scannedCount: 0,
        newSales: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
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
