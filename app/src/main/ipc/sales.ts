/**
 * Sales IPC Handlers
 * Handle sales listing and retrieval
 */

import { ipcMain } from 'electron';
import * as salesRepo from '../database/repositories/sales';
import type { Sale } from '../../shared/types';

/**
 * Register sales IPC handlers
 */
export function registerSalesHandlers(): void {
  // List sales with optional date filtering
  ipcMain.handle(
    'sales:list',
    async (
      _event,
      params: { fromDate?: string; toDate?: string }
    ): Promise<Sale[]> => {
      console.log('[IPC] sales:list called with params:', params);

      try {
        const sales = salesRepo.listSales(params);
        console.log(`[IPC] Returning ${sales.length} sales`);
        return sales;
      } catch (error) {
        console.error('[IPC] Error listing sales:', error);
        throw error;
      }
    }
  );

  // Get single sale by ID
  ipcMain.handle('sales:get', async (_event, id: string): Promise<Sale | null> => {
    console.log('[IPC] sales:get called for ID:', id);

    try {
      const sale = salesRepo.getSaleById(id);
      return sale;
    } catch (error) {
      console.error('[IPC] Error getting sale:', error);
      throw error;
    }
  });
}
