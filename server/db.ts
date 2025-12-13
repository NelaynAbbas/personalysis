import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";
import { Logger } from './utils/Logger';
import { sql } from 'drizzle-orm';

// Initialize module-specific logger
const logger = new Logger('Database');

// Configure Neon Database to use WebSockets and enable fetch connection cache to reduce connection churn
neonConfig.webSocketConstructor = ws;
// Reuse underlying fetch connections across queries to avoid hitting Neon permit limits
neonConfig.fetchConnectionCache = true;

// Verify database URL exists - defer check until connection is actually needed
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  return url;
}

// Pool configuration with production-ready settings - defer URL check until connection
let poolConfig: any = null;

function getPoolConfig() {
  if (!poolConfig) {
    poolConfig = {
      connectionString: getDatabaseUrl(),
      max: 5, // Further reduce for serverless to prevent connection permit exhaustion
      idleTimeoutMillis: 60000, // Increased from 30s to 60s to reduce connection churn
      connectionTimeoutMillis: 30000, // Increased from 5s to 30s for Neon's serverless requirements
      maxUses: 1000, // Reduced from 7500 to prevent premature recycling
      ssl: true, // Always enable SSL for Neon serverless
      allowExitOnIdle: true, // Allow graceful shutdown
    };
  }
  return poolConfig;
}

// Create connection pool with error handling - defer creation until needed
let poolInstance: Pool | null = null;
let keepAliveTimer: NodeJS.Timeout | null = null;
let isResettingPool = false; // Lock to prevent concurrent resets
let resetPoolPromise: Promise<void> | null = null; // Track ongoing reset

function getPool(): Pool {
  if (!poolInstance) {
    poolInstance = new Pool(getPoolConfig());

    // Set up error handling for the pool
    poolInstance.on('error', (err, client) => {
      logger.error(`Unexpected error on idle database client: ${(err as Error).message}`);
      // Attempt to reconnect client
      process.nextTick(() => {
        logger.info('Attempting to reconnect database client');
        try {
          client.release(true); // Release with error
        } catch (releaseErr) {
          logger.error(`Error releasing client: ${(releaseErr as Error).message}`);
        }
      });
    });

    // Lightweight keepalive to prevent serverless cold-idle disconnects
    if (!keepAliveTimer) {
      keepAliveTimer = setInterval(async () => {
        // Skip keepalive if pool is being reset
        if (isResettingPool || !poolInstance) {
          return;
        }
        try {
          // Check if pool is still valid before querying
          const currentPool = poolInstance;
          if (currentPool && !currentPool.ended) {
            await currentPool.query('SELECT 1');
          }
        } catch (err) {
          const errorMessage = (err as Error).message;
          // Only log if it's not a "pool closed" error (expected during reset)
          if (!errorMessage.includes('pool') && !errorMessage.includes('closed') && !errorMessage.includes('ended')) {
            logger.warn(`Keepalive ping failed: ${errorMessage}`);
          }
        }
      }, 20000);
      // Don't keep the process alive solely for this timer
      keepAliveTimer.unref();
    }
  }
  return poolInstance;
}

// Create connection pool with error handling - defer until first use
export const pool = new Proxy({} as Pool, {
  get(target, prop) {
    const poolInstance = getPool();
    return (poolInstance as any)[prop];
  }
});

// Allow callers to forcefully reset the pool (used by health monitor)
// Now with protection against concurrent resets
export async function resetPool(): Promise<void> {
  // If a reset is already in progress, wait for it to complete
  if (isResettingPool && resetPoolPromise) {
    logger.info('Pool reset already in progress, waiting for completion...');
    return resetPoolPromise;
  }

  // Start new reset
  isResettingPool = true;
  resetPoolPromise = (async () => {
    try {
      // Clear keepalive timer first
      if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
      }

      // Close pool if it exists
      if (poolInstance) {
        const poolToClose = poolInstance;
        poolInstance = null; // Set to null first to prevent new connections
        dbInstance = null; // Reset db instance too

        try {
          // Check if pool is already closed
          if (!poolToClose.ended) {
            await poolToClose.end();
            logger.info('Database pool closed successfully');
          } else {
            logger.warn('Pool was already closed');
          }
        } catch (err) {
          const errorMessage = (err as Error).message;
          // Ignore "pool already closed" errors
          if (!errorMessage.includes('pool') && !errorMessage.includes('closed') && !errorMessage.includes('ended')) {
            logger.warn(`Error while closing database pool: ${errorMessage}`);
          }
        }
      }
    } finally {
      // Always reset the lock, even if there was an error
      isResettingPool = false;
      resetPoolPromise = null;
    }
  })();

  return resetPoolPromise;
}

// Drizzle ORM initialization - defer until first use
let dbInstance: any = null;

function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle(pool, { schema });
  }
  return dbInstance;
}

export const db = new Proxy({} as any, {
  get(target, prop) {
    const dbInstance = getDb();
    return (dbInstance as any)[prop];
  }
});

