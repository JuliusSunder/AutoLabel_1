/**
 * Attachments Repository - CRUD operations for attachments table
 */

import type Database from 'better-sqlite3';
import { getDatabase, generateId } from '../db';
import type { Attachment, AttachmentRow } from '../../../shared/types';

/**
 * Convert database row to Attachment object
 */
function rowToAttachment(row: AttachmentRow): Attachment {
  return {
    id: row.id,
    saleId: row.sale_id,
    type: row.type as 'pdf' | 'image',
    localPath: row.local_path,
    sourceEmailId: row.source_email_id,
  };
}

/**
 * Create a new attachment
 */
export function createAttachment(
  data: Omit<Attachment, 'id'>
): Attachment {
  const db = getDatabase();
  const id = generateId();

  const stmt = db.prepare(`
    INSERT INTO attachments (
      id, sale_id, type, local_path, source_email_id
    ) VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.saleId,
    data.type,
    data.localPath,
    data.sourceEmailId
  );

  return {
    ...data,
    id,
  };
}

/**
 * Get attachment by ID
 */
export function getAttachmentById(id: string): Attachment | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM attachments WHERE id = ?');
  const row = stmt.get(id) as AttachmentRow | undefined;
  return row ? rowToAttachment(row) : null;
}

/**
 * Get all attachments for a sale
 */
export function getAttachmentsBySaleId(saleId: string): Attachment[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM attachments WHERE sale_id = ?');
  const rows = stmt.all(saleId) as AttachmentRow[];
  return rows.map(rowToAttachment);
}

/**
 * Delete an attachment
 */
export function deleteAttachment(id: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM attachments WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Get all attachments (for debugging)
 */
export function getAllAttachments(): Attachment[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM attachments');
  const rows = stmt.all() as AttachmentRow[];
  return rows.map(rowToAttachment);
}

