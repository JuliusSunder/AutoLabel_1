/**
 * Labels IPC Handlers
 * Handle label preparation operations
 */

import { ipcMain } from 'electron';
import { prepareLabels } from '../labels/processor';
import type { PreparedLabel, FooterConfig } from '../../shared/types';

/**
 * Register labels IPC handlers
 */
export function registerLabelsHandlers(): void {
  // Prepare labels for selected sales
  ipcMain.handle(
    'labels:prepare',
    async (
      _event,
      params: { saleIds: string[]; footerConfig: FooterConfig }
    ): Promise<PreparedLabel[]> => {
      console.log('[IPC] labels:prepare called with:', params);

      try {
        const preparedLabels = await prepareLabels(
          params.saleIds,
          params.footerConfig
        );
        console.log(`[IPC] Prepared ${preparedLabels.length} labels`);
        return preparedLabels;
      } catch (error) {
        console.error('[IPC] Label preparation failed:', error);
        throw error;
      }
    }
  );
}
