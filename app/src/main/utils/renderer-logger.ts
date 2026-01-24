/**
 * Renderer Logger
 * Forwards Main Process logs to Renderer Process (Browser Console)
 */

import { app, BrowserWindow } from 'electron';

let mainWindow: BrowserWindow | null = null;
const shouldForwardLogs = !app.isPackaged;

/**
 * Set the main window reference for sending logs
 */
export function setMainWindow(window: BrowserWindow | null): void {
  mainWindow = window;
}

/**
 * Send log to renderer process
 */
function sendToRenderer(level: 'log' | 'warn' | 'error', ...args: any[]): void {
  if (!shouldForwardLogs) {
    return;
  }

  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
    try {
      // Serialize arguments (handle circular references, functions, etc.)
      const serializedArgs = args.map(arg => {
        if (arg instanceof Error) {
          return {
            __type: 'Error',
            name: arg.name,
            message: arg.message,
            stack: arg.stack,
          };
        }
        if (typeof arg === 'function') {
          return { __type: 'Function', name: arg.name || 'anonymous' };
        }
        if (typeof arg === 'object' && arg !== null) {
          try {
            // Try to serialize, but catch circular references
            return JSON.parse(JSON.stringify(arg));
          } catch {
            return { __type: 'Object', stringified: String(arg) };
          }
        }
        return arg;
      });

      mainWindow.webContents.send('main-process-log', { level, args: serializedArgs });
    } catch (error) {
      // Silently fail if we can't send to renderer (e.g., window closed)
      // Don't log this to avoid infinite loops
    }
  }
}

/**
 * Enhanced console.log that also sends to renderer
 */
export function logToRenderer(...args: any[]): void {
  console.log(...args);
  sendToRenderer('log', ...args);
}

/**
 * Enhanced console.warn that also sends to renderer
 */
export function warnToRenderer(...args: any[]): void {
  console.warn(...args);
  sendToRenderer('warn', ...args);
}

/**
 * Enhanced console.error that also sends to renderer
 */
export function errorToRenderer(...args: any[]): void {
  console.error(...args);
  sendToRenderer('error', ...args);
}

