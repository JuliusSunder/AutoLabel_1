/**
 * Shell IPC Handlers
 * Handle shell operations like opening external URLs
 */

import { ipcMain, shell } from 'electron';
import { logInfo, logError } from '../utils/logger';

/**
 * Register shell IPC handlers
 */
export function registerShellHandlers(): void {
  // Open external URL in default browser
  ipcMain.handle('shell:openExternal', async (_event, url: string): Promise<void> => {
    console.log('[IPC] shell:openExternal called with URL:', url);
    logInfo('Opening external URL', { url });

    try {
      // Validate URL format
      const urlObj = new URL(url);
      
      // Only allow http and https protocols for security
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        const error = `Invalid protocol: ${urlObj.protocol}. Only http and https are allowed.`;
        console.error('[IPC] Invalid URL protocol:', urlObj.protocol);
        logError('Invalid URL protocol', new Error(error), { url, protocol: urlObj.protocol });
        throw new Error(error);
      }

      // Open URL in default browser
      await shell.openExternal(url);
      console.log('[IPC] External URL opened successfully');
      logInfo('External URL opened successfully', { url });
    } catch (error) {
      console.error('[IPC] Failed to open external URL:', error);
      logError('Failed to open external URL', error, { url });
      throw error;
    }
  });
}

