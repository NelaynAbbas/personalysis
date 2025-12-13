/**
 * Enhanced logger implementation for PersonalysisPro
 * Provides module-specific logging with different log levels and formatting
 * This implementation extends the built-in console with additional features
 */

// Log levels for different types of messages
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

// Color codes for terminal output
const COLOR = {
  RESET: '\x1b[0m',
  BRIGHT: '\x1b[1m',
  DIM: '\x1b[2m',
  
  // Foreground colors
  FG_BLACK: '\x1b[30m',
  FG_RED: '\x1b[31m',
  FG_GREEN: '\x1b[32m',
  FG_YELLOW: '\x1b[33m',
  FG_BLUE: '\x1b[34m',
  FG_MAGENTA: '\x1b[35m',
  FG_CYAN: '\x1b[36m',
  FG_WHITE: '\x1b[37m',
  
  // Background colors
  BG_BLACK: '\x1b[40m',
  BG_RED: '\x1b[41m',
  BG_GREEN: '\x1b[42m',
  BG_YELLOW: '\x1b[43m',
  BG_BLUE: '\x1b[44m',
  BG_MAGENTA: '\x1b[45m',
  BG_CYAN: '\x1b[46m',
  BG_WHITE: '\x1b[47m'
};

// Configuration for the logger
export interface LoggerConfig {
  level: LogLevel;
  useColors: boolean;
  showTimestamp: boolean;
  showModule: boolean;
}

// Default configuration
const DEFAULT_CONFIG: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  useColors: true,
  showTimestamp: true,
  showModule: true
};

/**
 * Enhanced logger class that provides module-specific logging
 * with different log levels and formatting options
 */
export class Logger {
  private readonly module: string;
  private config: LoggerConfig;
  
  /**
   * Create a new logger instance for a specific module
   * @param module The module name to include in log messages
   * @param config Optional configuration overrides
   */
  constructor(module: string, config?: Partial<LoggerConfig>) {
    this.module = module;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Format a log message with timestamp, module name, and level
   * @param level The log level for this message
   * @param message The log message
   * @returns Formatted log message
   */
  private format(level: LogLevel, message: string): string {
    const parts: string[] = [];
    
    if (this.config.showTimestamp) {
      const timestamp = new Date().toISOString();
      parts.push(`[${timestamp}]`);
    }
    
    if (this.config.showModule) {
      parts.push(`[${this.module}]`);
    }
    
    parts.push(`[${level}]`);
    parts.push(message);
    
    return parts.join(' ');
  }
  
  /**
   * Get color for a specific log level
   * @param level The log level
   * @returns ANSI color code
   */
  private getColorForLevel(level: LogLevel): string {
    if (!this.config.useColors) return '';
    
    switch (level) {
      case LogLevel.DEBUG:
        return COLOR.FG_CYAN;
      case LogLevel.INFO:
        return COLOR.FG_GREEN;
      case LogLevel.WARN:
        return COLOR.FG_YELLOW;
      case LogLevel.ERROR:
        return COLOR.FG_RED;
      case LogLevel.CRITICAL:
        return `${COLOR.BRIGHT}${COLOR.FG_RED}`;
      default:
        return '';
    }
  }
  
  /**
   * Should this level be logged based on the current configuration
   * @param level The log level to check
   * @returns Boolean indicating if this level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.CRITICAL];
    const currentIdx = levels.indexOf(this.config.level);
    const logIdx = levels.indexOf(level);
    
    return logIdx >= currentIdx;
  }
  
  /**
   * Log a debug message
   * @param message The message to log
   * @param meta Optional metadata to include with the log
   */
  debug(message: string, meta?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const color = this.getColorForLevel(LogLevel.DEBUG);
    const reset = this.config.useColors ? COLOR.RESET : '';
    
    console.debug(`${color}${this.format(LogLevel.DEBUG, message)}${reset}`, meta !== undefined ? meta : '');
  }
  
  /**
   * Log an info message
   * @param message The message to log
   * @param meta Optional metadata to include with the log
   */
  info(message: string, meta?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const color = this.getColorForLevel(LogLevel.INFO);
    const reset = this.config.useColors ? COLOR.RESET : '';
    
    console.info(`${color}${this.format(LogLevel.INFO, message)}${reset}`, meta !== undefined ? meta : '');
  }
  
  /**
   * Log a warning message
   * @param message The message to log
   * @param meta Optional metadata to include with the log
   */
  warn(message: string, meta?: any): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const color = this.getColorForLevel(LogLevel.WARN);
    const reset = this.config.useColors ? COLOR.RESET : '';
    
    console.warn(`${color}${this.format(LogLevel.WARN, message)}${reset}`, meta !== undefined ? meta : '');
  }
  
  /**
   * Log an error message
   * @param message The error message
   * @param error Optional error object to include details from
   * @param meta Optional additional metadata
   */
  error(message: string, error?: any, meta?: any): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const color = this.getColorForLevel(LogLevel.ERROR);
    const reset = this.config.useColors ? COLOR.RESET : '';
    
    console.error(`${color}${this.format(LogLevel.ERROR, message)}${reset}`);
    
    // Log additional error details if provided
    if (error) {
      if (error instanceof Error) {
        console.error(`${color}Error: ${error.message}${reset}`);
        if (error.stack) {
          console.error(`${color}Stack: ${error.stack}${reset}`);
        }
      } else {
        console.error(`${color}Error Details:${reset}`, error);
      }
    }
    
    if (meta !== undefined) {
      console.error(`${color}Additional Context:${reset}`, meta);
    }
  }
  
  /**
   * Log a critical error message
   * @param message The critical error message
   * @param error Optional error object to include details from
   * @param meta Optional additional metadata
   */
  critical(message: string, error?: any, meta?: any): void {
    if (!this.shouldLog(LogLevel.CRITICAL)) return;
    
    const color = this.getColorForLevel(LogLevel.CRITICAL);
    const reset = this.config.useColors ? COLOR.RESET : '';
    
    console.error(`${color}${this.format(LogLevel.CRITICAL, message)}${reset}`);
    
    // Log additional error details if provided
    if (error) {
      if (error instanceof Error) {
        console.error(`${color}Error: ${error.message}${reset}`);
        if (error.stack) {
          console.error(`${color}Stack: ${error.stack}${reset}`);
        }
      } else {
        console.error(`${color}Error Details:${reset}`, error);
      }
    }
    
    if (meta !== undefined) {
      console.error(`${color}Additional Context:${reset}`, meta);
    }
  }
  
  /**
   * Log a security-related message (treats as warning level)
   * @param message The security message to log
   * @param meta Optional metadata to include with the log
   */
  security(message: string, meta?: any): void {
    // Use warn level for security events
    this.warn(message, meta);
  }
  
  /**
   * Set a new configuration for this logger instance
   * @param config New partial configuration to apply
   */
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Create a default logger instance for general use
const logger = new Logger('Server');

// Export the default logger instance
export default logger;