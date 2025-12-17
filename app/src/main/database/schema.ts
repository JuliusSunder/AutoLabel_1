/**
 * SQLite Database Schema for AutoLabel
 * 
 * Tables:
 * - sales: Extracted sale records from emails
 * - attachments: Label attachments (PDFs/images) linked to sales
 * - prepared_labels: Normalized labels ready for printing
 * - print_jobs: Print queue and history
 */

import type Database from 'better-sqlite3';

export function initializeSchema(db: Database.Database): void {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Sales table - core sale records
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      email_id TEXT UNIQUE NOT NULL,
      date TEXT NOT NULL,
      platform TEXT,
      product_number TEXT,
      item_title TEXT,
      buyer_ref TEXT,
      metadata_json TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create index for date-based queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sales_date 
    ON sales(date DESC)
  `);

  // Create index for email_id deduplication lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sales_email_id 
    ON sales(email_id)
  `);

  // Attachments table - label files linked to sales
  db.exec(`
    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('pdf', 'image')),
      local_path TEXT NOT NULL,
      source_email_id TEXT NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
    )
  `);

  // Create index for sale_id lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_attachments_sale_id 
    ON attachments(sale_id)
  `);

  // Prepared labels table - normalized labels ready for printing
  db.exec(`
    CREATE TABLE IF NOT EXISTS prepared_labels (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      output_path TEXT NOT NULL,
      size_mm TEXT NOT NULL,
      dpi INTEGER NOT NULL DEFAULT 300,
      footer_config TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
    )
  `);

  // Create index for sale_id lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_prepared_labels_sale_id 
    ON prepared_labels(sale_id)
  `);

  // Print jobs table - print queue and history
  db.exec(`
    CREATE TABLE IF NOT EXISTS print_jobs (
      id TEXT PRIMARY KEY,
      printer_name TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'printing', 'completed', 'failed')),
      printed_count INTEGER NOT NULL DEFAULT 0,
      total_count INTEGER NOT NULL,
      errors_json TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Print job items - many-to-many relationship between jobs and labels
  db.exec(`
    CREATE TABLE IF NOT EXISTS print_job_items (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      label_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'printed', 'failed')),
      error TEXT,
      FOREIGN KEY (job_id) REFERENCES print_jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (label_id) REFERENCES prepared_labels(id) ON DELETE CASCADE
    )
  `);

  // Create index for job_id lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_print_job_items_job_id 
    ON print_job_items(job_id)
  `);
}

/**
 * Migration system for future schema changes
 * Currently just initializes v1 schema
 */
export function runMigrations(db: Database.Database): void {
  // Create migrations table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Check current version
  const currentVersion = db
    .prepare('SELECT MAX(version) as version FROM schema_migrations')
    .get() as { version: number | null };

  const version = currentVersion?.version || 0;

  // Migration 1: Initial schema
  if (version < 1) {
    initializeSchema(db);
    db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(1);
  }

  // Future migrations go here:
  // if (version < 2) { ... }
}
