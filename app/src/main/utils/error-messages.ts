/**
 * User-Friendly Error Messages
 * Translates technical errors into user-friendly messages
 */

/**
 * Error types that can occur in the application
 */
export enum ErrorType {
  EMAIL_CONNECTION = 'EMAIL_CONNECTION',
  EMAIL_AUTH = 'EMAIL_AUTH',
  EMAIL_TIMEOUT = 'EMAIL_TIMEOUT',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_READ = 'FILE_READ',
  FILE_WRITE = 'FILE_WRITE',
  PRINTER_NOT_FOUND = 'PRINTER_NOT_FOUND',
  PRINTER_ERROR = 'PRINTER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_PDF = 'INVALID_PDF',
  INVALID_CONFIG = 'INVALID_CONFIG',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  USAGE_LIMIT_EXCEEDED = 'USAGE_LIMIT_EXCEEDED',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Error message templates
 */
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.EMAIL_CONNECTION]: 'Could not connect to email server. Please check your internet connection and server settings.',
  [ErrorType.EMAIL_AUTH]: 'Email authentication failed. Please check your email address and password.',
  [ErrorType.EMAIL_TIMEOUT]: 'Connection to email server timed out. Please try again later.',
  [ErrorType.FILE_NOT_FOUND]: 'The requested file was not found.',
  [ErrorType.FILE_READ]: 'Could not read the file. It may be corrupted or in use by another program.',
  [ErrorType.FILE_WRITE]: 'Could not save the file. Please check write permissions and available disk space.',
  [ErrorType.PRINTER_NOT_FOUND]: 'The selected printer was not found. Please check if the printer is turned on and connected to the computer.',
  [ErrorType.PRINTER_ERROR]: 'An error occurred while printing. Please check the printer and try again.',
  [ErrorType.DATABASE_ERROR]: 'A database error occurred. Please restart the application.',
  [ErrorType.NETWORK_ERROR]: 'Network error. Please check your internet connection.',
  [ErrorType.INVALID_PDF]: 'The PDF file is invalid or corrupted.',
  [ErrorType.INVALID_CONFIG]: 'The configuration is invalid. Please check your settings.',
  [ErrorType.PERMISSION_DENIED]: 'Access denied. Please check permissions.',
  [ErrorType.USAGE_LIMIT_EXCEEDED]: 'Monthly limit reached. Please upgrade your plan for more labels.',
  [ErrorType.UNKNOWN]: 'An unexpected error occurred. Please try again.',
};

/**
 * Detect error type from error object or message
 */
