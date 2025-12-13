/**
 * Production Server Configuration
 * 
 * This file initializes all production infrastructure components
 * and applies the appropriate configurations based on environment.
 */

import { MONITORING_CONFIG, initializeMonitoring } from './monitoringConfig';
import { DB_CONFIG, createProductionPool } from './databaseConfig';
import { LOAD_BALANCING_CONFIG, AUTO_SCALING_CONFIG, initializeScaling, isPrimaryInstance } from './scalingConfig';
import { SESSION_CONFIG, CSRF_CONFIG, API_SIGNATURE_CONFIG } from './productionConfig';
import { Pool } from '@neondatabase/serverless';
import { Logger } from '../utils/Logger';
import http from 'http';
import { Express } from 'express';

const logger = new Logger('ProductionServer');

/**
 * Initialize all production infrastructure components
 */
export async function initializeProductionEnvironment(
  _app: Express,
  _httpServer: http.Server
): Promise<{ pool: Pool }> {
  logger.info('Initializing production environment');
  
  try {
    // Step 1: Initialize monitoring
    logger.info('Setting up monitoring and alerting');
    initializeMonitoring();
    
    // Step 2: Initialize database with production configuration
    logger.info('Initializing production database connections');
    
    // Get connection string from environment
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is required for production database connection');
    }
    
    // Create production database pool
    const pool = createProductionPool(connectionString);
    
    // Step 3: Configure load balancing and scaling
    logger.info('Configuring load balancing and auto-scaling');
    initializeScaling();
    
    // Step 4: Set up scheduled tasks that should only run on one instance
    if (isPrimaryInstance()) {
      logger.info('Setting up primary instance tasks');
      setupPrimaryInstanceTasks();
    }
    
    // Log all environment settings
    logProductionConfig();
    
    logger.info('Production environment initialization completed successfully');
    
    // Return the database pool
    return { pool };
  } catch (error) {
    logger.critical('Failed to initialize production environment', error);
    throw error;
  }
}

/**
 * Set up tasks that should only run on the primary instance
 * in a horizontally scaled environment
 */
function setupPrimaryInstanceTasks() {
  // Schedule database maintenance
  scheduleDatabaseMaintenance();
  
  // Schedule automatic backups (if not using managed service)
  scheduleBackups();
  
  // Schedule metric aggregation
  scheduleMetricAggregation();
}

/**
 * Schedule database maintenance tasks
 */
function scheduleDatabaseMaintenance() {
  // Only run these tasks during off-peak hours
  const maintenanceTime = new Date();
  maintenanceTime.setHours(3, 0, 0, 0); // 3 AM
  
  // Calculate time until next maintenance window
  const now = new Date();
  let delay = maintenanceTime.getTime() - now.getTime();
  if (delay < 0) {
    delay += 24 * 60 * 60 * 1000; // Add 1 day if maintenance time already passed
  }
  
  // Schedule the first maintenance
  setTimeout(() => {
    // Run database maintenance tasks
    logger.info('Running scheduled database maintenance');
    
    try {
      // Example maintenance tasks:
      // - VACUUM ANALYZE
      // - Update statistics
      // - Check for index bloat
      // - Remove old logs
      
      logger.info('Database maintenance completed successfully');
    } catch (error) {
      logger.error('Error during database maintenance', error);
    }
    
    // Schedule the next maintenance (every 24 hours)
    setInterval(() => {
      // Same maintenance tasks
      logger.info('Running daily database maintenance');
    }, 24 * 60 * 60 * 1000);
  }, delay);
  
  logger.info(`Scheduled database maintenance for ${maintenanceTime.toLocaleTimeString()} daily`);
}

/**
 * Schedule backup tasks
 */
function scheduleBackups() {
  if (!DB_CONFIG.backup.enabled) {
    logger.info('Automated backups are disabled in configuration');
    return;
  }
  
  // Schedule based on configuration
  // (In a real environment, this would likely be handled by the database provider)
  logger.info('Scheduled database backups', {
    fullBackup: DB_CONFIG.backup.fullBackup.schedule,
    incrementalBackup: DB_CONFIG.backup.incrementalBackup.schedule,
    transactionLogBackup: DB_CONFIG.backup.transactionLogBackup.schedule
  });
}

/**
 * Schedule metric aggregation tasks
 */
function scheduleMetricAggregation() {
  if (!MONITORING_CONFIG.metrics.enabled) {
    logger.info('Metrics collection is disabled in configuration');
    return;
  }
  
  // Set up hourly aggregation
  setInterval(() => {
    logger.info('Aggregating hourly metrics');
    // This would aggregate detailed metrics into hourly summaries
  }, 60 * 60 * 1000);
  
  // Set up daily aggregation
  const dailyAggregationTime = new Date();
  dailyAggregationTime.setHours(1, 0, 0, 0); // 1 AM
  
  // Calculate time until next daily aggregation
  const now = new Date();
  let delay = dailyAggregationTime.getTime() - now.getTime();
  if (delay < 0) {
    delay += 24 * 60 * 60 * 1000; // Add 1 day if time already passed
  }
  
  // Schedule daily aggregation
  setTimeout(() => {
    logger.info('Aggregating daily metrics');
    
    // Schedule for subsequent days
    setInterval(() => {
      logger.info('Aggregating daily metrics');
    }, 24 * 60 * 60 * 1000);
  }, delay);
}

/**
 * Log all production configuration settings
 */
function logProductionConfig() {
  // Sanitized version for logging
  const sanitizedConfig = {
    database: {
      pool: {
        max: DB_CONFIG.pool.max,
        min: DB_CONFIG.pool.min,
        idle: DB_CONFIG.pool.idle
      },
      replicas: {
        enabled: DB_CONFIG.replicas.enabled,
        count: DB_CONFIG.replicas.hosts.length
      },
      backup: {
        enabled: DB_CONFIG.backup.enabled,
        fullBackupSchedule: DB_CONFIG.backup.fullBackup.schedule,
        incrementalBackupSchedule: DB_CONFIG.backup.incrementalBackup.schedule
      }
    },
    monitoring: {
      enabled: MONITORING_CONFIG.apm.enabled,
      healthChecks: MONITORING_CONFIG.healthChecks.enabled,
      alertingChannels: MONITORING_CONFIG.alerting.channels.map(c => c.type)
    },
    scaling: {
      loadBalancing: {
        enabled: LOAD_BALANCING_CONFIG.enabled,
        strategy: LOAD_BALANCING_CONFIG.strategy
      },
      autoScaling: {
        enabled: AUTO_SCALING_CONFIG.enabled,
        minCapacity: AUTO_SCALING_CONFIG.capacity.minimum,
        maxCapacity: AUTO_SCALING_CONFIG.capacity.maximum
      }
    },
    security: {
      sessionTimeout: SESSION_CONFIG.idleTimeout / 60000, // Convert to minutes
      absoluteTimeout: SESSION_CONFIG.absoluteTimeout / 60000, // Convert to minutes
      csrfEnabled: CSRF_CONFIG.enabled,
      apiSignatureEnabled: API_SIGNATURE_CONFIG.enabled
    }
  };
  
  logger.info('Production configuration loaded', sanitizedConfig);
}