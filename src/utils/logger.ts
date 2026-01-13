// Logger Utility - Production-safe logging with structured logging
// Fan Manager 2026 - Centralized Logging Service

const IS_DEV = __DEV__;

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Structured log entry
 */
interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  timestamp: string;
  component?: string;
}

/**
 * Logger class with structured logging
 */
class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  /**
   * Log with level
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>, component?: string): void {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      component,
    };

    // Add to memory logs
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Output to console based on level
    const prefix = this.getPrefix(level, component);
    const output = context ? [prefix, message, context] : [prefix, message];

    switch (level) {
      case LogLevel.DEBUG:
        if (IS_DEV) {
          console.debug(...output);
        }
        break;
      case LogLevel.INFO:
        if (IS_DEV) {
          console.info(...output);
        }
        break;
      case LogLevel.WARN:
        if (IS_DEV) {
          console.warn(...output);
        }
        break;
      case LogLevel.ERROR:
        // Always log errors, even in production
        console.error(...output);
        break;
    }
  }

  /**
   * Get log prefix with emoji
   */
  private getPrefix(level: LogLevel, component?: string): string {
    const emoji = {
      [LogLevel.DEBUG]: '🔍',
      [LogLevel.INFO]: 'ℹ️',
      [LogLevel.WARN]: '⚠️',
      [LogLevel.ERROR]: '🔴',
    }[level];

    const componentTag = component ? `[${component}]` : '';
    return `${emoji} ${componentTag}`;
  }

  /**
   * Debug log - Detailed information for debugging
   */
  debug(message: string, context?: Record<string, any>, component?: string): void {
    this.log(LogLevel.DEBUG, message, context, component);
  }

  /**
   * Info log - General information
   */
  info(message: string, context?: Record<string, any>, component?: string): void {
    this.log(LogLevel.INFO, message, context, component);
  }

  /**
   * Warn log - Warning messages
   */
  warn(message: string, context?: Record<string, any>, component?: string): void {
    this.log(LogLevel.WARN, message, context, component);
  }

  /**
   * Error log - Error messages (always logged)
   */
  error(message: string, context?: Record<string, any>, component?: string): void {
    this.log(LogLevel.ERROR, message, context, component);
  }

  /**
   * Legacy support - map log() to info()
   */
  log(...args: any[]): void {
    if (args.length === 0) return;
    
    const message = typeof args[0] === 'string' ? args[0] : JSON.stringify(args[0]);
    const context = args.length > 1 ? { data: args.slice(1) } : undefined;
    
    this.info(message, context);
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs by component
   */
  getLogsByComponent(component: string): LogEntry[] {
    return this.logs.filter(log => log.component === component);
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
}

// Create singleton instance
export const logger = new Logger();

// Performance monitoring
export const perfLogger = {
  start: (label: string) => {
    if (IS_DEV) {
      console.time(label);
    }
  },

  end: (label: string) => {
    if (IS_DEV) {
      console.timeEnd(label);
    }
  },
};

// Convenience functions for common patterns
export const logNavigation = (screen: string, params?: any) => {
  logger.info(`Navigating to: ${screen}`, params, 'NAVIGATION');
};

export const logApiCall = (endpoint: string, method: string = 'GET', params?: any) => {
  logger.debug(`API Call: ${method} ${endpoint}`, params, 'API');
};

export const logError = (error: Error | string, context?: Record<string, any>, component?: string) => {
  const message = typeof error === 'string' ? error : error.message;
  const errorContext = typeof error === 'string' ? context : { ...context, stack: error.stack };
  logger.error(message, errorContext, component);
};

export default logger;
