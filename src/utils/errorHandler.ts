// Global Error Handler - Centralized error handling

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed') {
    super(message, 'NETWORK_ERROR', 503);
  }
}

export class ApiError extends AppError {
  constructor(message: string, statusCode: number = 500) {
    super(message, 'API_ERROR', statusCode);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
  }
}

// Error logging service
class ErrorLogger {
  private static instance: ErrorLogger;
  
  private constructor() {}
  
  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }
  
  log(error: Error, context?: Record<string, any>): void {
    const errorInfo = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    };
    
    // Log to console in development
    if (__DEV__) {
      console.error('🔴 Error:', errorInfo);
    }
    
    // TODO: Send to error tracking service (Sentry, Bugsnag, etc.)
    // this.sendToErrorTrackingService(errorInfo);
  }
  
  logNetwork(error: NetworkError, endpoint: string): void {
    this.log(error, { type: 'network', endpoint });
  }
  
  logApi(error: ApiError, endpoint: string, response?: any): void {
    this.log(error, { type: 'api', endpoint, response });
  }
}

export const errorLogger = ErrorLogger.getInstance();

// Error handler for async functions
export function handleAsyncError<T>(
  promise: Promise<T>,
  errorMessage?: string
): Promise<[Error | null, T | null]> {
  return promise
    .then((data) => [null, data] as [null, T])
    .catch((error) => {
      const err = error instanceof AppError 
        ? error 
        : new AppError(errorMessage || error.message, 'UNKNOWN_ERROR');
      
      errorLogger.log(err);
      return [err, null] as [Error, null];
    });
}

// User-friendly error messages
export function getUserFriendlyMessage(error: Error): string {
  if (error instanceof NetworkError) {
    return 'İnternet bağlantınızı kontrol edin';
  }
  
  if (error instanceof AuthenticationError) {
    return 'Oturum süreniz doldu. Lütfen tekrar giriş yapın';
  }
  
  if (error instanceof ValidationError) {
    return error.message;
  }
  
  if (error instanceof ApiError) {
    if (error.statusCode === 404) {
      return 'İstenen veri bulunamadı';
    }
    if (error.statusCode === 429) {
      return 'Çok fazla istek gönderildi. Lütfen bekleyin';
    }
    return 'Bir hata oluştu. Lütfen tekrar deneyin';
  }
  
  return 'Beklenmeyen bir hata oluştu';
}
