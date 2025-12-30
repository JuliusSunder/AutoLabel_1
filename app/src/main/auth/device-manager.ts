/**
 * Device Manager
 * Handles device ID generation and storage
 */

import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { logInfo, logError, logDebug } from '../utils/logger';

const DATA_DIR = path.join(app.getPath('userData'), 'data');
const DEVICE_FILE = path.join(DATA_DIR, 'device.json');

interface DeviceInfo {
  deviceId: string;
  createdAt: string;
}

/**
 * Ensure data directory exists
 */
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    logDebug('Created data directory', { path: DATA_DIR });
  }
}

/**
 * Get or create device ID
 * Device ID is generated once and never changes
 */
export function getOrCreateDeviceId(): string {
  try {
    ensureDataDir();

    // Check if device file exists
    if (fs.existsSync(DEVICE_FILE)) {
      const data = fs.readFileSync(DEVICE_FILE, 'utf-8');
      const deviceInfo: DeviceInfo = JSON.parse(data);
      
      logDebug('Device ID loaded from file', { deviceId: deviceInfo.deviceId });
      return deviceInfo.deviceId;
    }

    // Generate new device ID
    const deviceId = uuidv4();
    const deviceInfo: DeviceInfo = {
      deviceId,
      createdAt: new Date().toISOString(),
    };

    // Save to file
    fs.writeFileSync(DEVICE_FILE, JSON.stringify(deviceInfo, null, 2), 'utf-8');
    logInfo('New device ID generated', { deviceId });

    return deviceId;
  } catch (error) {
    logError('Failed to get or create device ID', error);
    throw error;
  }
}

/**
 * Get device ID (returns null if not exists)
 */
export function getDeviceId(): string | null {
  try {
    if (!fs.existsSync(DEVICE_FILE)) {
      return null;
    }

    const data = fs.readFileSync(DEVICE_FILE, 'utf-8');
    const deviceInfo: DeviceInfo = JSON.parse(data);
    return deviceInfo.deviceId;
  } catch (error) {
    logError('Failed to get device ID', error);
    return null;
  }
}

/**
 * Check if device is registered
 */
export function isDeviceRegistered(): boolean {
  return fs.existsSync(DEVICE_FILE);
}

