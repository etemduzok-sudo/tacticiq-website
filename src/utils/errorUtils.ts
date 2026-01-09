// Error Utilities
// Fan Manager 2026 - Advanced Error Handling

import { Alert } from 'react-native';
import { APP_VERSION } from '../config/AppVersion';

/**
 * Custom Error Classes
 */

export class NetworkError extends Error {
  constructor(message: string, public statusCode?: number, public endpoint?: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string, public value?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class BusinessLogicError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'BusinessLogicError';
  }
}

/**
 * Error Context Interface
 */
export interface ErrorContext {
  userId?: string;
  matchId?: string;
  predictionId?: string;
  endpoint?: string;
  action?: string;
  timestamp?: string;
  appVersion?: string;
  platform?: string;
  [key: string]: any;
}

/**
 * Structured Error Log
 */
export interface ErrorLog {
  id: string;
  timestamp: string;
  errorType: string;
  message: string;
  stack?: string;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userMessage: string;
  handled: boolean;
}

/**
 * Error Logger Class
 */
class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 200;
  private listeners: Array<(log: ErrorLog) => void> = [];

  /**
   * Log an error with full context
   */
  log(
    error: Error,
    context: ErrorContext = {},
    severity: ErrorLog['severity'] = 'medium'
  ): ErrorLog {
    const errorLog: ErrorLog = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      errorType: error.name,
      message: error.message,
      stack: error.stack,
      context: {
        ...context,
        appVersion: APP_VERSION.current,
        platform: this.getPlatform(),
      },
      severity,
      userMessage: this.getUserFriendlyMessage(error),
      handled: false,
    };

    this.addLog(errorLog);
    this.notifyListeners(errorLog);

    // Console log for development
    if (__DEV__) {
      console.error('🔴 Error Logged:', errorLog);
    }

    return errorLog;
  }

  /**
   * Add log to storage
   */
  private addLog(log: ErrorLog): void {
    this.logs.unshift(log);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }

  /**
   * Get user-friendly message
   */
  private getUserFriendlyMessage(error: Error): string {
    if (error instanceof NetworkError) {
      if (error.statusCode === 403) {
        return 'Erişim reddedildi. Lütfen giriş yapın.';
      }
      if (error.statusCode === 404) {
        return 'İstenen veri bulunamadı.';
      }
      if (error.statusCode === 500) {
        return 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
      }
      return 'İnternet bağlantısı kurulamadı.';
    }

    if (error instanceof ValidationError) {
      return `Geçersiz değer: ${error.message}`;
    }

    if (error instanceof AuthenticationError) {
      return 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.';
    }

    if (error instanceof BusinessLogicError) {
      return error.message; // Business errors are already user-friendly
    }

    return 'Bir hata oluştu. Lütfen tekrar deneyin.';
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get platform info
   */
  private getPlatform(): string {
    if (typeof navigator !== 'undefined') {
      return navigator.userAgent;
    }
    return 'unknown';
  }

  /**
   * Subscribe to error events
   */
  subscribe(listener: (log: ErrorLog) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(log: ErrorLog): void {
    this.listeners.forEach(listener => {
      try {
        listener(log);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });
  }

  /**
   * Get all logs
   */
  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  /**
   * Get logs by severity
   */
  getLogsBySeverity(severity: ErrorLog['severity']): ErrorLog[] {
    return this.logs.filter(log => log.severity === severity);
  }

  /**
   * Get logs by type
   */
  getLogsByType(errorType: string): ErrorLog[] {
    return this.logs.filter(log => log.errorType === errorType);
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Mark error as handled
   */
  markAsHandled(errorId: string): void {
    const log = this.logs.find(l => l.id === errorId);
    if (log) {
      log.handled = true;
    }
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

/**
 * Handle error with full context and user notification
 */
export function handleErrorWithContext(
  error: Error,
  context: ErrorContext = {},
  options: {
    showAlert?: boolean;
    severity?: ErrorLog['severity'];
    customMessage?: string;
  } = {}
): ErrorLog {
  const {
    showAlert = true,
    severity = 'medium',
    customMessage,
  } = options;

  // Log the error
  const errorLog = errorLogger.log(error, context, severity);

  // Show alert to user if needed
  if (showAlert && (severity === 'high' || severity === 'critical')) {
    const message = customMessage || errorLog.userMessage;
    
    Alert.alert(
      'Hata',
      message,
      [
        {
          text: 'Tamam',
          style: 'default',
        },
        ...(severity === 'critical' ? [{
          text: 'Detaylar',
          onPress: () => showErrorDetails(errorLog),
          style: 'cancel',
        }] : []),
      ]
    );
  }

  // Mark as handled
  errorLogger.markAsHandled(errorLog.id);

  return errorLog;
}

/**
 * Show error details
 */
function showErrorDetails(errorLog: ErrorLog): void {
  const details = `
Hata ID: ${errorLog.id}
Tip: ${errorLog.errorType}
Zaman: ${new Date(errorLog.timestamp).toLocaleString('tr-TR')}
Versiyon: ${errorLog.context.appVersion}

Mesaj: ${errorLog.message}

Context: ${JSON.stringify(errorLog.context, null, 2)}

${errorLog.stack ? `Stack: ${errorLog.stack}` : ''}
  `.trim();

  Alert.alert(
    'Hata Detayları',
    details,
    [
      {
        text: 'Kopyala',
        onPress: () => {
          // TODO: Copy to clipboard
          console.log('Error details copied');
        },
      },
      {
        text: 'Kapat',
        style: 'cancel',
      },
    ]
  );
}

/**
 * Retry wrapper with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);

      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Safe async wrapper
 * Catches errors and returns [error, data] tuple
 */
export async function safeAsync<T>(
  promise: Promise<T>
): Promise<[Error | null, T | null]> {
  try {
    const data = await promise;
    return [null, data];
  } catch (error) {
    return [error as Error, null];
  }
}

/**
 * Validate and throw if invalid
 */
export function validateOrThrow(
  condition: boolean,
  message: string,
  field?: string
): void {
  if (!condition) {
    throw new ValidationError(message, field);
  }
}

/**
 * Assert and throw if false
 */
export function assert(
  condition: boolean,
  message: string
): asserts condition {
  if (!condition) {
    throw new BusinessLogicError(message);
  }
}

/**
 * Wrap function with error boundary
 */
export function withErrorBoundary<T extends (...args: any[]) => any>(
  fn: T,
  context: ErrorContext = {}
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch(error => {
          handleErrorWithContext(error, context);
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      handleErrorWithContext(error as Error, context);
      throw error;
    }
  }) as T;
}

/**
 * Create error reporter for specific context
 */
export function createErrorReporter(baseContext: ErrorContext) {
  return {
    report: (error: Error, additionalContext: ErrorContext = {}) => {
      return handleErrorWithContext(error, {
        ...baseContext,
        ...additionalContext,
      });
    },
    
    reportAndThrow: (error: Error, additionalContext: ErrorContext = {}) => {
      handleErrorWithContext(error, {
        ...baseContext,
        ...additionalContext,
      });
      throw error;
    },
  };
}
