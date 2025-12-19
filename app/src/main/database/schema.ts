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
      original_filename TEXT,
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

  // Migration 2: Add shipping_company column to sales table
  if (version < 2) {
    // Check if column already exists (safe migration)
    const tableInfo = db.pragma('table_info(sales)');
    const hasShippingCompany = tableInfo.some(
      (col: any) => col.name === 'shipping_company'
    );
    
    if (!hasShippingCompany) {
      db.exec('ALTER TABLE sales ADD COLUMN shipping_company TEXT');
      console.log('[Schema] Added shipping_company column to sales table');
    }
    
    db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(2);
  }

  // Migration 3: Populate shipping_company from metadata for existing sales
  if (version < 3) {
    console.log('[Schema] Populating shipping_company from metadata...');
    
    // Get all sales with metadata but no shipping_company
    const sales = db.prepare(`
      SELECT id, metadata_json 
      FROM sales 
      WHERE shipping_company IS NULL 
      AND metadata_json IS NOT NULL
    `).all() as Array<{ id: string; metadata_json: string }>;
    
    const updateStmt = db.prepare('UPDATE sales SET shipping_company = ? WHERE id = ?');
    
    for (const sale of sales) {
      try {
        const metadata = JSON.parse(sale.metadata_json);
        const subject = (metadata.subject || '').toLowerCase();
        const from = (metadata.from || '').toLowerCase();
        const allText = `${subject} ${from}`;
        
        // Detect shipping company from metadata
        let shippingCompany: string | null = null;
        
        if (allText.includes('myhermes') || allText.includes('hermes')) {
          shippingCompany = 'Hermes';
        } else if (allText.includes('dhl')) {
          shippingCompany = 'DHL';
        } else if (allText.includes('dpd')) {
          shippingCompany = 'DPD';
        } else if (allText.includes('gls')) {
          shippingCompany = 'GLS';
        } else if (allText.includes('ups')) {
          shippingCompany = 'UPS';
        }
        
        if (shippingCompany) {
          updateStmt.run(shippingCompany, sale.id);
          console.log(`[Schema] Updated sale ${sale.id} with shipping company: ${shippingCompany}`);
        }
      } catch (err) {
        console.error(`[Schema] Failed to update sale ${sale.id}:`, err);
      }
    }
    
    console.log(`[Schema] Updated ${sales.length} sales with shipping company data`);
    db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(3);
  }

  // Migration 4: Add original_filename column to attachments table
  if (version < 4) {
    console.log('[Schema] Adding original_filename column to attachments table...');
    
    // Check if column already exists (safe migration)
    const tableInfo = db.pragma('table_info(attachments)');
    const hasOriginalFilename = tableInfo.some(
      (col: any) => col.name === 'original_filename'
    );
    
    if (!hasOriginalFilename) {
      db.exec('ALTER TABLE attachments ADD COLUMN original_filename TEXT');
      console.log('[Schema] Added original_filename column to attachments table');
    }
    
    db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(4);
  }

  // Migration 5: Populate attachment metadata from filename analysis
  if (version < 5) {
    console.log('[Schema] Analyzing attachment filenames for shipping company detection...');
    
    // Get all sales with attachments but no shipping company
    const salesWithAttachments = db.prepare(`
      SELECT DISTINCT s.id, s.platform, s.metadata_json
      FROM sales s
      INNER JOIN attachments a ON a.sale_id = s.id
      WHERE s.shipping_company IS NULL
      AND a.original_filename IS NOT NULL
    `).all() as Array<{ id: string; platform: string | null; metadata_json: string | null }>;
    
    const updateStmt = db.prepare('UPDATE sales SET shipping_company = ? WHERE id = ?');
    let updated = 0;
    
    for (const sale of salesWithAttachments) {
      try {
        // Get attachments for this sale
        const attachments = db.prepare('SELECT original_filename FROM attachments WHERE sale_id = ?')
          .all(sale.id) as Array<{ original_filename: string | null }>;
        
        // Check filenames for shipping company indicators
        const allFilenames = attachments
          .map(a => (a.original_filename || '').toLowerCase())
          .join(' ');
        
        let metadata: any = {};
        try {
          metadata = sale.metadata_json ? JSON.parse(sale.metadata_json) : {};
        } catch {}
        
        const subject = (metadata.subject || '').toLowerCase();
        const from = (metadata.from || '').toLowerCase();
        const allText = `${from} ${subject} ${allFilenames}`;
        
        // Detect shipping company
        let shippingCompany: string | null = null;
        
        // Special handling for Vinted - check for carrier mentions
        // Vinted includes carrier name in subject or attachment filename
        if ((sale.platform === 'Vinted/Kleiderkreisel' || from.includes('vinted')) && !shippingCompany) {
          // Check if filename or subject mentions specific carriers
          if (allText.includes('hermes') || allText.includes('myhermes')) {
            shippingCompany = 'Hermes';
          } else if (allText.includes('dhl')) {
            shippingCompany = 'DHL';
          } else if (allText.includes('dpd')) {
            shippingCompany = 'DPD';
          } else if (allText.includes('gls')) {
            shippingCompany = 'GLS';
          } else if (allText.includes('ups')) {
            shippingCompany = 'UPS';
          }
          // No default - if carrier not detected, leave as null
        }
        
        // General detection for other platforms
        if (!shippingCompany) {
          if (allText.includes('myhermes') || allText.includes('hermes')) {
            shippingCompany = 'Hermes';
          } else if (allText.includes('dhl')) {
            shippingCompany = 'DHL';
          } else if (allText.includes('dpd')) {
            shippingCompany = 'DPD';
          } else if (allText.includes('gls')) {
            shippingCompany = 'GLS';
          } else if (allText.includes('ups')) {
            shippingCompany = 'UPS';
          }
        }
        
        if (shippingCompany) {
          updateStmt.run(shippingCompany, sale.id);
          updated++;
          console.log(`[Schema] Detected ${shippingCompany} for sale ${sale.id}`);
        }
      } catch (err) {
        console.error(`[Schema] Failed to analyze sale ${sale.id}:`, err);
      }
    }
    
    console.log(`[Schema] Updated ${updated} sales with shipping company from filename analysis`);
    db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(5);
  }

  // Future migrations go here:
  // if (version < 6) { ... }
}
