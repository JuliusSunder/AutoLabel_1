/**
 * Print Queue Manager
 * Manages print jobs and retries
 */

import { printPdf, getDefaultPrinter, listPrinters, clearPrinterQueue } from './printer-manager';
import * as printJobsRepo from '../database/repositories/print-jobs';
import * as labelsRepo from '../database/repositories/labels';
import { validateLabelCreation } from '../auth/auth-manager';
import type { PrintJob } from '../../shared/types';
import fs from 'node:fs';
import { logToRenderer } from '../utils/renderer-logger';

/**
 * Add labels to print queue without immediately printing
 */
export async function addToQueue(
  labelIds: string[],
  printerName?: string
): Promise<PrintJob> {
  console.log(`[Print Queue] Adding ${labelIds.length} labels to queue`);

  // Verify labels exist
  const labels = labelsRepo.getPreparedLabelsByIds(labelIds);
  if (labels.length === 0) {
    throw new Error('Keine gültigen Labels gefunden');
  }

  if (labels.length !== labelIds.length) {
    console.warn(
      `[Print Queue] Only found ${labels.length}/${labelIds.length} labels`
    );
  }

  // Validate all label files exist
  const missingLabels: string[] = [];
  for (const label of labels) {
    if (!label.outputPath || !fs.existsSync(label.outputPath)) {
      missingLabels.push(label.id);
    }
  }

  if (missingLabels.length > 0) {
    throw new Error(
      `Label-Dateien nicht gefunden: ${missingLabels.length} von ${labels.length}`
    );
  }

  // Determine printer
  let targetPrinter = printerName;
  if (!targetPrinter) {
    targetPrinter = await getDefaultPrinter();
    if (!targetPrinter) {
      throw new Error('Kein Drucker ausgewählt');
    }
  }

  // Validate printer exists
  const availablePrinters = await listPrinters();
  const printerExists = availablePrinters.some(
    (p) => p.name === targetPrinter
  );
  if (!printerExists) {
    throw new Error(`Drucker "${targetPrinter}" nicht verfügbar`);
  }

  // Create print job (stays in 'pending' status)
  const printJob = printJobsRepo.createPrintJob({
    printerName: targetPrinter,
    labelIds: labels.map((l) => l.id),
  });

  console.log(`[Print Queue] Added to queue: ${printJob.id}`);

  return printJob;
}

/**
 * Start a print job (immediately begins printing)
 */
export async function startPrintJob(
  labelIds: string[],
  printerName?: string
): Promise<PrintJob> {
  console.log(`[Print Queue] Starting print job for ${labelIds.length} labels`);

  // Verify labels exist
  const labels = labelsRepo.getPreparedLabelsByIds(labelIds);
  if (labels.length === 0) {
    throw new Error('Keine gültigen Labels gefunden');
  }

  if (labels.length !== labelIds.length) {
    console.warn(
      `[Print Queue] Only found ${labels.length}/${labelIds.length} labels`
    );
  }

  // Validate all label files exist
  const missingLabels: string[] = [];
  for (const label of labels) {
    if (!label.outputPath || !fs.existsSync(label.outputPath)) {
      missingLabels.push(label.id);
    }
  }

  if (missingLabels.length > 0) {
    throw new Error(
      `Label-Dateien nicht gefunden: ${missingLabels.length} von ${labels.length}`
    );
  }

  // Determine printer
  let targetPrinter = printerName;
  if (!targetPrinter) {
    targetPrinter = await getDefaultPrinter();
    if (!targetPrinter) {
      throw new Error('Kein Drucker ausgewählt');
    }
  }

  // Validate printer exists
  const availablePrinters = await listPrinters();
  const printerExists = availablePrinters.some(
    (p) => p.name === targetPrinter
  );
  if (!printerExists) {
    throw new Error(`Drucker "${targetPrinter}" nicht verfügbar`);
  }

  // IMPORTANT: Validate label creation with server BEFORE printing
  // This is where the usage counter gets incremented
  const labelCount = labels.length;
  console.log(`[Print Queue] Validating label creation with server...`, { labelCount });
  const validation = await validateLabelCreation(labelCount);
  
  if (!validation.allowed) {
    throw new Error(validation.reason || 'Label-Druck nicht erlaubt');
  }

  console.log(`[Print Queue] Label creation validated by server`, { 
    remaining: validation.remaining,
    limit: validation.limit,
  });

  // Create print job
  const printJob = printJobsRepo.createPrintJob({
    printerName: targetPrinter,
    labelIds: labels.map((l) => l.id),
  });

  console.log(`[Print Queue] Created print job: ${printJob.id}`);

  // NOTE: Usage counter is now incremented on server via validateLabelCreation above
  // No local increment needed

  // Start printing in background
  processPrintJob(printJob.id).catch((error) => {
    console.error('[Print Queue] Print job failed:', error);
  });

  return printJob;
}

