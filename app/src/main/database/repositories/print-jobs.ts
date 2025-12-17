/**
 * Print Jobs Repository - CRUD operations for print_jobs table
 */

import type Database from 'better-sqlite3';
import { getDatabase, generateId } from '../db';
import type { PrintJob, PrintJobRow } from '../../../shared/types';

/**
 * Convert database row to PrintJob object
 */
function rowToPrintJob(row: PrintJobRow): PrintJob {
  return {
    id: row.id,
    printerName: row.printer_name,
    labelIds: [], // Will be populated separately
    status: row.status as PrintJob['status'],
    printedCount: row.printed_count,
    totalCount: row.total_count,
    errors: row.errors_json ? JSON.parse(row.errors_json) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get label IDs for a print job
 */
function getLabelIdsForJob(jobId: string): string[] {
  const db = getDatabase();
  const stmt = db.prepare(
    'SELECT label_id FROM print_job_items WHERE job_id = ? ORDER BY id'
  );
  const rows = stmt.all(jobId) as Array<{ label_id: string }>;
  return rows.map((r) => r.label_id);
}

/**
 * Create a new print job
 */
export function createPrintJob(data: {
  printerName: string;
  labelIds: string[];
}): PrintJob {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  // Start transaction
  const insertJob = db.prepare(`
    INSERT INTO print_jobs (
      id, printer_name, status, printed_count, 
      total_count, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertItem = db.prepare(`
    INSERT INTO print_job_items (id, job_id, label_id, status)
    VALUES (?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    insertJob.run(
      id,
      data.printerName,
      'pending',
      0,
      data.labelIds.length,
      now,
      now
    );

    for (const labelId of data.labelIds) {
      insertItem.run(generateId(), id, labelId, 'pending');
    }
  });

  transaction();

  return {
    id,
    printerName: data.printerName,
    labelIds: data.labelIds,
    status: 'pending',
    printedCount: 0,
    totalCount: data.labelIds.length,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get print job by ID
 */
export function getPrintJobById(id: string): PrintJob | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM print_jobs WHERE id = ?');
  const row = stmt.get(id) as PrintJobRow | undefined;

  if (!row) return null;

  const job = rowToPrintJob(row);
  job.labelIds = getLabelIdsForJob(id);
  return job;
}

/**
 * Update print job status
 */
export function updatePrintJobStatus(
  id: string,
  status: PrintJob['status'],
  printedCount?: number,
  errors?: string[]
): void {
  const db = getDatabase();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    UPDATE print_jobs 
    SET status = ?, 
        printed_count = COALESCE(?, printed_count),
        errors_json = ?,
        updated_at = ?
    WHERE id = ?
  `);

  stmt.run(
    status,
    printedCount !== undefined ? printedCount : null,
    errors ? JSON.stringify(errors) : null,
    now,
    id
  );
}

/**
 * Update individual print job item status
 */
export function updatePrintJobItemStatus(
  jobId: string,
  labelId: string,
  status: 'pending' | 'printed' | 'failed',
  error?: string
): void {
  const db = getDatabase();

  const stmt = db.prepare(`
    UPDATE print_job_items 
    SET status = ?, error = ?
    WHERE job_id = ? AND label_id = ?
  `);

  stmt.run(status, error || null, jobId, labelId);
}

/**
 * Increment printed count for a job
 */
export function incrementPrintedCount(jobId: string): void {
  const db = getDatabase();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    UPDATE print_jobs 
    SET printed_count = printed_count + 1,
        updated_at = ?
    WHERE id = ?
  `);

  stmt.run(now, jobId);
}

/**
 * List all print jobs
 */
export function getAllPrintJobs(): PrintJob[] {
  const db = getDatabase();
  const stmt = db.prepare(
    'SELECT * FROM print_jobs ORDER BY created_at DESC'
  );
  const rows = stmt.all() as PrintJobRow[];

  return rows.map((row) => {
    const job = rowToPrintJob(row);
    job.labelIds = getLabelIdsForJob(row.id);
    return job;
  });
}

/**
 * Get recent print jobs (last N)
 */
export function getRecentPrintJobs(limit: number = 50): PrintJob[] {
  const db = getDatabase();
  const stmt = db.prepare(
    'SELECT * FROM print_jobs ORDER BY created_at DESC LIMIT ?'
  );
  const rows = stmt.all(limit) as PrintJobRow[];

  return rows.map((row) => {
    const job = rowToPrintJob(row);
    job.labelIds = getLabelIdsForJob(row.id);
    return job;
  });
}
