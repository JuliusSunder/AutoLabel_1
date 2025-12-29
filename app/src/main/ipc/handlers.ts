/**
 * IPC Handlers Registration
 * Central place to register all IPC handlers
 */

import { registerScanHandlers } from './scan';
import { registerSalesHandlers } from './sales';
import { registerLabelsHandlers } from './labels';
import { registerAttachmentsHandlers } from './attachments';
import { registerPrintHandlers } from './print';
import { registerConfigHandlers } from './config';
import { registerLoggingHandlers } from './logging';
import { registerLicenseHandlers } from './license';

/**
 * Register all IPC handlers
 * Call this once during app initialization
 */
export function registerAllHandlers(): void {
  console.log('[IPC] Registering all IPC handlers...');

  registerLoggingHandlers();
  registerLicenseHandlers();
  registerScanHandlers();
  registerSalesHandlers();
  registerLabelsHandlers();
  registerAttachmentsHandlers();
  registerPrintHandlers();
  registerConfigHandlers();

  console.log('[IPC] All IPC handlers registered successfully');
}
