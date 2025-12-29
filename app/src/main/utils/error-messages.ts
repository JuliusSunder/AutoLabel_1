/**
 * User-Friendly Error Messages
 * Translates technical errors into German user-friendly messages
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
  UNKNOWN = 'UNKNOWN',
}

/**
 * Error message templates in German
 */
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.EMAIL_CONNECTION]: 'Verbindung zum E-Mail-Server konnte nicht hergestellt werden. Bitte überprüfen Sie Ihre Internetverbindung und die Server-Einstellungen.',
  [ErrorType.EMAIL_AUTH]: 'E-Mail-Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre E-Mail-Adresse und Ihr Passwort.',
  [ErrorType.EMAIL_TIMEOUT]: 'Die Verbindung zum E-Mail-Server hat zu lange gedauert. Bitte versuchen Sie es später erneut.',
  [ErrorType.FILE_NOT_FOUND]: 'Die angeforderte Datei wurde nicht gefunden.',
  [ErrorType.FILE_READ]: 'Die Datei konnte nicht gelesen werden. Möglicherweise ist sie beschädigt oder wird von einem anderen Programm verwendet.',
  [ErrorType.FILE_WRITE]: 'Die Datei konnte nicht gespeichert werden. Bitte überprüfen Sie die Schreibrechte und den verfügbaren Speicherplatz.',
  [ErrorType.PRINTER_NOT_FOUND]: 'Der ausgewählte Drucker wurde nicht gefunden. Bitte überprüfen Sie, ob der Drucker eingeschaltet und mit dem Computer verbunden ist.',
  [ErrorType.PRINTER_ERROR]: 'Beim Drucken ist ein Fehler aufgetreten. Bitte überprüfen Sie den Drucker und versuchen Sie es erneut.',
  [ErrorType.DATABASE_ERROR]: 'Ein Datenbankfehler ist aufgetreten. Bitte starten Sie die Anwendung neu.',
  [ErrorType.NETWORK_ERROR]: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.',
  [ErrorType.INVALID_PDF]: 'Die PDF-Datei ist ungültig oder beschädigt.',
  [ErrorType.INVALID_CONFIG]: 'Die Konfiguration ist ungültig. Bitte überprüfen Sie Ihre Einstellungen.',
  [ErrorType.PERMISSION_DENIED]: 'Zugriff verweigert. Bitte überprüfen Sie die Berechtigungen.',
  [ErrorType.UNKNOWN]: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
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
 * Get user-friendly error message from error object
 */
export function getUserFriendlyError(error: Error | unknown, customMessage?: string): string {
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

  return recoverableTypes.includes(errorType);
}

/**
 * Get suggested action for error
 */
export function getSuggestedAction(error: Error | unknown): string {
  const errorType = detectErrorType(error);

  const suggestions: Record<ErrorType, string> = {
    [ErrorType.EMAIL_CONNECTION]: 'Überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.',
    [ErrorType.EMAIL_AUTH]: 'Gehen Sie zu den Einstellungen und überprüfen Sie Ihre E-Mail-Zugangsdaten.',
    [ErrorType.EMAIL_TIMEOUT]: 'Warten Sie einen Moment und versuchen Sie es dann erneut.',
    [ErrorType.FILE_NOT_FOUND]: 'Stellen Sie sicher, dass die Datei noch existiert.',
    [ErrorType.FILE_READ]: 'Schließen Sie andere Programme, die diese Datei verwenden könnten.',
    [ErrorType.FILE_WRITE]: 'Überprüfen Sie den verfügbaren Speicherplatz auf Ihrer Festplatte.',
    [ErrorType.PRINTER_NOT_FOUND]: 'Überprüfen Sie, ob der Drucker eingeschaltet und verbunden ist.',
    [ErrorType.PRINTER_ERROR]: 'Überprüfen Sie den Drucker-Status und versuchen Sie es erneut.',
    [ErrorType.DATABASE_ERROR]: 'Starten Sie die Anwendung neu. Wenn das Problem weiterhin besteht, kontaktieren Sie den Support.',
    [ErrorType.NETWORK_ERROR]: 'Überprüfen Sie Ihre Internetverbindung.',
    [ErrorType.INVALID_PDF]: 'Versuchen Sie, das Label erneut zu generieren.',
    [ErrorType.INVALID_CONFIG]: 'Überprüfen Sie Ihre Einstellungen in den Einstellungen.',
    [ErrorType.PERMISSION_DENIED]: 'Starten Sie die Anwendung mit Administratorrechten.',
    [ErrorType.UNKNOWN]: 'Versuchen Sie es erneut. Wenn das Problem weiterhin besteht, kontaktieren Sie den Support.',
  };

  return suggestions[errorType];
}

