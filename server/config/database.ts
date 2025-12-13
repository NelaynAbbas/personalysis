/**
 * Database Configuration and Initialization
 * 
 * This file provides the bridge between development and production database configurations.
 * It determines whether to use in-memory storage or production database storage based
 * on the environment.
 */

import { Express } from 'express';
import http from 'http';
import { IStorage } from '../storage';
import { storage as memStorage } from '../storage';
import { dbStorage as databaseStorage } from '../database-storage-clean'; // Import the clean database storage implementation with working BI features
import { Pool } from '@neondatabase/serverless';
import { checkDatabaseConnection } from '../db';
import { initializeProductionDatabase, shutdownDatabase } from '../production-db-integration';
import { Logger } from '../utils/Logger';

const logger = new Logger('DatabaseConfig');

// Track database resources for cleanup
let dbPool: Pool | null = null;
let activeStorage: IStorage | null = null;

/**
 * Initialize database storage based on environment
 * 
 * In development, uses database storage (for BI features)
 * In production, uses real database with connection pooling
 */
export async function initializeStorage(
  app?: Express,
  httpServer?: http.Server
): Promise<IStorage> {
  // Determine if we're in production mode
  const isProduction = process.env.NODE_ENV === 'production';
  
  try {
    if (isProduction && app && httpServer) {
      logger.info('Initializing production database storage');
      
      // Initialize production database with proper connection pooling
      const { storage, pool } = await initializeProductionDatabase(app, httpServer);
      
      // Store references for cleanup
      dbPool = pool;
      activeStorage = storage;
      
      logger.info('Production database storage initialized successfully');
      return storage;
    } else {
      // For development, use the database storage implementation
      // This is critical for Business Intelligence features to work with real data
      logger.info('Using database storage implementation (development mode)');
      
      activeStorage = databaseStorage; // Use real database storage even in development
      return databaseStorage;
    }
  } catch (error) {
    logger.error('Failed to initialize database storage', error);
    
    // If database connection fails, fallback to in-memory storage with a warning
    logger.warn('Falling back to in-memory storage - Business Intelligence features will use demo data');
    return memStorage;
  }
}

/**
 * Check database status and connectivity
 */
export async function checkDatabaseStatus(): Promise<{
  connected: boolean;
  mode: 'in-memory' | 'database' | 'production';
  details?: any;
}> {
  if (!activeStorage) {
    return {
      connected: false,
      mode: 'in-memory',
      details: { error: 'Database not initialized' }
    };
  }
  
  try {
    if (dbPool) {
      // We're using production database
      const result = await checkDatabaseConnection();
      return {
        connected: result.connected,
        mode: 'production',
        details: result
      };
    } else if (activeStorage === databaseStorage) {
      // We're using database storage (development with real DB)
      const result = await checkDatabaseConnection();
      return {
        connected: result.connected,
        mode: 'database',
        details: result
      };
    } else {
      // We're using in-memory storage
      return {
        connected: true,
        mode: 'in-memory'
      };
    }
  } catch (error: any) {
    return {
      connected: false,
      mode: dbPool ? 'production' : (activeStorage === databaseStorage ? 'database' : 'in-memory'),
      details: { error: error.message || 'Unknown error' }
    };
  }
}

/**
 * Gracefully shutdown database connections
 */
export async function shutdownStorage(): Promise<void> {
  if (dbPool) {
    logger.info('Shutting down production database pool');
    try {
      await shutdownDatabase(dbPool);
      dbPool = null;
    } catch (error) {
      logger.error('Error shutting down database pool', error);
      throw error;
    }
  } else {
    logger.info('No database pool to shut down (in-memory mode)');
  }
}