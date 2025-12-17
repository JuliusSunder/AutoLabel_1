/**
 * Print IPC Handlers
 * Handle printing operations
 */

import { ipcMain } from 'electron';
import { startPrintJob, getPrintJobStatus } from '../printing/print-queue';
import { listPrinters } from '../printing/printer-manager';
import type { PrintJob, PrinterInfo } from '../../shared/types';

/**
 * Register print IPC handlers
 */
export function registerPrintHandlers(): void {
  // Start print job
  ipcMain.handle(
    'print:start',
    async (
      _event,
      params: { labelIds: string[]; printerName?: string }
    ): Promise<PrintJob> => {
      console.log('[IPC] print:start called with:', params);

      try {
        const printJob = await startPrintJob(
          params.labelIds,
          params.printerName
        );
        console.log(`[IPC] Started print job: ${printJob.id}`);
        return printJob;
      } catch (error) {
        console.error('[IPC] Failed to start print job:', error);
        throw error;
      }
    }
  );

  // Get print job status
  ipcMain.handle(
    'print:status',
    async (_event, jobId: string): Promise<PrintJob | null> => {
      console.log('[IPC] print:status called for job:', jobId);

      try {
        const status = getPrintJobStatus(jobId);
        return status;
      } catch (error) {
        console.error('[IPC] Failed to get print job status:', error);
        throw error;
      }
    }
  );

  // List available printers
  ipcMain.handle('print:listPrinters', async (): Promise<PrinterInfo[]> => {
    console.log('[IPC] print:listPrinters called');

    try {
      const printers = await listPrinters();
      console.log(`[IPC] Found ${printers.length} printers`);
      return printers;
    } catch (error) {
      console.error('[IPC] Failed to list printers:', error);
      throw error;
    }
  });
}
