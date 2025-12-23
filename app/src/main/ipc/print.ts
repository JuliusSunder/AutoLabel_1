/**
 * Print IPC Handlers
 * Handle printing operations
 */

import { ipcMain } from 'electron';
import {
  startPrintJob,
  getPrintJobStatus,
  getAllPrintJobs,
  retryPrintJob,
  deletePrintJob,
} from '../printing/print-queue';
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

  // List all print jobs
  ipcMain.handle('print:listJobs', async (): Promise<PrintJob[]> => {
    console.log('[IPC] print:listJobs called');

    try {
      const jobs = getAllPrintJobs();
      console.log(`[IPC] Found ${jobs.length} print jobs`);
      return jobs;
    } catch (error) {
      console.error('[IPC] Failed to list print jobs:', error);
      throw error;
    }
  });

  // Retry a print job
  ipcMain.handle('print:retry', async (_event, jobId: string): Promise<void> => {
    console.log('[IPC] print:retry called for job:', jobId);

    try {
      await retryPrintJob(jobId);
      console.log(`[IPC] Successfully retried print job: ${jobId}`);
    } catch (error) {
      console.error('[IPC] Failed to retry print job:', error);
      throw error;
    }
  });

  // Delete a print job
  ipcMain.handle('print:delete', async (_event, jobId: string): Promise<void> => {
    console.log('[IPC] print:delete called for job:', jobId);

    try {
      deletePrintJob(jobId);
      console.log(`[IPC] Successfully deleted print job: ${jobId}`);
    } catch (error) {
      console.error('[IPC] Failed to delete print job:', error);
      throw error;
    }
  });
}
