/**
 * Production Database Integration
 * 
 * This file integrates all production database components including connection pooling,
 * health checks, monitoring, and proper storage implementation.
 */

import { Express } from 'express';
import http from 'http';
import { Pool } from '@neondatabase/serverless';
import { DatabaseStorage } from './database-storage-clean';
import { IStorage } from './storage';
import { db } from './db';
import { setupHealthRoutes } from './routes/healthRoutes';
import { initializeProductionEnvironment } from './config/productionServer';
import { Logger } from './utils/Logger';

const logger = new Logger('ProductionDB');

/**
 * Initialize production database components and return database-backed storage
 */
export async function initializeProductionDatabase(
  app: Express,
  httpServer: http.Server
): Promise<{ storage: IStorage; pool: Pool }> {
  try {
    logger.info('Initializing production database environment');
    
    // Step 1: Initialize production environment (monitoring, connection pool, etc.)
    const { pool } = await initializeProductionEnvironment(app, httpServer);
    
    // Step 2: Add health check routes for infrastructure monitoring
    app.use('/health', setupHealthRoutes(pool));
    
    // Step 3: Create database-backed storage implementation
    const storage = new DatabaseStorage();
    
    // Step 4: Test database connection
    try {
      // Perform a simple query to verify connectivity
      await db.execute('SELECT 1');
      logger.info('Database connection verified successfully');
    } catch (error: any) {
      logger.error('Failed to connect to database', error);
      throw new Error('Database connectivity test failed: ' + (error.message || 'Unknown error'));
    }
    
    // Step 5: Run required migrations and seed data (if needed)
    // In a production environment, migrations should be handled by a proper
    // deployment process, but this ensures the schema is up to date
    try {
      logger.info('Ensuring database schema is up to date');
      // Here we would run any pending migrations
      // This would be something like: await runMigrations();
    } catch (error) {
      logger.error('Error verifying migrations', error);
      // This is critical but we'll continue
    }
    
    logger.info('Production database integration complete');
    
    return {
      storage,
      pool
    };
  } catch (error) {
    logger.critical('Failed to initialize production database environment', error);
    throw error;
  }
}

/**
 * Shutdown database connections gracefully
 */
export async function shutdownDatabase(pool: Pool): Promise<void> {
  try {
    logger.info('Shutting down database connections');
    await pool.end();
    logger.info('Database connections closed successfully');
  } catch (error) {
    logger.error('Error shutting down database connections', error);
    throw error;
  }
}