/**
 * Process a print job (print all labels)
 */
async function processPrintJob(jobId: string): Promise<void> {
  console.log(`[Print Queue] ========================================`);
  console.log(`[Print Queue] 🖨️ Processing print job: ${jobId}`);
  logToRenderer(`[Print Queue] 🖨️ Starting print job...`);

  const job = printJobsRepo.getPrintJobById(jobId);
  if (!job) {
    console.error(`[Print Queue] Job not found: ${jobId}`);
    logToRenderer(`[Print Queue] ❌ Job not found: ${jobId}`);
    return;
  }

  console.log(`[Print Queue] Printer: ${job.printerName}`);
  console.log(`[Print Queue] Labels to print: ${job.labelIds.length}`);
  logToRenderer(`[Print Queue] Printer: ${job.printerName}, Labels: ${job.labelIds.length}`);

  // Update status to printing
  printJobsRepo.updatePrintJobStatus(jobId, 'printing');

  const errors: string[] = [];
  let printedCount = 0;

  // Get labels
  const labels = labelsRepo.getPreparedLabelsByIds(job.labelIds);

  for (const label of labels) {
    try {
      console.log(`[Print Queue] 🖨️ Printing label ${printedCount + 1}/${labels.length}: ${label.id}`);
      logToRenderer(`[Print Queue] 🖨️ Printing label ${printedCount + 1}/${labels.length}...`);
      console.log(`[Print Queue] Label path: ${label.outputPath}`);
      console.log(`[Print Queue] Printer: ${job.printerName}`);
      console.log(`[Print Queue] About to call printPdf()...`);
      logToRenderer(`[Print Queue] Calling printPdf()...`);

      // Print the label
      await printPdf(label.outputPath, job.printerName);
      
      console.log(`[Print Queue] printPdf() returned successfully`);
      logToRenderer(`[Print Queue] printPdf() returned successfully`);

      // Update item status
      printJobsRepo.updatePrintJobItemStatus(jobId, label.id, 'printed');

      // Increment count
      printedCount++;
      printJobsRepo.incrementPrintedCount(jobId);

      console.log(
        `[Print Queue] ✅ Successfully printed ${printedCount}/${labels.length}`
      );
      logToRenderer(`[Print Queue] ✅ Successfully printed ${printedCount}/${labels.length}`);
    } catch (error) {
      console.error(`[Print Queue] Failed to print label ${label.id}:`, error);
      logToRenderer(`[Print Queue] ❌ Failed to print label ${label.id}: ${error}`);

      const errorMsg =
        error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Label ${label.id}: ${errorMsg}`);

      // Update item status
      printJobsRepo.updatePrintJobItemStatus(
        jobId,
        label.id,
        'failed',
        errorMsg
      );
    }
  }

  // Update final status
  const finalStatus =
    printedCount === labels.length && errors.length === 0
      ? 'completed'
      : 'failed';

  printJobsRepo.updatePrintJobStatus(
    jobId,
    finalStatus,
    printedCount,
    errors.length > 0 ? errors : undefined
  );

  if (finalStatus === 'failed') {
    console.error(
      `[Print Queue] ❌ Job ${jobId} FAILED: ${printedCount}/${labels.length} printed, ${errors.length} errors`
    );
    logToRenderer(`[Print Queue] ❌ Print job FAILED: ${printedCount}/${labels.length} printed`);
  } else {
    console.log(
      `[Print Queue] ✅ Job ${jobId} completed successfully: ${printedCount}/${labels.length} printed`
    );
    logToRenderer(`[Print Queue] ✅ Print job completed: ${printedCount}/${labels.length} printed`);
  }
  console.log(`[Print Queue] ========================================`);
}

/**
 * Get print job status
 */
export function getPrintJobStatus(jobId: string): PrintJob | null {
  return printJobsRepo.getPrintJobById(jobId);
}

/**
 * Start a pending print job from the queue
 */
export async function startQueuedJob(jobId: string): Promise<void> {
  console.log(`[Print Queue] Starting queued job: ${jobId}`);

  const job = printJobsRepo.getPrintJobById(jobId);
  if (!job) {
    throw new Error('Druck-Job nicht gefunden');
  }

  if (job.status !== 'pending') {
    throw new Error('Nur wartende Jobs können gestartet werden');
  }

  // Validate printer still exists
  const availablePrinters = await listPrinters();
  const printerExists = availablePrinters.some(
    (p) => p.name === job.printerName
  );
  if (!printerExists) {
    throw new Error(`Drucker "${job.printerName}" nicht verfügbar`);
  }

  // IMPORTANT: Validate label creation with server BEFORE printing
  // This is where the usage counter gets incremented for queued jobs
  const labelCount = job.labelIds.length;
  console.log(`[Print Queue] Validating label creation with server...`, { labelCount });
  const validation = await validateLabelCreation(labelCount);
  
  if (!validation.allowed) {
    throw new Error(validation.reason || 'Label-Druck nicht erlaubt');
  }

  console.log(`[Print Queue] Label creation validated by server`, { 
    remaining: validation.remaining,
    limit: validation.limit,
  });

  // Start processing
  processPrintJob(jobId).catch((error) => {
    console.error('[Print Queue] Print job failed:', error);
  });
}

/**
 * Retry a failed print job
 */
export async function retryPrintJob(jobId: string): Promise<void> {
  console.log(`[Print Queue] Retrying print job: ${jobId}`);

  const job = printJobsRepo.getPrintJobById(jobId);
  if (!job) {
    throw new Error('Druck-Job nicht gefunden');
  }

  // Validate printer still exists
  const availablePrinters = await listPrinters();
  const printerExists = availablePrinters.some(
    (p) => p.name === job.printerName
  );
  if (!printerExists) {
    throw new Error(`Drucker "${job.printerName}" nicht verfügbar`);
  }

  // Reset job status
  printJobsRepo.updatePrintJobStatus(jobId, 'pending', 0);

  // Restart processing
  await processPrintJob(jobId);
}

/**
 * Get all print jobs
 */
export function getAllPrintJobs(): PrintJob[] {
  return printJobsRepo.getAllPrintJobs();
}

/**
 * Delete a print job
 */
export async function deletePrintJob(jobId: string): Promise<void> {
  console.log(`[Print Queue] Deleting print job: ${jobId}`);

  const job = printJobsRepo.getPrintJobById(jobId);
  if (!job) {
    throw new Error('Druck-Job nicht gefunden');
  }

  // Only allow deletion of non-printing jobs
  if (job.status === 'printing') {
    throw new Error('Druckende Jobs können nicht gelöscht werden');
  }

  // Clear any pending jobs from Windows Print Spooler
  // This prevents jobs from being printed if the printer comes back online
  try {
    await clearPrinterQueue(job.printerName);
    console.log(`[Print Queue] Cleared Windows print queue for printer: ${job.printerName}`);
  } catch (error) {
    console.warn(`[Print Queue] Could not clear Windows print queue:`, error);
    // Continue with deletion even if clearing fails
  }

  printJobsRepo.deletePrintJob(jobId);
}