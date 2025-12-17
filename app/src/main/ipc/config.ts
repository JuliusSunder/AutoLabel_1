/**
 * Config IPC Handlers
 * Handle application configuration
 */

import { ipcMain } from 'electron';
import { loadConfig, saveConfig } from '../config';
import type { AppConfig } from '../../shared/types';

/**
 * Register config IPC handlers
 */
export function registerConfigHandlers(): void {
  // Get configuration
  ipcMain.handle('config:get', async (): Promise<AppConfig> => {
    console.log('[IPC] config:get called');

    try {
      const config = loadConfig();
      // Don't send password to renderer for security
      if (config.imap) {
        return {
          ...config,
          imap: {
            ...config.imap,
            password: '***', // Masked
          },
        };
      }
      return config;
    } catch (error) {
      console.error('[IPC] Error loading config:', error);
      throw error;
    }
  });

  // Set configuration
  ipcMain.handle('config:set', async (_event, partial: Partial<AppConfig>): Promise<void> => {
    console.log('[IPC] config:set called');

    try {
      // Load current config
      const current = loadConfig();

      // Merge with new values
      const updated: AppConfig = {
        ...current,
        ...partial,
      };

      // If password is masked, keep the old one
      if (partial.imap && partial.imap.password === '***' && current.imap) {
        updated.imap = {
          ...partial.imap,
          password: current.imap.password,
        };
      }

      saveConfig(updated);
      console.log('[IPC] Configuration saved successfully');
    } catch (error) {
      console.error('[IPC] Error saving config:', error);
      throw error;
    }
  });
}
