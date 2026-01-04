/**
 * Sales Repository - CRUD operations for sales table
 */

import type Database from 'better-sqlite3';
import { getDatabase, generateId } from '../db';
import type { Sale, SaleRow } from '../../../shared/types';

/**
 * Convert database row to Sale object
 */
function rowToSale(row: SaleRow): Sale {
  return {
    id: row.id,
    emailId: row.email_id,
    date: row.date,
    platform: row.platform || undefined,
    shippingCompany: row.shipping_company || undefined,
    productNumber: row.product_number || undefined,
    itemTitle: row.item_title || undefined,
    buyerRef: row.buyer_ref || undefined,
    metadata: row.metadata_json ? JSON.parse(row.metadata_json) : undefined,
    createdAt: row.created_at,
    accountId: row.account_id || undefined,
    folderId: row.folder_id || undefined,
  };
}

/**
 * Insert a new sale
 */
export function createSale(data: Omit<Sale, 'id' | 'createdAt'>): Sale {
  const db = getDatabase();
  const id = generateId();
  const createdAt = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO sales (
      id, email_id, date, platform, shipping_company, product_number, 
      item_title, buyer_ref, metadata_json, created_at, account_id, folder_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.emailId,
    data.date,
    data.platform || null,
    data.shippingCompany || null,
    data.productNumber || null,
    data.itemTitle || null,
    data.buyerRef || null,
    data.metadata ? JSON.stringify(data.metadata) : null,
    createdAt,
    data.accountId || null,
    data.folderId || null
  );

  // Return the sale with actual values (convert null to undefined for consistency)
  return {
    id,
    emailId: data.emailId,
    date: data.date,
    platform: data.platform || undefined,
    shippingCompany: data.shippingCompany || undefined,
    productNumber: data.productNumber || undefined,
    itemTitle: data.itemTitle || undefined,
    buyerRef: data.buyerRef || undefined,
    metadata: data.metadata,
    createdAt,
    accountId: data.accountId || undefined,
    folderId: data.folderId || undefined,
  };
}

/**
 * Get sale by ID
 */
export function getSaleById(id: string): Sale | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM sales WHERE id = ?');
  const row = stmt.get(id) as SaleRow | undefined;
  return row ? rowToSale(row) : null;
}

/**
 * Get sale by email ID (for deduplication)
 */
export function getSaleByEmailId(emailId: string): Sale | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM sales WHERE email_id = ?');
  const row = stmt.get(emailId) as SaleRow | undefined;
  return row ? rowToSale(row) : null;
}

/**
 * Update a sale's fields
 */
export function updateSale(
  id: string,
  updates: Partial<Omit<Sale, 'id' | 'createdAt'>>
): void {
  const db = getDatabase();
  
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.platform !== undefined) {
    fields.push('platform = ?');
    values.push(updates.platform);
  }
  if (updates.shippingCompany !== undefined) {
    fields.push('shipping_company = ?');
    values.push(updates.shippingCompany);
  }
  if (updates.productNumber !== undefined) {
    fields.push('product_number = ?');
    values.push(updates.productNumber);
  }
  if (updates.itemTitle !== undefined) {
    fields.push('item_title = ?');
    values.push(updates.itemTitle);
  }
  if (updates.buyerRef !== undefined) {
    fields.push('buyer_ref = ?');
    values.push(updates.buyerRef);
  }
  if (updates.metadata !== undefined) {
    fields.push('metadata_json = ?');
    values.push(JSON.stringify(updates.metadata));
  }
  
  if (fields.length === 0) {
    return; // Nothing to update
  }
  
  values.push(id); // Add ID for WHERE clause
  
  const stmt = db.prepare(`
    UPDATE sales 
    SET ${fields.join(', ')}
    WHERE id = ?
  `);
  
  stmt.run(...values);
}

/**
 * List sales with optional date, account, and folder filtering
 */
export function listSales(params: {
  fromDate?: string;
  toDate?: string;
  accountId?: string;
  folderId?: string;
}): Sale[] {
  const db = getDatabase();
  let query = `
    SELECT 
      s.*,
      (SELECT COUNT(*) FROM attachments WHERE sale_id = s.id) as attachment_count
    FROM sales s 
    WHERE 1=1
  `;
  const queryParams: any[] = [];

  if (params.fromDate) {
    query += ' AND s.date >= ?';
    queryParams.push(params.fromDate);
  }

  if (params.toDate) {
    query += ' AND s.date <= ?';
    queryParams.push(params.toDate);
  }

  if (params.accountId) {
    query += ' AND s.account_id = ?';
    queryParams.push(params.accountId);
  }

  if (params.folderId) {
    query += ' AND s.folder_id = ?';
    queryParams.push(params.folderId);
  }

  query += ' ORDER BY s.date DESC, s.created_at DESC';

  const stmt = db.prepare(query);
  const rows = stmt.all(...queryParams) as (SaleRow & { attachment_count: number })[];
  
  return rows.map(row => {
    const sale = rowToSale(row);
    return {
      ...sale,
      hasAttachments: row.attachment_count > 0,
    };
  });
}

/**
 * Get all sales for a specific account
 */
export function getSalesByAccount(accountId: string): Sale[] {
  return listSales({ accountId });
}

/**
 * Get sales count per account
 */
export function getSalesCountByAccount(): Record<string, number> {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT 
      COALESCE(account_id, 'null') as account_id, 
      COUNT(*) as count 
    FROM sales 
    GROUP BY account_id
  `);
  const rows = stmt.all() as Array<{ account_id: string; count: number }>;
  
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.account_id] = row.count;
  }
  
  return counts;
}

/**
 * Get sales count per folder
 */
export function getSalesCountByFolder(): Record<string, number> {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT 
      COALESCE(folder_id, 'null') as folder_id, 
      COUNT(*) as count 
    FROM sales 
    GROUP BY folder_id
  `);
  const rows = stmt.all() as Array<{ folder_id: string; count: number }>;
  
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.folder_id] = row.count;
  }
  
  return counts;
}

/**
 * Delete a sale by ID (cascades to attachments and labels)
 */
export function deleteSale(id: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM sales WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Get all sales (for debugging/admin)
 */
export function getAllSales(): Sale[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM sales ORDER BY date DESC');
  const rows = stmt.all() as SaleRow[];
  return rows.map(rowToSale);
}
