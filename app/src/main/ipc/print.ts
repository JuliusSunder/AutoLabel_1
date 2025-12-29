/**
 * Print IPC Handlers
 * Handle printing operations
 */

import { ipcMain } from 'electron';
import {
  startPrintJob,
  addToQueue,
  startQueuedJob,
  getPrintJobStatus,
  getAllPrintJobs,
  retryPrintJob,
  deletePrintJob,
} from '../printing/print-queue';
import { listPrinters } from '../printing/printer-manager';
import type { PrintJob, PrinterInfo } from '../../shared/types';
import { logError, logInfo, logDebug } from '../utils/logger';
import { getUserFriendlyError } from '../utils/error-messages';

/**
 * Register print IPC handlers
 */
export function registerPrintHandlers(): void {
  // Add to print queue (without immediately printing)
  ipcMain.handle(
    'print:addToQueue',
    async (
      _event,
      params: { labelIds: string[]; printerName?: string }
    ): Promise<PrintJob> => {
      console.log('[IPC] print:addToQueue called with:', params);
      logInfo('Adding to print queue', { 
        labelCount: params.labelIds.length,
        printer: params.printerName || 'default',
      });

      try {
        const printJob = await addToQueue(
          params.labelIds,
          params.printerName
        );
        console.log(`[IPC] Added to queue: ${printJob.id}`);
        logInfo('Added to print queue', { 
          jobId: printJob.id,
          labelCount: params.labelIds.length,
        });
        return printJob;
      } catch (error) {
        console.error('[IPC] Failed to add to queue:', error);
        logError('Failed to add to print queue', error, { 
          labelIds: params.labelIds,
          printer: params.printerName,
        });
        
        const userFriendlyMessage = getUserFriendlyError(error);
        throw new Error(userFriendlyMessage);
      }
    }
  );

  // Start print job
  ipcMain.handle(
    'print:start',
    async (
      _event,
      params: { labelIds: string[]; printerName?: string }
    ): Promise<PrintJob> => {
      console.log('[IPC] print:start called with:', params);
      logInfo('Starting print job', { 
        labelCount: params.labelIds.length,
        printer: params.printerName || 'default',
      });

      try {
        const printJob = await startPrintJob(
          params.labelIds,
          params.printerName
        );
        console.log(`[IPC] Started print job: ${printJob.id}`);
        logInfo('Print job started', { 
          jobId: printJob.id,
          labelCount: params.labelIds.length,
        });
        return printJob;
      } catch (error) {
        console.error('[IPC] Failed to start print job:', error);
        logError('Failed to start print job', error, { 
          labelIds: params.labelIds,
          printer: params.printerName,
        });
        
        const userFriendlyMessage = getUserFriendlyError(error);
        throw new Error(userFriendlyMessage);
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
    logDebug('Listing available printers');

    try {
      const printers = await listPrinters();
      console.log(`[IPC] Found ${printers.length} printers`);
      logDebug('Printers listed', { count: printers.length });
      return printers;
    } catch (error) {
      console.error('[IPC] Failed to list printers:', error);
      logError('Failed to list printers', error);
      
      const userFriendlyMessage = getUserFriendlyError(error);
      throw new Error(userFriendlyMessage);
    }
  });

  // List all print jobs
  ipcMain.handle('print:listJobs', async (): Promise<PrintJob[]> => {
    console.log('[IPC] print:listJobs called');
    logDebug('Listing print jobs');

    try {
      const jobs = getAllPrintJobs();
      console.log(`[IPC] Found ${jobs.length} print jobs`);
      logDebug('Print jobs listed', { count: jobs.length });
      return jobs;
    } catch (error) {
      console.error('[IPC] Failed to list print jobs:', error);
      logError('Failed to list print jobs', error);
      
      const userFriendlyMessage = getUserFriendlyError(error);
      throw new Error(userFriendlyMessage);
    }
  });

  // Start a queued job
  ipcMain.handle('print:startQueued', async (_event, jobId: string): Promise<void> => {
    console.log('[IPC] print:startQueued called for job:', jobId);
    logInfo('Starting queued print job', { jobId });

    try {
      await startQueuedJob(jobId);
      console.log(`[IPC] Successfully started queued job: ${jobId}`);
      logInfo('Queued print job started', { jobId });
    } catch (error) {
      console.error('[IPC] Failed to start queued job:', error);
      logError('Failed to start queued print job', error, { jobId });
      
      const userFriendlyMessage = getUserFriendlyError(error);
      throw new Error(userFriendlyMessage);
    }
  });

  // Retry a print job
  ipcMain.handle('print:retry', async (_event, jobId: string): Promise<void> => {
    console.log('[IPC] print:retry called for job:', jobId);
    logInfo('Retrying print job', { jobId });

    try {
      await retryPrintJob(jobId);
      console.log(`[IPC] Successfully retried print job: ${jobId}`);
      logInfo('Print job retried', { jobId });
    } catch (error) {
      console.error('[IPC] Failed to retry print job:', error);
      logError('Failed to retry print job', error, { jobId });
      
      const userFriendlyMessage = getUserFriendlyError(error);
      throw new Error(userFriendlyMessage);
    }
  });

  // Delete a print job
  ipcMain.handle('print:delete', async (_event, jobId: string): Promise<void> => {
    console.log('[IPC] print:delete called for job:', jobId);
    logInfo('Deleting print job', { jobId });

    try {
      await deletePrintJob(jobId);
      console.log(`[IPC] Successfully deleted print job: ${jobId}`);
      logInfo('Print job deleted', { jobId });
    } catch (error) {
      console.error('[IPC] Failed to delete print job:', error);
      logError('Failed to delete print job', error, { jobId });
      
      const userFriendlyMessage = getUserFriendlyError(error);
      throw new Error(userFriendlyMessage);
    }
  });
}
