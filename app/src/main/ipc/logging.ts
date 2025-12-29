/**
 * Logging IPC Handlers
 * Handle logging from renderer process
 */

import { ipcMain } from 'electron';
import { logError, logWarning, logInfo, logDebug, getLogDirectory, getLogFiles } from '../utils/logger';

export interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Register logging IPC handlers
 */
export function registerLoggingHandlers(): void {
  // Log error from renderer
  ipcMain.handle('log:error', async (_event, message: string, error?: any, context?: Record<string, any>) => {
    console.log('[IPC] log:error called:', message);
    
    try {
      logError(message, error, { source: 'renderer', ...context });
      return { success: true };
    } catch (err) {
      console.error('[IPC] Failed to log error:', err);
      return { success: false, error: 'Failed to log error' };
    }
  });

  // Log warning from renderer
  ipcMain.handle('log:warn', async (_event, message: string, context?: Record<string, any>) => {
    console.log('[IPC] log:warn called:', message);
    
    try {
      logWarning(message, { source: 'renderer', ...context });
      return { success: true };
    } catch (err) {
      console.error('[IPC] Failed to log warning:', err);
      return { success: false, error: 'Failed to log warning' };
    }
  });

  // Log info from renderer
  ipcMain.handle('log:info', async (_event, message: string, context?: Record<string, any>) => {
    console.log('[IPC] log:info called:', message);
    
    try {
      logInfo(message, { source: 'renderer', ...context });
      return { success: true };
    } catch (err) {
      console.error('[IPC] Failed to log info:', err);
      return { success: false, error: 'Failed to log info' };
    }
  });

  // Log debug from renderer
  ipcMain.handle('log:debug', async (_event, message: string, context?: Record<string, any>) => {
    console.log('[IPC] log:debug called:', message);
    
    try {
      logDebug(message, { source: 'renderer', ...context });
      return { success: true };
    } catch (err) {
      console.error('[IPC] Failed to log debug:', err);
      return { success: false, error: 'Failed to log debug' };
    }
  });

  // Get log directory path
  ipcMain.handle('log:getDirectory', async () => {
    try {
      return { success: true, directory: getLogDirectory() };
    } catch (err) {
      console.error('[IPC] Failed to get log directory:', err);
      return { success: false, error: 'Failed to get log directory' };
    }
  });

  // Get list of log files
  ipcMain.handle('log:getFiles', async () => {
    try {
      const files = getLogFiles();
      return { success: true, files };
    } catch (err) {
      console.error('[IPC] Failed to get log files:', err);
      return { success: false, error: 'Failed to get log files' };
    }
  });

  console.log('[IPC] Logging handlers registered');
}

