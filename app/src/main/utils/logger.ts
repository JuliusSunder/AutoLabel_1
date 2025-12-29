/**
 * Winston Logger Configuration
 * Provides structured logging with file rotation for the AutoLabel app
 */

import winston from 'winston';
import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

// Lazy initialization - logger will be created on first use
let logger: winston.Logger | null = null;
let LOG_DIR: string | null = null;

/**
 * Initialize logger (called lazily on first use)
 */
function initializeLogger(): void {
  if (logger !== null) {
    return; // Already initialized
  }

  try {
    // Get log directory - ensure app is ready
    if (!app.isReady()) {
      // Fallback to a temporary location if app is not ready yet
      LOG_DIR = path.join(process.env.APPDATA || process.env.HOME || process.cwd(), 'AutoLabel', 'logs');
      console.warn('[Logger] App not ready, using fallback log directory:', LOG_DIR);
    } else {
      LOG_DIR = path.join(app.getPath('userData'), 'logs');
    }

    // Ensure log directory exists
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }

    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    // Console format for development (more readable)
    const consoleFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
          msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
      })
    );

    // Determine log level based on environment
    const isDevelopment = !app.isPackaged;
    const logLevel = isDevelopment ? 'debug' : 'info';

    // Create the logger
    logger = winston.createLogger({
      level: logLevel,
      format: logFormat,
      transports: [
        // Error log file - only errors
        new winston.transports.File({
          filename: path.join(LOG_DIR, 'error.log'),
          level: 'error',
          maxsize: 5 * 1024 * 1024, // 5MB
          maxFiles: 5,
          tailable: true,
        }),
        // Combined log file - all logs
        new winston.transports.File({
          filename: path.join(LOG_DIR, 'combined.log'),
          maxsize: 5 * 1024 * 1024, // 5MB
          maxFiles: 5,
          tailable: true,
        }),
      ],
    });

    // Add console output only in development
    if (isDevelopment) {
      logger.add(
        new winston.transports.Console({
          format: consoleFormat,
        })
      );
    }

    console.log('[Logger] Logger initialized, log directory:', LOG_DIR);
  } catch (error) {
    console.error('[Logger] Failed to initialize logger:', error);
    // Create a fallback console logger
    logger = winston.createLogger({
      level: 'info',
      transports: [new winston.transports.Console()],
    });
  }
}

/**
 * Log an error with context
 */
export function logError(message: string, error: Error | unknown, context?: Record<string, any>): void {
  initializeLogger();
  if (!logger) return;

  const errorInfo: Record<string, any> = {
    message,
    ...context,
  };

  if (error instanceof Error) {
    errorInfo.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  } else {
    errorInfo.error = String(error);
  }

  logger.error(errorInfo);
}

/**
 * Log a warning with context
 */
export function logWarning(message: string, context?: Record<string, any>): void {
  initializeLogger();
  if (!logger) return;
  logger.warn({ message, ...context });
}

/**
 * Log info message with context
 */
export function logInfo(message: string, context?: Record<string, any>): void {
  initializeLogger();
  if (!logger) return;
  logger.info({ message, ...context });
}

/**
 * Log debug message with context (only in development)
 */
export function logDebug(message: string, context?: Record<string, any>): void {
  initializeLogger();
  if (!logger) return;
  logger.debug({ message, ...context });
}

/**
 * Sanitize sensitive data before logging
 * Removes passwords, tokens, and other sensitive information
 */
export function sanitizeForLog(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = { ...data };
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'accessToken', 'refreshToken'];

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeForLog(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Get the log directory path
 */
export function getLogDirectory(): string {
  initializeLogger();
  return LOG_DIR || path.join(app.getPath('userData'), 'logs');
}

/**
 * Get list of log files
 */
export function getLogFiles(): string[] {
  initializeLogger();
  if (!LOG_DIR) return [];
  
  try {
    const files = fs.readdirSync(LOG_DIR);
    return files.filter(file => file.endsWith('.log'));
  } catch (error) {
    console.error('[Logger] Failed to read log directory:', error);
    return [];
  }
}

/**
 * Clear old log files (keep only the most recent ones)
 */
export function clearOldLogs(): void {
  initializeLogger();
  if (!LOG_DIR) return;

  try {
    const files = fs.readdirSync(LOG_DIR);
    const logFiles = files
      .filter(file => file.endsWith('.log'))
      .map(file => ({
        name: file,
        path: path.join(LOG_DIR!, file),
        mtime: fs.statSync(path.join(LOG_DIR!, file)).mtime,
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    // Keep only the 10 most recent log files
    const filesToDelete = logFiles.slice(10);
    
    for (const file of filesToDelete) {
      fs.unlinkSync(file.path);
      logInfo('Deleted old log file', { filename: file.name });
    }
  } catch (error) {
    console.error('[Logger] Failed to clear old logs:', error);
  }
}

/**
 * Initialize logger explicitly (call this when app is ready)
 */
export function initializeLoggerExplicit(): void {
  initializeLogger();
}

export default logger;

