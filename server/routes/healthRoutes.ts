/**
 * Health Check Routes
 * 
 * These routes provide health and readiness information for monitoring,
 * load balancers, and other infrastructure components.
 */

import { Router, Request, Response } from 'express';
import { Pool } from '@neondatabase/serverless';
import { Logger } from '../utils/Logger';
import os from 'os';

const logger = new Logger('HealthCheck');
const router = Router();

// Track component health status
const componentStatus: Record<string, {
  status: 'healthy' | 'degraded' | 'unhealthy',
  lastChecked: Date,
  details?: any
}> = {
  database: { status: 'healthy', lastChecked: new Date() },
  api: { status: 'healthy', lastChecked: new Date() },
  cache: { status: 'healthy', lastChecked: new Date() },
  queue: { status: 'healthy', lastChecked: new Date() },
  storage: { status: 'healthy', lastChecked: new Date() }
};

// Overall system status
let systemStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

// Setup health check routes
export function setupHealthRoutes(dbPool: Pool) {
  // Simple health check endpoint for load balancers
  router.get('/', async (_req: Request, res: Response) => {
    // Simple check that returns 200 if the service is up
    // This should be fast and not depend on other services
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  });
  
  // Detailed health check for monitoring systems
  router.get('/detailed', async (_req: Request, res: Response) => {
    try {
      // Run basic checks on all components
      await Promise.all([
        checkDatabaseHealth(dbPool),
        checkApiHealth(),
        checkCacheHealth(),
        checkStorageHealth()
      ]);
      
      // Update system status based on component health
      updateSystemStatus();
      
      // Return appropriate status code based on health
      const statusCode = systemStatus === 'healthy' ? 200 : 
                         systemStatus === 'degraded' ? 200 : 503;
      
      // Component status includes specific component information
      const response = {
        status: systemStatus,
        timestamp: new Date().toISOString(),
        components: componentStatus,
        system: {
          uptime: process.uptime(),
          memory: {
            total: os.totalmem(),
            free: os.freemem(),
            used: process.memoryUsage()
          },
          cpu: {
            load: os.loadavg(),
            cores: os.cpus().length
          }
        }
      };
      
      res.status(statusCode).json(response);
    } catch (error) {
      logger.error('Health check error', error);
      
      // If the health check itself fails, system is unhealthy
      systemStatus = 'unhealthy';
      
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      });
    }
  });
  
  // Readiness probe - for determining if service is ready to serve traffic
  router.get('/ready', async (_req: Request, res: Response) => {
    try {
      // Check critical components only
      await Promise.all([
        checkDatabaseHealth(dbPool),
        checkApiHealth()
      ]);
      
      // Service is ready if critical components are at least degraded
      const isReady = 
        componentStatus.database.status !== 'unhealthy' && 
        componentStatus.api.status !== 'unhealthy';
      
      if (isReady) {
        res.status(200).json({
          status: 'ready',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          status: 'not_ready',
          timestamp: new Date().toISOString(),
          reason: 'Critical components unhealthy'
        });
      }
    } catch (error) {
      logger.error('Readiness check error', error);
      
      res.status(500).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: 'Readiness check failed'
      });
    }
  });
  
  // Liveness probe - for determining if service is alive
  router.get('/live', (_req: Request, res: Response) => {
    // Simple check that the process is running and responsive
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
  
  // Status metrics for monitoring systems
  router.get('/metrics', (_req: Request, res: Response) => {
    // Prometheus-style metrics format
    const metrics = [
      `# HELP system_status System health status (0=healthy, 1=degraded, 2=unhealthy)`,
      `# TYPE system_status gauge`,
      `system_status ${systemStatus === 'healthy' ? 0 : systemStatus === 'degraded' ? 1 : 2}`,
      
      `# HELP component_status Component health status (0=healthy, 1=degraded, 2=unhealthy)`,
      `# TYPE component_status gauge`,
      ...Object.entries(componentStatus).map(([name, info]) => {
        const value = info.status === 'healthy' ? 0 : info.status === 'degraded' ? 1 : 2;
        return `component_status{name="${name}"} ${value}`;
      }),
      
      `# HELP process_uptime_seconds Process uptime in seconds`,
      `# TYPE process_uptime_seconds gauge`,
      `process_uptime_seconds ${process.uptime()}`,
      
      `# HELP process_memory_usage_bytes Process memory usage in bytes`,
      `# TYPE process_memory_usage_bytes gauge`,
      `process_memory_usage_bytes{type="rss"} ${process.memoryUsage().rss}`,
      `process_memory_usage_bytes{type="heapTotal"} ${process.memoryUsage().heapTotal}`,
      `process_memory_usage_bytes{type="heapUsed"} ${process.memoryUsage().heapUsed}`,
      `process_memory_usage_bytes{type="external"} ${process.memoryUsage().external}`,
      
      `# HELP system_cpu_load CPU load average`,
      `# TYPE system_cpu_load gauge`,
      `system_cpu_load{period="1m"} ${os.loadavg()[0]}`,
      `system_cpu_load{period="5m"} ${os.loadavg()[1]}`,
      `system_cpu_load{period="15m"} ${os.loadavg()[2]}`,
      
      `# HELP system_memory_bytes System memory information in bytes`,
      `# TYPE system_memory_bytes gauge`,
      `system_memory_bytes{type="total"} ${os.totalmem()}`,
      `system_memory_bytes{type="free"} ${os.freemem()}`
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(metrics);
  });
  
  return router;
}

/**
 * Check database health
 */
async function checkDatabaseHealth(dbPool: Pool) {
  try {
    const startTime = Date.now();
    const client = await dbPool.connect();
    
    try {
      // Simple query to test database responsiveness
      await client.query('SELECT 1');
      const responseTime = Date.now() - startTime;
      
      // Determine status based on response time
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (responseTime > 1000) {
        status = 'degraded';
      }
      
      // Update component status
      componentStatus.database = {
        status,
        lastChecked: new Date(),
        details: { responseTime }
      };
      
      logger.debug('Database health check success', { responseTime });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Database health check failed', error);
    
    componentStatus.database = {
      status: 'unhealthy',
      lastChecked: new Date(),
      details: { error: (error as Error).message }
    };
  }
}

/**
 * Check API health
 */
async function checkApiHealth() {
  // In a microservices architecture, this would check other APIs
  // For this standalone app, we'll just check the process
  const memoryUsage = process.memoryUsage();
  const heapUsedPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  // Check for high memory usage
  if (heapUsedPercentage > 90) {
    status = 'degraded';
  }
  
  // Update component status
  componentStatus.api = {
    status,
    lastChecked: new Date(),
    details: { 
      memoryUsage: memoryUsage,
      heapUsedPercentage
    }
  };
}

/**
 * Check cache health
 */
async function checkCacheHealth() {
  // In a real app, this would check Redis or another cache service
  // For now, we'll just mark it as healthy
  componentStatus.cache = {
    status: 'healthy',
    lastChecked: new Date()
  };
}

/**
 * Check storage health
 */
async function checkStorageHealth() {
  // In a real app, this would check S3 or another storage service
  // For now, we'll just mark it as healthy
  componentStatus.storage = {
    status: 'healthy',
    lastChecked: new Date()
  };
}

/**
 * Update overall system status based on component health
 */
function updateSystemStatus() {
  const componentStatuses = Object.values(componentStatus).map(c => c.status);
  
  if (componentStatuses.includes('unhealthy')) {
    // If any critical component is unhealthy, system is unhealthy
    if (componentStatus.database.status === 'unhealthy' || 
        componentStatus.api.status === 'unhealthy') {
      systemStatus = 'unhealthy';
    } else {
      // Non-critical components can be unhealthy with system being degraded
      systemStatus = 'degraded';
    }
  } else if (componentStatuses.includes('degraded')) {
    systemStatus = 'degraded';
  } else {
    systemStatus = 'healthy';
  }
}

export default setupHealthRoutes;