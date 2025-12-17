/**
 * Application configuration management
 * Handles app settings and IMAP credentials (encrypted)
 */

import { app, safeStorage } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type { AppConfig, IMAPConfig } from '../shared/types';

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

    const config: AppConfig = {
      scanDays: stored.scanDays,
      lastScanDate: stored.lastScanDate,
      defaultFooterConfig: stored.defaultFooterConfig,
    };

    // Decrypt IMAP password if present
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
