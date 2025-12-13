/**
 * Logger service for client-side logging
 * Provides standardized logging with severity levels and optional metadata
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogMetadata = Record<string, any>;

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: LogMetadata;
  componentName?: string;
  userId?: string | number;
  sessionId?: string;
}

// Configure log levels - only levels >= this level will be logged
const CURRENT_LOG_LEVEL: LogLevel = 
  (typeof import.meta.env !== 'undefined' && import.meta.env.DEV) ? 'debug' : 'info';

// Map log levels to numeric values for comparison
const LOG_LEVEL_SEVERITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Maximum number of logs to keep in memory
const MAX_MEMORY_LOGS = 100;

class Logger {
  private logs: LogEntry[] = [];
  private sessionId: string;
  
  constructor() {
    this.sessionId = this.generateSessionId();
    
    // Capture unhandled errors and log them
    window.addEventListener('error', this.handleGlobalError.bind(this));
    window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    
    this.info('Logger initialized', { sessionId: this.sessionId });
  }
  
  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  /**
   * Handle global unhandled errors
   */
  private handleGlobalError(event: ErrorEvent): void {
    this.error(`Unhandled error: ${event.message}`, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    });
  }
  
  /**
   * Handle unhandled promise rejections
   */
  private handlePromiseRejection(event: PromiseRejectionEvent): void {
    const reason = event.reason?.message || event.reason || 'Unknown reason';
    this.error(`Unhandled promise rejection: ${reason}`, {
      stack: event.reason?.stack
    });
  }
  
  /**
   * Log a message if the log level is sufficient
   */
  private log(level: LogLevel, message: string, metadata?: LogMetadata, componentName?: string): void {
    // Skip logging if the current level is not high enough
    if (LOG_LEVEL_SEVERITY[level] < LOG_LEVEL_SEVERITY[CURRENT_LOG_LEVEL]) {
      return;
    }
    
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      componentName,
      sessionId: this.sessionId,
      userId: this.getUserId()
    };
    
    // Add to memory logs with limit
    this.logs.push(logEntry);
    if (this.logs.length > MAX_MEMORY_LOGS) {
      this.logs.shift(); // Remove oldest log
    }
    
    // Format console output differently based on log level
    const consoleMethod = level === 'debug' ? 'log' : level;
    
    if (metadata) {
      console[consoleMethod](
        `[${new Date().toLocaleTimeString()}] [${level.toUpperCase()}]${componentName ? ` [${componentName}]` : ''}: ${message}`, 
        metadata
      );
    } else {
      console[consoleMethod](
        `[${new Date().toLocaleTimeString()}] [${level.toUpperCase()}]${componentName ? ` [${componentName}]` : ''}: ${message}`
      );
    }
    
    // For production, send errors to server for monitoring
    if (level === 'error' && !(typeof import.meta.env !== 'undefined' && import.meta.env.DEV)) {
      this.sendErrorToServer(logEntry);
    }
  }
  
  /**
   * Get user ID from local storage or session
   */
  private getUserId(): string | number | undefined {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id;
      }
    } catch (e) {
      // Ignore errors
    }
    return undefined;
  }
  
  /**
   * Send error logs to server (only in production)
   */
  private async sendErrorToServer(logEntry: LogEntry): Promise<void> {
    try {
      await fetch('/api/logs/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry),
        credentials: 'include'
      });
    } catch (e) {
      // Use console directly to avoid recursive logging
      console.error('Failed to send log to server:', e);
    }
  }
  
  /**
   * Debug level messages (development details)
   */
  debug(message: string, metadata?: LogMetadata, componentName?: string): void {
    this.log('debug', message, metadata, componentName);
  }
  
  /**
   * Info level messages (normal operational info)
   */
  info(message: string, metadata?: LogMetadata, componentName?: string): void {
    this.log('info', message, metadata, componentName);
  }
  
  /**
   * Warning level messages (potential issues)
   */
  warn(message: string, metadata?: LogMetadata, componentName?: string): void {
    this.log('warn', message, metadata, componentName);
  }
  
  /**
   * Error level messages (application errors)
   */
  error(message: string, metadata?: LogMetadata, componentName?: string): void {
    this.log('error', message, metadata, componentName);
  }
  
  /**
   * Log a component mount event
   */
  logMount(componentName: string, props?: Record<string, any>): void {
    this.debug(`Component mounted: ${componentName}`, props, componentName);
  }
  
  /**
   * Log a component unmount event
   */
  logUnmount(componentName: string): void {
    this.debug(`Component unmounted: ${componentName}`, undefined, componentName);
  }
  
  /**
   * Log an API request
   */
  logApiRequest(endpoint: string, method: string, params?: any): void {
    this.debug(`API Request: ${method} ${endpoint}`, params, 'API');
  }
  
  /**
   * Log an API response
   */
  logApiResponse(endpoint: string, method: string, status: number, data?: any): void {
    this.debug(`API Response: ${method} ${endpoint} (${status})`, data, 'API');
  }
  
  /**
   * Log an API error with enhanced details for production debugging
   */
  logApiError(endpoint: string, method: string, error: any, requestData?: any): void {
    // Determine if error is an ApiError instance
    const isApiError = error && error.name === 'ApiError';
    
    // Create structured metadata for better error analysis
    const metadata: LogMetadata = {
      endpoint,
      method,
      statusCode: isApiError ? error.status : undefined,
      errorCode: isApiError ? error.code : undefined,
      validationErrors: isApiError ? error.errors : undefined,
      // Sanitize request data to remove sensitive information
      requestData: requestData ? this.sanitizeRequestData(requestData) : undefined,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    
    // Create a detailed message for logging
    const message = isApiError 
      ? `API Error: ${method} ${endpoint} (${error.status}): ${error.message}` 
      : `API Error: ${method} ${endpoint}: ${error.message || 'Unknown error occurred'}`;
    
    this.error(message, metadata, 'API');
    
    // If in development, also log to console in a more readable format
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      console.group('%c' + message, 'color: #ff0000; font-weight: bold;');
      console.log('Error details:', metadata);
      console.log('Original error:', error);
      console.groupEnd();
    }
  }
  
  /**
   * Sanitize request data to avoid logging sensitive information
   * @private
   */
  private sanitizeRequestData(data: any): any {
    if (!data) return data;
    
    // Create a copy to avoid modifying the original
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // List of fields to redact
    const sensitiveFields = ['password', 'token', 'authToken', 'secret', 'apiKey', 'credit_card', 'ssn'];
    
    // Recursively scrub sensitive data
    const scrubObject = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.keys(obj).forEach(key => {
        // Check if this key should be redacted
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          // Recurse into nested objects
          scrubObject(obj[key]);
        }
      });
    };
    
    scrubObject(sanitized);
    return sanitized;
  }
  
  /**
   * Log a user action
   */
  logUserAction(action: string, details?: Record<string, any>): void {
    this.info(`User Action: ${action}`, details, 'UserAction');
  }
  
  /**
   * Get all logs from memory
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }
  
  /**
   * Clear memory logs
   */
  clearLogs(): void {
    this.logs = [];
    this.info('Logs cleared');
  }
}

// Create a singleton instance
const logger = new Logger();

export default logger;