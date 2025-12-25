/**
 * Email Accounts Repository - CRUD operations for email_accounts table
 */

import type Database from 'better-sqlite3';
import { getDatabase, generateId } from '../db';
import type { EmailAccount, EmailAccountRow } from '../../../shared/types';
import { safeStorage } from 'electron';

/**
 * Convert database row to EmailAccount object
 */
function rowToAccount(row: EmailAccountRow, decryptPassword: boolean = true): EmailAccount {
  return {
    id: row.id,
    name: row.name,
    host: row.host,
    port: row.port,
    username: row.username,
    password: decryptPassword ? decryptPasswordFromRow(row.encrypted_password) : '***',
    tls: row.tls === 1,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  };
}

/**
 * Encrypt password using Electron's safeStorage
 */
function encryptPassword(password: string): string {
  const encrypted = safeStorage.encryptString(password);
  return encrypted.toString('base64');
}

/**
 * Decrypt password using Electron's safeStorage
 */
function decryptPasswordFromRow(encryptedBase64: string): string {
  const encrypted = Buffer.from(encryptedBase64, 'base64');
  return safeStorage.decryptString(encrypted);
}

/**
 * Create a new email account
 */
export function createEmailAccount(
  data: Omit<EmailAccount, 'id' | 'createdAt'>
): EmailAccount {
  const db = getDatabase();
  const id = generateId();
  const createdAt = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO email_accounts (
      id, name, host, port, username, encrypted_password, tls, is_active, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.name,
    data.host,
    data.port,
    data.username,
    encryptPassword(data.password),
    data.tls ? 1 : 0,
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
 * Get email account by ID
 */
export function getEmailAccount(id: string, decryptPassword: boolean = true): EmailAccount | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM email_accounts WHERE id = ?');
  const row = stmt.get(id) as EmailAccountRow | undefined;

  if (!row) {
    return null;
  }

  return rowToAccount(row, decryptPassword);
}

/**
 * Get all email accounts
 */
export function getAllEmailAccounts(decryptPassword: boolean = false): EmailAccount[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM email_accounts ORDER BY created_at ASC');
  const rows = stmt.all() as EmailAccountRow[];

  console.log(`[DB] getAllEmailAccounts: Found ${rows.length} total account(s)`);
  rows.forEach(row => {
    console.log(`  - ${row.name} (${row.username}), is_active=${row.is_active}`);
  });

  return rows.map((row) => rowToAccount(row, decryptPassword));
}

/**
 * Get only active email accounts
 */
export function getActiveAccounts(decryptPassword: boolean = true): EmailAccount[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM email_accounts WHERE is_active = 1 ORDER BY created_at ASC');
  const rows = stmt.all() as EmailAccountRow[];

  console.log(`[DB] getActiveAccounts: Found ${rows.length} active account(s) in database`);
  rows.forEach(row => {
    console.log(`  - ${row.name} (${row.username}), is_active=${row.is_active}`);
  });

  return rows.map((row) => rowToAccount(row, decryptPassword));
}

/**
 * Update an email account
 */
export function updateEmailAccount(
  id: string,
  data: Partial<Omit<EmailAccount, 'id' | 'createdAt'>>
): void {
  const db = getDatabase();
  const current = getEmailAccount(id);

  if (!current) {
    throw new Error(`Email account not found: ${id}`);
  }

  // Build dynamic update query
  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }

  if (data.host !== undefined) {
    updates.push('host = ?');
    values.push(data.host);
  }

  if (data.port !== undefined) {
    updates.push('port = ?');
    values.push(data.port);
  }

  if (data.username !== undefined) {
    updates.push('username = ?');
    values.push(data.username);
  }

  if (data.password !== undefined && data.password !== '***') {
    updates.push('encrypted_password = ?');
    values.push(encryptPassword(data.password));
  }

  if (data.tls !== undefined) {
    updates.push('tls = ?');
    values.push(data.tls ? 1 : 0);
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
    UPDATE email_accounts 
    SET ${updates.join(', ')}
    WHERE id = ?
  `);

  stmt.run(...values);
}

/**
 * Delete an email account
 */
export function deleteEmailAccount(id: string): void {
  const db = getDatabase();

  // Note: Sales with this account_id will have their account_id set to NULL
  // (no CASCADE DELETE on sales, to preserve historical data)
  db.prepare('UPDATE sales SET account_id = NULL WHERE account_id = ?').run(id);
  
  const stmt = db.prepare('DELETE FROM email_accounts WHERE id = ?');
  stmt.run(id);
}

/**
 * Toggle account active status
 */
export function toggleAccountActive(id: string): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE email_accounts 
    SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END
    WHERE id = ?
  `);
  stmt.run(id);
}

/**
 * Check if an account with the given username already exists
 */
export function accountExistsByUsername(username: string, excludeId?: string): boolean {
  const db = getDatabase();
  let stmt;
  let result;
  
  if (excludeId) {
    stmt = db.prepare('SELECT COUNT(*) as count FROM email_accounts WHERE username = ? AND id != ?');
    result = stmt.get(username, excludeId) as { count: number };
  } else {
    stmt = db.prepare('SELECT COUNT(*) as count FROM email_accounts WHERE username = ?');
    result = stmt.get(username) as { count: number };
  }
  
  return result.count > 0;
}

