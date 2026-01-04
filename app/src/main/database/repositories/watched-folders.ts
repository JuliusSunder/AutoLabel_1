/**
 * Watched Folders Repository - CRUD operations for watched_folders table
 */

import type Database from 'better-sqlite3';
import { getDatabase, generateId } from '../db';
import type { WatchedFolder, WatchedFolderRow } from '../../../shared/types';

/**
 * Convert database row to WatchedFolder object
 */
function rowToFolder(row: WatchedFolderRow): WatchedFolder {
  return {
    id: row.id,
    name: row.name,
    folderPath: row.folder_path,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  };
}

/**
 * Create a new watched folder
 */
export function createWatchedFolder(
  data: Omit<WatchedFolder, 'id' | 'createdAt'>
): WatchedFolder {
  const db = getDatabase();
  const id = generateId();
  const createdAt = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO watched_folders (
      id, name, folder_path, is_active, created_at
    ) VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.name,
    data.folderPath,
    data.isActive ? 1 : 0,
    createdAt
  );

  return {
    ...data,
    id,
    createdAt,
  };
}

/**
 * Get watched folder by ID
 */
export function getWatchedFolder(id: string): WatchedFolder | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM watched_folders WHERE id = ?');
  const row = stmt.get(id) as WatchedFolderRow | undefined;

  if (!row) {
    return null;
  }

  return rowToFolder(row);
}

/**
 * Get all watched folders
 */
export function getAllWatchedFolders(): WatchedFolder[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM watched_folders ORDER BY created_at ASC');
  const rows = stmt.all() as WatchedFolderRow[];

  console.log(`[DB] getAllWatchedFolders: Found ${rows.length} total folder(s)`);
  rows.forEach(row => {
    console.log(`  - ${row.name} (${row.folder_path}), is_active=${row.is_active}`);
  });

  return rows.map((row) => rowToFolder(row));
}

/**
 * Get only active watched folders
 */
export function getActiveFolders(): WatchedFolder[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM watched_folders WHERE is_active = 1 ORDER BY created_at ASC');
  const rows = stmt.all() as WatchedFolderRow[];

  console.log(`[DB] getActiveFolders: Found ${rows.length} active folder(s) in database`);
  rows.forEach(row => {
    console.log(`  - ${row.name} (${row.folder_path}), is_active=${row.is_active}`);
  });

  return rows.map((row) => rowToFolder(row));
}

/**
 * Update a watched folder
 */
export function updateWatchedFolder(
  id: string,
  data: Partial<Omit<WatchedFolder, 'id' | 'createdAt'>>
): void {
  const db = getDatabase();
  const current = getWatchedFolder(id);

  if (!current) {
    throw new Error(`Watched folder not found: ${id}`);
  }

  // Build dynamic update query
  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }

  if (data.folderPath !== undefined) {
    updates.push('folder_path = ?');
    values.push(data.folderPath);
  }

  if (data.isActive !== undefined) {
    updates.push('is_active = ?');
    values.push(data.isActive ? 1 : 0);
  }

  if (updates.length === 0) {
    return; // Nothing to update
  }

  values.push(id);

  const stmt = db.prepare(`
    UPDATE watched_folders 
    SET ${updates.join(', ')}
    WHERE id = ?
  `);

  stmt.run(...values);
}

/**
 * Delete a watched folder
 */
export function deleteWatchedFolder(id: string): void {
  const db = getDatabase();

  // Note: Sales with this folder_id will have their folder_id set to NULL
  // (no CASCADE DELETE on sales, to preserve historical data)
  db.prepare('UPDATE sales SET folder_id = NULL WHERE folder_id = ?').run(id);
  
  const stmt = db.prepare('DELETE FROM watched_folders WHERE id = ?');
  stmt.run(id);
}

/**
 * Toggle folder active status
 */
export function toggleFolderActive(id: string): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE watched_folders 
    SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END
    WHERE id = ?
  `);
  stmt.run(id);
}

/**
 * Check if a folder with the given path already exists
 */
export function folderExistsByPath(folderPath: string, excludeId?: string): boolean {
  const db = getDatabase();
  let stmt;
  let result;
  
  if (excludeId) {
    stmt = db.prepare('SELECT COUNT(*) as count FROM watched_folders WHERE folder_path = ? AND id != ?');
    result = stmt.get(folderPath, excludeId) as { count: number };
  } else {
    stmt = db.prepare('SELECT COUNT(*) as count FROM watched_folders WHERE folder_path = ?');
    result = stmt.get(folderPath) as { count: number };
  }
  
  return result.count > 0;
}

