/**
 * Database connection and initialization
 * Provides singleton access to SQLite database
 */

import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'node:path';
import { runMigrations } from './schema';

let db: Database.Database | null = null;

/**
 * Get or create database connection
 */
export function getDatabase(): Database.Database {
  if (db) {
    return db;
  }

  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'autolabel.db');

  console.log(`[Database] Initializing database at: ${dbPath}`);

  db = new Database(dbPath);

  // Enable WAL mode for better concurrent access
  db.pragma('journal_mode = WAL');

  // Run migrations to ensure schema is up to date
  runMigrations(db);

  console.log('[Database] Database initialized successfully');

  return db;
}

/**
 * Close database connection (call on app quit)
 */
export function closeDatabase(): void {
  if (db) {
    console.log('[Database] Closing database connection');
    db.close();
    db = null;
  }
}

/**
 * Generate a unique ID for database records
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
