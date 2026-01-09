// Global Error Handler
// Fan Manager 2026 - Centralized Error Management

import { Alert } from 'react-native';
import { APP_VERSION } from '../config/AppVersion';
import { TEXT } from '../config/constants';

/**
 * Error Types
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Error Severity
 */
export enum ErrorSeverity {
  LOW = 'LOW',       // Log only
  MEDIUM = 'MEDIUM', // Log + toast
  HIGH = 'HIGH',     // Log + alert
  CRITICAL = 'CRITICAL', // Log + alert + report
}

/**
 * Error Log Entry
 */
interface ErrorLog {
  timestamp: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  context?: Record<string, any>;
  appVersion: string;
  buildNumber: number;
}

/**
 * Global Error Handler Class
 */
class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private errorLogs: ErrorLog[] = [];
  private maxLogs = 100;

  private constructor() {
    this.setupGlobalHandlers();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalHandlers(): void {
    // Handle unhandled promise rejections
    if (typeof global !== 'undefined') {
      const originalHandler = global.Promise?.prototype?.catch;
      if (originalHandler) {
        global.Promise.prototype.catch = function (onRejected) {
          return originalHandler.call(this, (error: any) => {
            GlobalErrorHandler.getInstance().handleError(error, {
              type: ErrorType.UNKNOWN,
              severity: ErrorSeverity.MEDIUM,
            });
            if (onRejected) {
              return onRejected(error);
            }
            throw error;
          });
        };
      }
    }
  }

  /**
   * Handle error
   */
  handleError(
    error: Error | string,
    options: {
      type?: ErrorType;
      severity?: ErrorSeverity;
      context?: Record<string, any>;
      showAlert?: boolean;
    } = {}
  ): void {
    const {
      type = ErrorType.UNKNOWN,
      severity = ErrorSeverity.MEDIUM,
      context = {},
      showAlert = true,
    } = options;

    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;

    // Create log entry
    const logEntry: ErrorLog = {
      timestamp: new Date().toISOString(),
      type,
      severity,
      message: errorMessage,
      stack: errorStack,
      context,
      appVersion: APP_VERSION.current,
      buildNumber: APP_VERSION.buildNumber,
    };

    // Add to logs
    this.addLog(logEntry);

    // Log to console
    this.logToConsole(logEntry);

    // Show user feedback based on severity
    if (showAlert) {
      this.showUserFeedback(logEntry);
    }

    // Report critical errors
    if (severity === ErrorSeverity.CRITICAL) {
      this.reportError(logEntry);
    }
  }

  /**
   * Add log entry
   */
  private addLog(log: ErrorLog): void {
    this.errorLogs.unshift(log);
    
    // Keep only last N logs
    if (this.errorLogs.length > this.maxLogs) {
      this.errorLogs = this.errorLogs.slice(0, this.maxLogs);
    }
  }

  /**
   * Log to console
   */
  private logToConsole(log: ErrorLog): void {
    const emoji = this.getSeverityEmoji(log.severity);
    console.error(`${emoji} [${log.type}] ${log.message}`);
    
    if (log.stack) {
      console.error('Stack:', log.stack);
    }
    
    if (Object.keys(log.context || {}).length > 0) {
      console.error('Context:', log.context);
    }
  }

  /**
   * Show user feedback
   */
  private showUserFeedback(log: ErrorLog): void {
    const message = this.getUserFriendlyMessage(log);
    
    if (log.severity === ErrorSeverity.HIGH || log.severity === ErrorSeverity.CRITICAL) {
      Alert.alert(
        'Hata',
        message,
        [
          {
            text: 'Tamam',
            style: 'default',
          },
          {
            text: 'Detaylar',
            onPress: () => this.showErrorDetails(log),
            style: 'cancel',
          },
        ]
      );
    }
  }

  /**
   * Get user-friendly message
   */
  private getUserFriendlyMessage(log: ErrorLog): string {
    switch (log.type) {
      case ErrorType.NETWORK:
        return TEXT.ERRORS.NETWORK;
      case ErrorType.API:
        return TEXT.ERRORS.API;
      case ErrorType.AUTH:
        return TEXT.ERRORS.AUTH;
      case ErrorType.VALIDATION:
        return TEXT.ERRORS.VALIDATION;
      default:
        return TEXT.ERRORS.UNKNOWN;
    }
  }

  /**
   * Show error details
   */
  private showErrorDetails(log: ErrorLog): void {
    const details = `
Hata Tipi: ${log.type}
Zaman: ${new Date(log.timestamp).toLocaleString('tr-TR')}
Versiyon: ${log.appVersion} (${log.buildNumber})

Mesaj: ${log.message}

${log.stack ? `Stack: ${log.stack}` : ''}
    `.trim();

    Alert.alert('Hata Detayları', details, [
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
    ]);
  }

  /**
   * Report error to backend
   */
  private async reportError(log: ErrorLog): Promise<void> {
    try {
      // TODO: Send to error reporting service (Sentry, etc.)
      console.log('📤 Reporting error to backend:', log);
      
      // Example: await api.errors.report(log);
    } catch (err) {
      console.error('Failed to report error:', err);
    }
  }

  /**
   * Get severity emoji
   */
  private getSeverityEmoji(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.LOW:
        return '💡';
      case ErrorSeverity.MEDIUM:
        return '⚠️';
      case ErrorSeverity.HIGH:
        return '🚨';
      case ErrorSeverity.CRITICAL:
        return '💥';
      default:
        return '❓';
    }
  }

  /**
   * Get all logs
   */
  getLogs(): ErrorLog[] {
    return [...this.errorLogs];
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.errorLogs = [];
  }

  /**
   * Get logs by type
   */
  getLogsByType(type: ErrorType): ErrorLog[] {
    return this.errorLogs.filter(log => log.type === type);
  }

  /**
   * Get logs by severity
   */
  getLogsBySeverity(severity: ErrorSeverity): ErrorLog[] {
    return this.errorLogs.filter(log => log.severity === severity);
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.errorLogs, null, 2);
  }
}

// Export singleton instance
export const errorHandler = GlobalErrorHandler.getInstance();

// Export convenience functions
export function handleError(
  error: Error | string,
  options?: Parameters<typeof errorHandler.handleError>[1]
): void {
  errorHandler.handleError(error, options);
}

export function handleNetworkError(error: Error | string, context?: Record<string, any>): void {
  errorHandler.handleError(error, {
    type: ErrorType.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    context,
  });
}

export function handleApiError(error: Error | string, context?: Record<string, any>): void {
  errorHandler.handleError(error, {
    type: ErrorType.API,
    severity: ErrorSeverity.MEDIUM,
    context,
  });
}

export function handleAuthError(error: Error | string, context?: Record<string, any>): void {
  errorHandler.handleError(error, {
    type: ErrorType.AUTH,
    severity: ErrorSeverity.HIGH,
    context,
  });
}

export function handleValidationError(error: Error | string, context?: Record<string, any>): void {
  errorHandler.handleError(error, {
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.LOW,
    context,
    showAlert: false,
  });
}

export function handleCriticalError(error: Error | string, context?: Record<string, any>): void {
  errorHandler.handleError(error, {
    type: ErrorType.UNKNOWN,
    severity: ErrorSeverity.CRITICAL,
    context,
  });
}

export default errorHandler;
