/**
 * Sales IPC Handlers
 * Handle sales listing and retrieval
 */

import { ipcMain } from 'electron';
import * as salesRepo from '../database/repositories/sales';
import type { Sale } from '../../shared/types';
import { logError, logDebug } from '../utils/logger';
import { getUserFriendlyError } from '../utils/error-messages';

/**
 * Register sales IPC handlers
 */
export function registerSalesHandlers(): void {
  // List sales with optional date and account filtering
  ipcMain.handle(
    'sales:list',
    async (
      _event,
      params: { fromDate?: string; toDate?: string; accountId?: string }
    ): Promise<Sale[]> => {
      console.log('[IPC] sales:list called with params:', params);
      logDebug('Listing sales', { params });

      try {
        const sales = salesRepo.listSales(params);
        console.log(`[IPC] Returning ${sales.length} sales`);
        logDebug('Sales listed successfully', { count: sales.length });
        return sales;
      } catch (error) {
        console.error('[IPC] Error listing sales:', error);
        logError('Failed to list sales', error, { params });
        
        const userFriendlyMessage = getUserFriendlyError(error);
        throw new Error(userFriendlyMessage);
      }
    }
  );

  // Get single sale by ID
  ipcMain.handle('sales:get', async (_event, id: string): Promise<Sale | null> => {
    console.log('[IPC] sales:get called for ID:', id);
    logDebug('Getting sale by ID', { saleId: id });

    try {
      const sale = salesRepo.getSaleById(id);
      logDebug('Sale retrieved', { saleId: id, found: !!sale });
      return sale;
    } catch (error) {
      console.error('[IPC] Error getting sale:', error);
      logError('Failed to get sale', error, { saleId: id });
      
      const userFriendlyMessage = getUserFriendlyError(error);
      throw new Error(userFriendlyMessage);
    }
  });
}
