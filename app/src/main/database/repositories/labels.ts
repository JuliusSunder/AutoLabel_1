/**
 * Labels Repository - CRUD operations for prepared_labels table
 */

import type Database from 'better-sqlite3';
import { getDatabase, generateId } from '../db';
import type { PreparedLabel, PreparedLabelRow } from '../../../shared/types';

/**
 * Convert database row to PreparedLabel object
 */
function rowToLabel(row: PreparedLabelRow): PreparedLabel {
  return {
    id: row.id,
    saleId: row.sale_id,
    profileId: row.profile_id,
    outputPath: row.output_path,
    sizeMm: JSON.parse(row.size_mm),
    dpi: row.dpi,
    footerApplied: !!row.footer_config,
    footerConfig: row.footer_config ? JSON.parse(row.footer_config) : undefined,
    createdAt: row.created_at,
  };
}

/**
 * Create a new prepared label
 */
export function createPreparedLabel(
  data: Omit<PreparedLabel, 'id' | 'createdAt'>
): PreparedLabel {
  const db = getDatabase();
  const id = generateId();
  const createdAt = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO prepared_labels (
      id, sale_id, profile_id, output_path, 
      size_mm, dpi, footer_config, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.saleId,
    data.profileId,
    data.outputPath,
    JSON.stringify(data.sizeMm),
    data.dpi,
    data.footerConfig ? JSON.stringify(data.footerConfig) : null,
    createdAt
  );

  return {
    ...data,
    id,
    createdAt,
  };
}

/**
 * Get prepared label by ID
 */
export function getPreparedLabelById(id: string): PreparedLabel | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM prepared_labels WHERE id = ?');
  const row = stmt.get(id) as PreparedLabelRow | undefined;
  return row ? rowToLabel(row) : null;
}

/**
 * Get all prepared labels for a sale
 */
export function getPreparedLabelsBySaleId(saleId: string): PreparedLabel[] {
  const db = getDatabase();
  const stmt = db.prepare(
    'SELECT * FROM prepared_labels WHERE sale_id = ? ORDER BY created_at DESC'
  );
  const rows = stmt.all(saleId) as PreparedLabelRow[];
  return rows.map(rowToLabel);
}

/**
 * Get multiple prepared labels by IDs
 */
export function getPreparedLabelsByIds(ids: string[]): PreparedLabel[] {
  if (ids.length === 0) return [];

  const db = getDatabase();
  const placeholders = ids.map(() => '?').join(',');
  const stmt = db.prepare(
    `SELECT * FROM prepared_labels WHERE id IN (${placeholders})`
  );
  const rows = stmt.all(...ids) as PreparedLabelRow[];
  return rows.map(rowToLabel);
}

/**
 * Delete a prepared label
 */
export function deletePreparedLabel(id: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM prepared_labels WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * List all prepared labels (for debugging)
 */
export function getAllPreparedLabels(): PreparedLabel[] {
  const db = getDatabase();
  const stmt = db.prepare(
    'SELECT * FROM prepared_labels ORDER BY created_at DESC'
  );
  const rows = stmt.all() as PreparedLabelRow[];
  return rows.map(rowToLabel);
}
