/**
 * Config IPC Handlers
 * Handle application configuration and email account management
 */

import { ipcMain } from 'electron';
import { loadConfig, saveConfig } from '../config';
import type { AppConfig, EmailAccount } from '../../shared/types';
import {
  getAllEmailAccounts,
  createEmailAccount,
  updateEmailAccount,
  deleteEmailAccount,
  toggleAccountActive,
  accountExistsByUsername,
} from '../database/repositories/email-accounts';
import { ImapClient } from '../email/imap-client';
import { getEmailAccount } from '../database/repositories/email-accounts';

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

  // ========================================================================
  // Email Account Management Handlers
  // ========================================================================

  // List all email accounts (without passwords)
  ipcMain.handle('accounts:list', async (): Promise<EmailAccount[]> => {
    console.log('[IPC] accounts:list called');

    try {
      const accounts = getAllEmailAccounts(false); // Don't decrypt passwords
      return accounts;
    } catch (error) {
      console.error('[IPC] Error listing accounts:', error);
      throw error;
    }
  });

  // Create new email account
  ipcMain.handle('accounts:create', async (_event, data: Omit<EmailAccount, 'id' | 'createdAt'>): Promise<EmailAccount> => {
    console.log('[IPC] accounts:create called');

    try {
      // Check for duplicate username
      if (accountExistsByUsername(data.username)) {
        throw new Error(`An account with username "${data.username}" already exists`);
      }

      const account = createEmailAccount(data);
      console.log(`[IPC] Created email account: ${account.id}`);
      
      // Return without password
      return {
        ...account,
        password: '***',
      };
    } catch (error) {
      console.error('[IPC] Error creating account:', error);
      throw error;
    }
  });

  // Update email account
  ipcMain.handle('accounts:update', async (_event, id: string, data: Partial<Omit<EmailAccount, 'id' | 'createdAt'>>): Promise<void> => {
    console.log('[IPC] accounts:update called for account:', id);

    try {
      // Check for duplicate username if username is being changed
      if (data.username && accountExistsByUsername(data.username, id)) {
        throw new Error(`An account with username "${data.username}" already exists`);
      }

      updateEmailAccount(id, data);
      console.log(`[IPC] Updated email account: ${id}`);
    } catch (error) {
      console.error('[IPC] Error updating account:', error);
      throw error;
    }
  });

  // Delete email account
  ipcMain.handle('accounts:delete', async (_event, id: string): Promise<void> => {
    console.log('[IPC] accounts:delete called for account:', id);

    try {
      deleteEmailAccount(id);
      console.log(`[IPC] Deleted email account: ${id}`);
    } catch (error) {
      console.error('[IPC] Error deleting account:', error);
      throw error;
    }
  });

  // Toggle account active status
  ipcMain.handle('accounts:toggle', async (_event, id: string): Promise<void> => {
    console.log('[IPC] accounts:toggle called for account:', id);

    try {
      toggleAccountActive(id);
      console.log(`[IPC] Toggled account active status: ${id}`);
    } catch (error) {
      console.error('[IPC] Error toggling account:', error);
      throw error;
    }
  });

  // Test account connection
  ipcMain.handle('accounts:test', async (_event, config: { host: string; port: number; username: string; password: string; tls: boolean }): Promise<{ success: boolean; error?: string }> => {
    console.log('[IPC] accounts:test called for:', config.username);

    try {
      const client = new ImapClient(config);
      await client.connect();
      await client.disconnect();
      
      console.log('[IPC] Account connection test successful');
      return { success: true };
    } catch (error) {
      console.error('[IPC] Account connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Test existing account connection (using saved password)
  ipcMain.handle('accounts:testExisting', async (_event, accountId: string): Promise<{ success: boolean; error?: string }> => {
    console.log('[IPC] accounts:testExisting called for account:', accountId);

    try {
      const account = getEmailAccount(accountId, true); // decrypt password
      if (!account) {
        return {
          success: false,
          error: 'Account not found',
        };
      }

      const client = new ImapClient({
        host: account.host,
        port: account.port,
        username: account.username,
        password: account.password,
        tls: account.tls,
      });
      
      await client.connect();
      await client.disconnect();
      
      console.log('[IPC] Existing account connection test successful');
      return { success: true };
    } catch (error) {
      console.error('[IPC] Existing account connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
}