function detectErrorType(error: Error | unknown): ErrorType {
  if (!(error instanceof Error)) {
    return ErrorType.UNKNOWN;
  }

  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // Usage limit errors - check first as they have specific messages
  if (
    message.includes('monthly limit') ||
    message.includes('limit reached') ||
    message.includes('labels used') ||
    message.includes('upgrade') ||
    message.includes('monatslimit') ||
    message.includes('limit erreicht')
  ) {
    return ErrorType.USAGE_LIMIT_EXCEEDED;
  }

  // Email-related errors
  if (message.includes('econnrefused') || message.includes('enotfound') || message.includes('etimedout')) {
    if (message.includes('timeout')) {
      return ErrorType.EMAIL_TIMEOUT;
    }
    return ErrorType.EMAIL_CONNECTION;
  }

  if (
    message.includes('auth') ||
    message.includes('authentication') ||
    message.includes('login') ||
    message.includes('invalid credentials') ||
    message.includes('bad credentials')
  ) {
    return ErrorType.EMAIL_AUTH;
  }

  // File-related errors
  if (message.includes('enoent') || message.includes('file not found') || message.includes('no such file')) {
    return ErrorType.FILE_NOT_FOUND;
  }

  if (message.includes('eacces') || message.includes('permission denied') || message.includes('eperm')) {
    return ErrorType.PERMISSION_DENIED;
  }

  if (message.includes('cannot read') || message.includes('failed to read')) {
    return ErrorType.FILE_READ;
  }

  if (message.includes('cannot write') || message.includes('failed to write') || message.includes('enospc')) {
    return ErrorType.FILE_WRITE;
  }

  // Printer-related errors
  if (message.includes('printer not found') || message.includes('no printer')) {
    return ErrorType.PRINTER_NOT_FOUND;
  }

  if (message.includes('print') && (message.includes('failed') || message.includes('error'))) {
    return ErrorType.PRINTER_ERROR;
  }

  // Database errors
  if (
    message.includes('database') ||
    message.includes('sqlite') ||
    name.includes('sqlite') ||
    message.includes('constraint')
  ) {
    return ErrorType.DATABASE_ERROR;
  }

  // Network errors
  if (
    message.includes('network') ||
    message.includes('fetch failed') ||
    message.includes('econnreset') ||
    message.includes('socket')
  ) {
    return ErrorType.NETWORK_ERROR;
  }

  // PDF errors
  if (message.includes('pdf') && (message.includes('invalid') || message.includes('corrupt'))) {
    return ErrorType.INVALID_PDF;
  }

  // Config errors
  if (message.includes('config') || message.includes('invalid settings')) {
    return ErrorType.INVALID_CONFIG;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Check if error message is already user-friendly
 * User-friendly messages typically contain specific information like usage counts
 */
function isUserFriendlyMessage(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  // Usage limit messages with specific counts are already user-friendly
  if ((lowerMessage.includes('monthly limit') || lowerMessage.includes('monatslimit')) && 
      (lowerMessage.includes('of') || lowerMessage.includes('von'))) {
    return true;
  }
  
  return false;
}

/**
 * Get user-friendly error message from error object
 */
export function getUserFriendlyError(error: Error | unknown, customMessage?: string): string {
  // Check if the error message is already user-friendly
  if (error instanceof Error && isUserFriendlyMessage(error.message)) {
    return error.message;
  }

  const errorType = detectErrorType(error);
  const baseMessage = ERROR_MESSAGES[errorType];

  if (customMessage) {
    return `${baseMessage}\n\nDetails: ${customMessage}`;
  }

  return baseMessage;
}

/**
 * Get user-friendly error message by error type
 */
export function getErrorMessage(errorType: ErrorType): string {
  return ERROR_MESSAGES[errorType];
}

/**
 * Create a user-friendly error object
 */
export interface UserFriendlyError {
  message: string;
  type: ErrorType;
  technical?: string;
}

/**
 * Convert error to user-friendly error object
 */
export function toUserFriendlyError(error: Error | unknown, context?: string): UserFriendlyError {
  const errorType = detectErrorType(error);
  const technicalMessage = error instanceof Error ? error.message : String(error);

  return {
    message: getUserFriendlyError(error, context),
    type: errorType,
    technical: technicalMessage,
  };
}

/**
 * Check if error is recoverable (user can retry)
 */
export function isRecoverableError(error: Error | unknown): boolean {
  const errorType = detectErrorType(error);

  // These errors are typically recoverable
  const recoverableTypes = [
    ErrorType.EMAIL_CONNECTION,
    ErrorType.EMAIL_TIMEOUT,
    ErrorType.NETWORK_ERROR,
    ErrorType.PRINTER_ERROR,
  ];

  // Usage limit errors are not recoverable by retry - user needs to upgrade
  if (errorType === ErrorType.USAGE_LIMIT_EXCEEDED) {
    return false;
  }

  return recoverableTypes.includes(errorType);
}

/**
 * Get suggested action for error
 */
export function getSuggestedAction(error: Error | unknown): string {
  const errorType = detectErrorType(error);

  const suggestions: Record<ErrorType, string> = {
    [ErrorType.EMAIL_CONNECTION]: 'Check your internet connection and try again.',
    [ErrorType.EMAIL_AUTH]: 'Go to Settings and verify your email credentials.',
    [ErrorType.EMAIL_TIMEOUT]: 'Wait a moment and try again.',
    [ErrorType.FILE_NOT_FOUND]: 'Make sure the file still exists.',
    [ErrorType.FILE_READ]: 'Close other programs that might be using this file.',
    [ErrorType.FILE_WRITE]: 'Check available disk space on your hard drive.',
    [ErrorType.PRINTER_NOT_FOUND]: 'Check if the printer is turned on and connected.',
    [ErrorType.PRINTER_ERROR]: 'Check printer status and try again.',
    [ErrorType.DATABASE_ERROR]: 'Restart the application. If the problem persists, contact support.',
    [ErrorType.NETWORK_ERROR]: 'Check your internet connection.',
    [ErrorType.INVALID_PDF]: 'Try to regenerate the label.',
    [ErrorType.INVALID_CONFIG]: 'Check your settings in the Settings menu.',
    [ErrorType.PERMISSION_DENIED]: 'Run the application with administrator rights.',
    [ErrorType.USAGE_LIMIT_EXCEEDED]: 'Upgrade your plan to Plus or Pro for more labels per month.',
    [ErrorType.UNKNOWN]: 'Try again. If the problem persists, contact support.',
  };

  return suggestions[errorType];
}

