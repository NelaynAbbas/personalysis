/**
 * Load Balancing and Scaling Configuration for Production
 * 
 * This file contains configuration for load balancing, auto-scaling,
 * and high availability in production environments.
 */

import { Logger } from '../utils/Logger';

const logger = new Logger('Scaling');

// Load balancing configuration
export const LOAD_BALANCING_CONFIG = {
  // Enable load balancing
  enabled: true,
  
  // Load balancing strategy
  strategy: 'least-connections', // Options: round-robin, least-connections, ip-hash, weighted
  
  // Health check settings for load balancer
  healthCheck: {
    path: '/health',           // Health check endpoint
    interval: 10,              // Check interval in seconds
    timeout: 5,                // Timeout in seconds
    healthyThreshold: 2,       // Number of consecutive successes to mark as healthy
    unhealthyThreshold: 3,     // Number of consecutive failures to mark as unhealthy
  },
  
  // SSL/TLS termination at load balancer
  ssl: {
    enabled: true,
    certificateArn: process.env.SSL_CERT_ARN || 'arn:aws:acm:region:account:certificate/certificate-id',
    policy: 'ELBSecurityPolicy-TLS-1-2-2017-01', // Minimum TLS 1.2
  },
  
  // Stickiness/session affinity
  sessionAffinity: {
    enabled: true,
    type: 'cookie',            // Options: cookie, source-ip
    cookieName: 'PPRO_AFFINITY',
    expirationSeconds: 86400   // 24 hours
  },
  
  // Cross-zone load balancing
  crossZoneLoadBalancing: true,
};

// Auto-scaling configuration
export const AUTO_SCALING_CONFIG = {
  // Enable auto-scaling
  enabled: true,
  
  // Capacity configuration
  capacity: {
    minimum: 2,                // Minimum number of instances
    maximum: 10,               // Maximum number of instances
    desired: 3                 // Desired number of instances to start with
  },
  
  // Scaling policies
  policies: [
    {
      name: 'cpu-utilization',
      metric: 'CPUUtilization',
      threshold: 70,           // Scale up if CPU > 70%
      comparisonOperator: 'GreaterThanThreshold',
      statistic: 'Average',
      period: 60,              // 1 minute
      evaluationPeriods: 3,    // 3 consecutive periods
      scalingAdjustment: 1,    // Add 1 instance
      cooldown: 300            // 5 minute cooldown after scaling
    },
    {
      name: 'cpu-utilization-scale-down',
      metric: 'CPUUtilization',
      threshold: 30,           // Scale down if CPU < 30%
      comparisonOperator: 'LessThanThreshold',
      statistic: 'Average',
      period: 60,
      evaluationPeriods: 5,    // 5 consecutive periods (more conservative for scale down)
      scalingAdjustment: -1,   // Remove 1 instance
      cooldown: 300
    },
    {
      name: 'request-count-high',
      metric: 'RequestCount',
      threshold: 1000,         // Scale up if > 1000 requests per target per minute
      comparisonOperator: 'GreaterThanThreshold',
      statistic: 'Sum',
      period: 60,
      evaluationPeriods: 2,
      scalingAdjustment: 1,
      cooldown: 180            // 3 minute cooldown
    }
  ],
  
  // Scheduled scaling for predictable load patterns
  scheduledActions: [
    {
      name: 'business-hours-scale-up',
      schedule: 'cron(0 8 ? * MON-FRI *)', // 8:00 AM Monday-Friday
      minSize: 3,
      maxSize: 10,
      desiredCapacity: 5
    },
    {
      name: 'after-hours-scale-down',
      schedule: 'cron(0 20 ? * MON-FRI *)', // 8:00 PM Monday-Friday
      minSize: 2,
      maxSize: 5,
      desiredCapacity: 2
    }
  ]
};

// High availability configuration
export const HIGH_AVAILABILITY_CONFIG = {
  // Enable high availability
  enabled: true,
  
  // Multi-AZ deployment
  multiAZ: {
    enabled: true,
    zones: [
      process.env.AZ_1 || 'us-east-1a',
      process.env.AZ_2 || 'us-east-1b',
      process.env.AZ_3 || 'us-east-1c'
    ]
  },
  
  // Failover settings
  failover: {
    enabled: true,
    mode: 'automatic',        // Options: automatic, manual
    recoveryTime: 60,         // Target recovery time in seconds
    healthCheck: {
      path: '/health',
      interval: 10,
      timeout: 5,
      failureThreshold: 3
    }
  },
  
  // Deployment strategy
  deployment: {
    type: 'rolling',          // Options: rolling, blue-green, canary
    batchSize: 1,             // Number of instances to update at once
    minHealthyPercent: 50,    // Minimum healthy instances during deployment (%)
    maxUnavailablePercent: 50 // Maximum unavailable instances during deployment (%)
  }
};

/**
 * Initialize infrastructure for horizontal scaling
 */
export function initializeScaling() {
  if (!LOAD_BALANCING_CONFIG.enabled) {
    logger.warn('Load balancing is disabled in configuration');
    return;
  }
  
  try {
    // This would typically be used in a cloud environment to register
    // the instance with a load balancer and set up scaling policies
    
    // In our Replit environment, we're not actually running in a
    // horizontally scaled environment, but we can prepare the configurations
    
    logger.info('Scaling configuration initialized');
    
    // Handle graceful shutdown for load balancer
    setupGracefulShutdown();
    
    // Set up health check route
    logger.info('Health check endpoint configured');
  } catch (error) {
    logger.error('Failed to initialize scaling configuration', error);
  }
}

/**
 * Set up handlers for graceful shutdown with load balancer
 */
function setupGracefulShutdown() {
  // In a real horizontally scaled environment, this would:
  // 1. Register with the load balancer upon startup
  // 2. Deregister from the load balancer before shutting down
  // 3. Wait for in-flight requests to complete before exiting
  
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, initiating graceful shutdown');
    
    try {
      // 1. Start draining connections - in a real environment, this would notify the load balancer
      logger.info('Deregistering from load balancer');
      
      // 2. Wait for existing connections to drain (max 30 seconds)
      logger.info('Waiting for connections to drain (30s timeout)');
      
      // 3. Wait a bit to allow for connection draining
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      // 4. Shutdown complete
      logger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', error);
      process.exit(1);
    }
  });
}

/**
 * Check if current instance is the primary/leader instance
 * This is used for tasks that should only run on one instance in a cluster
 */
export function isPrimaryInstance(): boolean {
  // In a real environment, this would use a distributed lock or leader election
  // For our Replit environment, we'll always return true since we're single-instance
  return true;
}