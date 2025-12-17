/**
 * Print Queue Manager
 * Manages print jobs and retries
 */

import { printPdf } from './printer-manager';
import * as printJobsRepo from '../database/repositories/print-jobs';
import * as labelsRepo from '../database/repositories/labels';
import type { PrintJob } from '../../shared/types';

/**
 * Start a print job
 */
export async function startPrintJob(
  labelIds: string[],
  printerName?: string
): Promise<PrintJob> {
  console.log(`[Print Queue] Starting print job for ${labelIds.length} labels`);

  // Verify labels exist
  const labels = labelsRepo.getPreparedLabelsByIds(labelIds);
  if (labels.length === 0) {
    throw new Error('No valid labels found');
  }

  if (labels.length !== labelIds.length) {
    console.warn(
      `[Print Queue] Only found ${labels.length}/${labelIds.length} labels`
    );
  }

  // Determine printer
  let targetPrinter = printerName;
  if (!targetPrinter) {
    // TODO: Get default printer
    targetPrinter = 'default';
  }

  // Create print job
  const printJob = printJobsRepo.createPrintJob({
    printerName: targetPrinter,
    labelIds: labels.map((l) => l.id),
  });

  console.log(`[Print Queue] Created print job: ${printJob.id}`);

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
  console.log(`[Print Queue] Processing print job: ${jobId}`);

  const job = printJobsRepo.getPrintJobById(jobId);
  if (!job) {
    console.error(`[Print Queue] Job not found: ${jobId}`);
    return;
  }

  // Update status to printing
  printJobsRepo.updatePrintJobStatus(jobId, 'printing');

  const errors: string[] = [];
  let printedCount = 0;

  // Get labels
  const labels = labelsRepo.getPreparedLabelsByIds(job.labelIds);

  for (const label of labels) {
    try {
      console.log(`[Print Queue] Printing label: ${label.id}`);

      // Print the label
      await printPdf(label.outputPath, job.printerName);

      // Update item status
      printJobsRepo.updatePrintJobItemStatus(jobId, label.id, 'printed');

      // Increment count
      printedCount++;
      printJobsRepo.incrementPrintedCount(jobId);

      console.log(
        `[Print Queue] Successfully printed ${printedCount}/${labels.length}`
      );
    } catch (error) {
      console.error(`[Print Queue] Failed to print label ${label.id}:`, error);

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
    printedCount === labels.length
      ? 'completed'
      : printedCount > 0
      ? 'completed' // Partial success still marked as completed
      : 'failed';

  printJobsRepo.updatePrintJobStatus(
    jobId,
    finalStatus,
    printedCount,
    errors.length > 0 ? errors : undefined
  );

  console.log(
    `[Print Queue] Job ${jobId} ${finalStatus}: ${printedCount}/${labels.length} printed`
  );
}

/**
 * Get print job status
 */
export function getPrintJobStatus(jobId: string): PrintJob | null {
  return printJobsRepo.getPrintJobById(jobId);
}

/**
 * Retry a failed print job
 */
export async function retryPrintJob(jobId: string): Promise<void> {
  console.log(`[Print Queue] Retrying print job: ${jobId}`);

  const job = printJobsRepo.getPrintJobById(jobId);
  if (!job) {
    throw new Error('Print job not found');
  }

  // Reset job status
  printJobsRepo.updatePrintJobStatus(jobId, 'pending', 0);

  // Restart processing
  await processPrintJob(jobId);
}
