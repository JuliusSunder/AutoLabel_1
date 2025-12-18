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
      item_title, buyer_ref, metadata_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    createdAt
  );

  return {
    ...data,
    id,
    createdAt,
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
 * List sales with optional date filtering
 */
export function listSales(params: {
  fromDate?: string;
  toDate?: string;
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
