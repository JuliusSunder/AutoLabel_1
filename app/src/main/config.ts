/**
 * Application configuration management
 * Handles app settings and IMAP credentials (encrypted)
 */

import { app, safeStorage } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type { AppConfig, IMAPConfig } from '../shared/types';
import { createEmailAccount, getAllEmailAccounts } from './database/repositories/email-accounts';

const CONFIG_FILE = 'config.json';

interface StoredConfig {
  imap?: {
    host: string;
    port: number;
    username: string;
    encryptedPassword: string; // Base64 encoded encrypted password
    tls: boolean;
  };
  scanDays: number;
  lastScanDate?: string;
  defaultFooterConfig: {
    includeProductNumber: boolean;
    includeItemTitle: boolean;
    includeDate: boolean;
    includeBuyerRef: boolean;
  };
}

/**
 * Get config file path
 */
function getConfigPath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, CONFIG_FILE);
}

/**
 * Get default configuration
 */
function getDefaultConfig(): AppConfig {
  return {
    scanDays: 30,
    defaultFooterConfig: {
      includeProductNumber: true,
      includeItemTitle: false,
      includeDate: true,
      includeBuyerRef: false,
    },
  };
}

/**
 * Encrypt password using Electron's safeStorage
 */
function encryptPassword(password: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    console.warn('[Config] Encryption not available, storing password as-is (NOT RECOMMENDED)');
    return Buffer.from(password).toString('base64');
  }
  const encrypted = safeStorage.encryptString(password);
  return encrypted.toString('base64');
}

/**
 * Decrypt password using Electron's safeStorage
 */
function decryptPassword(encryptedBase64: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    console.warn('[Config] Encryption not available, reading unencrypted password');
    return Buffer.from(encryptedBase64, 'base64').toString('utf-8');
  }
  const encrypted = Buffer.from(encryptedBase64, 'base64');
  return safeStorage.decryptString(encrypted);
}

/**
 * Migrate old IMAP config to email_accounts table
 */
function migrateConfigToAccounts(): boolean {
  try {
    const configPath = getConfigPath();
    
    if (!fs.existsSync(configPath)) {
      return false; // No config to migrate
    }

    const data = fs.readFileSync(configPath, 'utf-8');
    const stored: StoredConfig = JSON.parse(data);

    // Check if old IMAP config exists
    if (!stored.imap) {
      return false; // Nothing to migrate
    }

    console.log('[Config] Migrating old IMAP config to email_accounts table...');

    // Check if we already have accounts (migration already done)
    const existingAccounts = getAllEmailAccounts();
    if (existingAccounts.length > 0) {
      console.log('[Config] Email accounts already exist, skipping migration');
      // Still remove old config
      delete stored.imap;
      fs.writeFileSync(configPath, JSON.stringify(stored, null, 2), 'utf-8');
      return false;
    }

    // Create default account from old config
    const imapConfig = stored.imap;
    createEmailAccount({
      name: 'Default Account',
      host: imapConfig.host,
      port: imapConfig.port,
      username: imapConfig.username,
      password: decryptPassword(imapConfig.encryptedPassword),
      tls: imapConfig.tls,
      isActive: true,
    });

    console.log('[Config] Created default email account from old IMAP config');

    // Remove old IMAP config from file
    delete stored.imap;
    fs.writeFileSync(configPath, JSON.stringify(stored, null, 2), 'utf-8');
    
    console.log('[Config] Migration complete - removed old IMAP config from file');
    return true;
  } catch (error) {
    console.error('[Config] Failed to migrate config:', error);
    return false;
  }
}

/**
 * Load configuration from disk
 */
export function loadConfig(): AppConfig {
  const configPath = getConfigPath();

  if (!fs.existsSync(configPath)) {
    console.log('[Config] No config file found, using defaults');
    return getDefaultConfig();
  }

  try {
    const data = fs.readFileSync(configPath, 'utf-8');
    const stored: StoredConfig = JSON.parse(data);

    // Try to migrate old config (will only run once)
    if (stored.imap) {
      migrateConfigToAccounts();
    }

    const config: AppConfig = {
      scanDays: stored.scanDays,
      lastScanDate: stored.lastScanDate,
      defaultFooterConfig: stored.defaultFooterConfig,
    };

    // Legacy: Decrypt IMAP password if present (shouldn't be after migration)
    if (stored.imap) {
      config.imap = {
        host: stored.imap.host,
        port: stored.imap.port,
        username: stored.imap.username,
        password: decryptPassword(stored.imap.encryptedPassword),
        tls: stored.imap.tls,
      };
    }

    return config;
  } catch (error) {
    console.error('[Config] Failed to load config:', error);
    return getDefaultConfig();
  }
}

/**
 * Save configuration to disk
 */
export function saveConfig(config: AppConfig): void {
  const configPath = getConfigPath();

  const stored: StoredConfig = {
    scanDays: config.scanDays,
    lastScanDate: config.lastScanDate,
    defaultFooterConfig: config.defaultFooterConfig,
  };

  // Encrypt IMAP password if present
  if (config.imap) {
    stored.imap = {
      host: config.imap.host,
      port: config.imap.port,
      username: config.imap.username,
      encryptedPassword: encryptPassword(config.imap.password),
      tls: config.imap.tls,
    };
  }

  try {
    fs.writeFileSync(configPath, JSON.stringify(stored, null, 2), 'utf-8');
    console.log('[Config] Configuration saved successfully');
  } catch (error) {
    console.error('[Config] Failed to save config:', error);
    throw error;
  }
}

/**
 * Update partial configuration
 */
export function updateConfig(partial: Partial<AppConfig>): void {
  const current = loadConfig();
  const updated = { ...current, ...partial };
  saveConfig(updated);
}
