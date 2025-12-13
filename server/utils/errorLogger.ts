/**
 * Error Logger Utility
 * 
 * This module provides utilities for centralized error logging and monitoring.
 * In a production environment, this would be connected to an external logging service
 * or database for long-term storage and analysis.
 */

import fs from 'fs';
import path from 'path';

// Configuration for error logging
const LOG_ENABLED = true;
const ERROR_LOG_PATH = path.join(process.cwd(), 'logs');
const ERROR_LOG_FILE = path.join(ERROR_LOG_PATH, 'error.log');
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_LOG_FILES = 10;

// In-memory error storage for API access
interface ErrorLogEntry {
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  source: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
}

// Keep a circular buffer of recent errors
const recentErrors: ErrorLogEntry[] = [];
const MAX_RECENT_ERRORS = 100;

/**
 * Initialize the error logging system
 */
export const initializeErrorLogging = async (): Promise<void> => {
  if (!LOG_ENABLED) return;
  
  try {
    // Ensure log directory exists
    if (!fs.existsSync(ERROR_LOG_PATH)) {
      fs.mkdirSync(ERROR_LOG_PATH, { recursive: true });
    }
    
    // Create log file if it doesn't exist
    if (!fs.existsSync(ERROR_LOG_FILE)) {
      fs.writeFileSync(ERROR_LOG_FILE, '');
    }
    
    // Check log file size and rotate if needed
    await checkAndRotateLogs();
    
    console.log(`Error logging initialized. Writing logs to ${ERROR_LOG_FILE}`);
  } catch (err) {
    console.error('Failed to initialize error logging system:', err);
  }
};

/**
 * Check log size and rotate logs if needed
 */
const checkAndRotateLogs = async (): Promise<void> => {
  try {
    if (!fs.existsSync(ERROR_LOG_FILE)) return;
    
    const stats = fs.statSync(ERROR_LOG_FILE);
    if (stats.size >= MAX_LOG_SIZE) {
      // Rotate logs
      for (let i = MAX_LOG_FILES - 1; i > 0; i--) {
        const oldPath = `${ERROR_LOG_FILE}.${i}`;
        const newPath = `${ERROR_LOG_FILE}.${i + 1}`;
        
        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
        }
      }
      
      // Rename current log to .1
      fs.renameSync(ERROR_LOG_FILE, `${ERROR_LOG_FILE}.1`);
      
      // Create new log file
      fs.writeFileSync(ERROR_LOG_FILE, '');
    }
  } catch (err) {
    console.error('Error rotating log files:', err);
  }
};

/**
 * Log an error with context information
 */
export const logError = (
  error: Error | string,
  source: string,
  context?: Record<string, any>,
  level: 'error' | 'warning' | 'info' = 'error'
): void => {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  // Create error entry
  const entry: ErrorLogEntry = {
    timestamp,
    level,
    source,
    message: errorMessage,
    stack: errorStack,
    context
  };
  
  // Add to recent errors (circular buffer)
  recentErrors.unshift(entry);
  if (recentErrors.length > MAX_RECENT_ERRORS) {
    recentErrors.pop();
  }
  
  // Format entry for log file
  const logEntry = JSON.stringify({
    timestamp,
    level,
    source,
    message: errorMessage,
    stack: errorStack,
    context: context ? JSON.stringify(context) : undefined
  });
  
  // Write to console based on level
  if (level === 'error') {
    console.error(`[${timestamp}] [${level.toUpperCase()}] [${source}] ${errorMessage}`);
  } else if (level === 'warning') {
    console.warn(`[${timestamp}] [${level.toUpperCase()}] [${source}] ${errorMessage}`);
  } else {
    console.info(`[${timestamp}] [${level.toUpperCase()}] [${source}] ${errorMessage}`);
  }
  
  // Write to log file if enabled
  if (LOG_ENABLED) {
    try {
      fs.appendFileSync(ERROR_LOG_FILE, logEntry + '\n');
    } catch (writeErr) {
      console.error('Failed to write to error log file:', writeErr);
    }
  }
};

/**
 * Get recent error logs
 */
export const getRecentErrors = (
  count = 10,
  level?: 'error' | 'warning' | 'info',
  source?: string
): ErrorLogEntry[] => {
  let filteredErrors = [...recentErrors];
  
  // Filter by level if provided
  if (level) {
    filteredErrors = filteredErrors.filter(entry => entry.level === level);
  }
  
  // Filter by source if provided
  if (source) {
    filteredErrors = filteredErrors.filter(entry => entry.source === source);
  }
  
  // Return requested count
  return filteredErrors.slice(0, count);
};

/**
 * Clear recent error logs from memory
 */
export const clearRecentErrors = (): void => {
  recentErrors.length = 0;
};

/**
 * Express middleware for logging errors
 */
export const errorLoggerMiddleware = (err: any, req: any, res: any, next: any): void => {
  const context = {
    path: req.path,
    method: req.method,
    query: req.query,
    headers: req.headers,
    ip: req.ip,
    userId: req.user?.id
  };
  
  logError(err, 'express', context);
  next(err);
};

// Initialize error logging when this module is imported
initializeErrorLogging().catch(err => {
  console.error('Failed to initialize error logging:', err);
});