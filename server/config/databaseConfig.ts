/**
 * Database Configuration for Production Environment
 * 
 * This file contains settings for database connections, backups,
 * replication, and other database-related production configuration.
 */

import { Pool } from '@neondatabase/serverless';
import { Logger } from '../utils/Logger';

const logger = new Logger('Database');

// Database connection settings
export const DB_CONFIG = {
  // Main database connection pool configuration
  pool: {
    max: 20,                    // Maximum number of connections in the pool
    min: 5,                     // Minimum number of connections to maintain
    idle: 10000,                // Maximum time (ms) that a connection can be idle before being released
    acquire: 30000,             // Maximum time (ms) to wait for a connection from the pool
    connectTimeout: 10000,      // Connection timeout (ms)
    connectionTimeoutMillis: 10000, // Alias for above
    maxUses: 7500,              // Number of times a connection can be used before being recycled
    statement_timeout: 60000,   // Statement timeout (ms)
    query_timeout: 60000,       // Query timeout (ms)
    keepAlive: true,            // Keep connections alive with periodic packets
    ssl: true                   // Enable SSL for secure connections
  },
  
  // Read replica configuration
  replicas: {
    enabled: true,
    readPreference: 'nearest', // Options: nearest, primaryPreferred, primary, secondary, secondaryPreferred
    hosts: [
      // These would typically be environment variables in production
      process.env.DB_REPLICA_1_HOST || 'replica-1.personalysispro.com',
      process.env.DB_REPLICA_2_HOST || 'replica-2.personalysispro.com'
    ],
    port: process.env.DB_REPLICA_PORT ? parseInt(process.env.DB_REPLICA_PORT) : 5432
  },
  
  // Health check settings
  healthCheck: {
    enabled: true,
    interval: 30000,          // Check health every 30 seconds
    timeout: 5000,            // Timeout for health check query
    maxFailures: 3,           // Number of consecutive failures before considering unhealthy
    query: 'SELECT 1'         // Simple query to check database connectivity
  },
  
  // Backup configuration
  backup: {
    enabled: true,
    // Daily full backups
    fullBackup: {
      schedule: '0 2 * * *',  // Every day at 2:00 AM (cron format)
      retention: 30           // Number of days to retain backups
    },
    // Incremental backups every 4 hours
    incrementalBackup: {
      schedule: '0 */4 * * *', // Every 4 hours (cron format)
      retention: 7            // Number of days to retain incremental backups
    },
    // Transaction log backups every 15 minutes
    transactionLogBackup: {
      schedule: '*/15 * * * *', // Every 15 minutes (cron format)
      retention: 2             // Number of days to retain transaction logs
    },
    // Where to store backups
    storage: {
      provider: 'S3',         // S3, Azure, GCP, etc.
      bucket: process.env.BACKUP_BUCKET || 'personalysispro-backups',
      region: process.env.AWS_REGION || 'us-east-1',
      path: 'database-backups/',
      encryption: true         // Encrypt backups at rest
    }
  },
  
  // Recovery point objective (RPO) and recovery time objective (RTO)
  sla: {
    rpo: 15 * 60,             // 15 minutes (in seconds)
    rto: 30 * 60              // 30 minutes (in seconds)
  },
  
  // Automatic failover configuration
  failover: {
    enabled: true,
    maxLagSeconds: 30,        // Maximum replication lag before considering a replica unhealthy
    automaticFailover: true,  // Automatically failover to a healthy replica
    failbackDelay: 300        // Seconds to wait before failing back to primary after recovery
  }
};

/**
 * Initialize database connection pool with production settings
 */
export function createProductionPool(connectionString: string): Pool {
  logger.info('Initializing production database connection pool');
  
  if (!connectionString) {
    logger.error('No database connection string provided');
    throw new Error('DATABASE_URL is required for production database connection');
  }
  
  // Create enhanced connection pool with monitoring
  const pool = new Pool({
    connectionString,
    max: DB_CONFIG.pool.max,
    idleTimeoutMillis: DB_CONFIG.pool.idle,
    connectionTimeoutMillis: DB_CONFIG.pool.connectionTimeoutMillis,
    ssl: DB_CONFIG.pool.ssl,
    maxUses: DB_CONFIG.pool.maxUses
  });
  
  // Add event listeners for connection pool monitoring
  pool.on('connect', (_client) => {
    logger.debug('New database connection established');
  });
  
  pool.on('error', (err, _client) => {
    logger.error('Database pool error', err);
  });
  
  pool.on('remove', (_client) => {
    logger.debug('Database connection removed from pool');
  });
  
  // Start health check interval
  if (DB_CONFIG.healthCheck.enabled) {
    startHealthChecks(pool);
  }
  
  return pool;
}

/**
 * Start database health check monitoring
 */
function startHealthChecks(pool: Pool) {
  let consecutiveFailures = 0;
  
  const healthCheckInterval = setInterval(async () => {
    try {
      const startTime = Date.now();
      const client = await pool.connect();
      
      try {
        await client.query(DB_CONFIG.healthCheck.query);
        const duration = Date.now() - startTime;
        
        logger.debug(`Database health check successful (${duration}ms)`);
        consecutiveFailures = 0;
      } finally {
        client.release();
      }
    } catch (error) {
      consecutiveFailures++;
      logger.warn(`Database health check failed (${consecutiveFailures}/${DB_CONFIG.healthCheck.maxFailures})`, error);
      
      if (consecutiveFailures >= DB_CONFIG.healthCheck.maxFailures) {
        logger.error('Database is unhealthy - too many consecutive health check failures');
        // In a real production system, this would trigger an alert and potentially initiate failover
      }
    }
  }, DB_CONFIG.healthCheck.interval);
  
  // Make sure to clear the interval when the process exits
  process.on('exit', () => {
    clearInterval(healthCheckInterval);
  });
}