// Connection health check function with better error handling
export async function checkDatabaseConnection() {
  // Wait for any ongoing pool reset to complete
  if (isResettingPool && resetPoolPromise) {
    await resetPoolPromise;
  }

  let client;
  try {
    // Ensure pool exists and is not closed
    const currentPool = getPool();
    if (!currentPool || currentPool.ended) {
      logger.warn('Pool is closed, cannot check connection');
      return { connected: false, error: 'Pool is closed' };
    }

    // Get a client from the pool with timeout
    client = await Promise.race([
      currentPool.connect(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      )
    ]);

    // Perform a simple query with timeout
    const result = await Promise.race([
      client.query('SELECT NOW() as now'),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 5000)
      )
    ]);

    const now = result.rows[0].now;
    logger.info(`Database connection successful, database time: ${now}`);
    return { connected: true, time: now };
  } catch (err) {
    const errorMessage = (err as Error).message;
    logger.error(`Database connection failed: ${errorMessage}`);
    return { connected: false, error: errorMessage };
  } finally {
    // Make sure to release the client before any error/success handling
    if (client) {
      try {
        client.release();
      } catch (releaseErr) {
        // Ignore release errors (client might already be released)
        logger.debug(`Error releasing client: ${(releaseErr as Error).message}`);
      }
    }
  }
}

// Connection retry function with exponential backoff
export async function connectWithRetry(maxRetries = 5, initialDelay = 1000) {
  let retries = 0;
  let lastError;

  while (retries < maxRetries) {
    try {
      const result = await checkDatabaseConnection();
      if (result.connected) {
        logger.info(`Successfully connected to database after ${retries} retries`);
        return true;
      }
    } catch (err) {
      lastError = err;
      logger.error(`Connection attempt ${retries + 1} failed: ${(err as Error).message}`);
    }

    // Exponential backoff
    const delay = initialDelay * Math.pow(2, retries);
    logger.info(`Retrying in ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    retries++;
  }

  logger.error(`Failed to connect to database after ${maxRetries} attempts`);
  throw lastError || new Error('Failed to connect to database');
}

/**
 * Execute a database operation with automatic retry on timeout errors
 * 
 * @param operation - The database operation to execute
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds for exponential backoff (default: 1000ms)
 * @returns Promise resolving to the operation result
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Check if it's a timeout or connection error
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isTimeoutError = errorMessage.includes('timeout') || 
                              errorMessage.includes('ECONNRESET') ||
                              errorMessage.includes('connection');
      
      if (isTimeoutError && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        logger.warn(`Database operation failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`);
        logger.debug(`Error details: ${errorMessage}`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // For non-retriable errors or final attempt, throw the error
      throw error;
    }
  }
  
  logger.error(`Database operation failed after ${maxRetries} attempts`);
  throw lastError!;
}

// Connection health monitoring with improved reset logic
let isHealthy = true;
let lastHealthCheck = Date.now();
let consecutiveFailures = 0;
let lastResetTime = 0;
const MIN_RESET_INTERVAL = 60000; // Don't reset more than once per minute

/**
 * Monitor database connection health
 */
export async function monitorConnectionHealth(): Promise<boolean> {
  const now = Date.now();
  
  // Check health every 30 seconds
  if (now - lastHealthCheck > 30000) {
    try {
      const result = await checkDatabaseConnection();
      if (result.connected) {
        isHealthy = true;
        if (consecutiveFailures > 0) {
          logger.info(`Database health restored after ${consecutiveFailures} consecutive failures`);
          consecutiveFailures = 0;
        }
      } else {
        isHealthy = false;
        consecutiveFailures++;
        logger.warn(`Database health check failed (${consecutiveFailures} consecutive failures)`);
        
        // If repeatedly failing, recycle the pool to recover from bad state
        // But only if enough time has passed since last reset
        if (consecutiveFailures >= 3 && (now - lastResetTime) > MIN_RESET_INTERVAL) {
          logger.warn('Multiple consecutive DB health check failures detected, resetting pool...');
          lastResetTime = now;
          // Don't await - let it happen in background to avoid blocking
          resetPool().catch(err => {
            logger.error(`Error during pool reset: ${(err as Error).message}`);
          });
        }
      }
    } catch (error) {
      isHealthy = false;
      consecutiveFailures++;
      logger.error(`Database health check error (${consecutiveFailures} consecutive failures): ${(error as Error).message}`);
      
      // Same logic for exception case
      if (consecutiveFailures >= 3 && (now - lastResetTime) > MIN_RESET_INTERVAL) {
        logger.warn('Multiple consecutive DB errors detected during health check, resetting pool...');
        lastResetTime = now;
        resetPool().catch(err => {
          logger.error(`Error during pool reset: ${(err as Error).message}`);
        });
      }
    }
    lastHealthCheck = now;
  }
  
  return isHealthy;
}

/**
 * Get current connection health status
 */
export function getConnectionHealth(): boolean {
  return isHealthy;
}

// Export sql for query building
export { sql };
