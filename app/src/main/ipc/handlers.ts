/**
 * IPC Handlers Registration
 * Central place to register all IPC handlers
 */

import { registerScanHandlers } from './scan';
import { registerSalesHandlers } from './sales';
import { registerLabelsHandlers } from './labels';
import { registerPrintHandlers } from './print';
import { registerConfigHandlers } from './config';

/**
 * Register all IPC handlers
 * Call this once during app initialization
 */
export function registerAllHandlers(): void {
  console.log('[IPC] Registering all IPC handlers...');

  registerScanHandlers();
  registerSalesHandlers();
  registerLabelsHandlers();
  registerPrintHandlers();
  registerConfigHandlers();

  console.log('[IPC] All IPC handlers registered successfully');
}
