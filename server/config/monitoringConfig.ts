/**
 * Monitoring and Alerting Configuration for Production
 * 
 * This file contains configuration for system monitoring, alerting,
 * and logging in production environments.
 */

import { Logger } from '../utils/Logger';

const logger = new Logger('Monitoring');

// Monitoring configuration
export const MONITORING_CONFIG = {
  // Application performance monitoring settings
  apm: {
    enabled: true,
    sampleRate: 0.1,          // Sample 10% of requests for detailed tracing
    slowRequestThreshold: 2000, // Threshold for slow requests (in ms)
    errorTrackingEnabled: true, // Track and report errors
    userTrackingEnabled: true,  // Track user context with errors
    metricsInterval: 60         // Report metrics every 60 seconds
  },
  
  // System metrics collection
  metrics: {
    enabled: true,
    interval: 15000,          // Collect metrics every 15 seconds
    retention: {
      highResolution: 24 * 7,  // 7 days of high-resolution metrics (15s intervals)
      mediumResolution: 30,    // 30 days of medium-resolution metrics (1m intervals)
      lowResolution: 365       // 1 year of low-resolution metrics (1h intervals)
    },
    // Metrics to collect
    collect: {
      cpu: true,
      memory: true,
      eventLoop: true,
      gc: true,
      http: true,
      database: true,
      customMetrics: true
    }
  },
  
  // Health check endpoints
  healthChecks: {
    enabled: true,
    path: '/health',           // Health check endpoint
    detailedPath: '/health/detailed', // Detailed health information (protected)
    interval: 30000,           // Internal check interval (ms)
    components: [
      {
        name: 'database',
        critical: true,        // System cannot function without this component
        timeout: 5000          // Timeout for health check
      },
      {
        name: 'cache',
        critical: false,       // System can function in degraded mode without cache
        timeout: 2000
      },
      {
        name: 'storage',
        critical: true,
        timeout: 5000
      },
      {
        name: 'ai-service',
        critical: false,
        timeout: 8000
      }
    ]
  },
  
  // Alerting configuration
  alerting: {
    enabled: true,
    channels: [
      {
        type: 'email',
        recipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || ['alerts@personalysispro.com'],
        throttle: 300          // Minimum seconds between repeated alerts
      },
      {
        type: 'sms',
        recipients: process.env.ALERT_SMS_RECIPIENTS?.split(',') || [],
        throttle: 900,         // 15 minutes between SMS alerts
        criticalOnly: true     // Only send SMS for critical alerts
      },
      {
        type: 'slack',
        webhook: process.env.SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/your-slack-webhook',
        channel: '#production-alerts',
        throttle: 60
      }
    ],
    // Alert severity levels
    severityLevels: {
      critical: {
        escalation: true,      // Requires human response
        responseTime: 15,      // Expected response within 15 minutes
        retryInterval: 5,      // Retry notification every 5 minutes
        channels: ['email', 'sms', 'slack']
      },
      error: {
        escalation: false,
        responseTime: 60,      // Expected response within 1 hour
        retryInterval: 15,
        channels: ['email', 'slack']
      },
      warning: {
        escalation: false,
        responseTime: 240,     // Expected response within 4 hours
        retryInterval: 30,
        channels: ['slack']
      },
      info: {
        escalation: false,
        channels: ['slack']
      }
    },
    // Alert rules
    rules: [
      {
        name: 'high-cpu',
        condition: 'metrics.cpu.usage > 85 for 5m',
        severity: 'warning',
        message: 'High CPU usage detected',
        autoResolve: true
      },
      {
        name: 'critical-cpu',
        condition: 'metrics.cpu.usage > 95 for 2m',
        severity: 'critical',
        message: 'Critical CPU usage detected',
        autoResolve: true
      },
      {
        name: 'high-memory',
        condition: 'metrics.memory.usage > 85 for 5m',
        severity: 'warning',
        message: 'High memory usage detected',
        autoResolve: true
      },
      {
        name: 'database-errors',
        condition: 'metrics.database.errors > 5 in 1m',
        severity: 'error',
        message: 'Multiple database errors detected',
        autoResolve: false
      },
      {
        name: 'api-errors',
        condition: 'metrics.http.5xx > 10 in 1m',
        severity: 'error',
        message: 'Multiple API errors detected',
        autoResolve: false
      },
      {
        name: 'database-latency',
        condition: 'metrics.database.responseTime.p95 > 1000 for 5m',
        severity: 'warning',
        message: 'Database latency is high',
        autoResolve: true
      }
    ]
  },
  
  // Logging configuration
  logging: {
    // Log levels to capture
    level: process.env.LOG_LEVEL || 'info', // debug, info, warn, error, critical
    // Where to store logs
    destinations: [
      {
        type: 'file',
        path: '/home/runner/workspace/logs',
        maxFiles: 30,          // Number of log files to keep
        maxSize: '100m',       // Maximum size of each log file
        compress: true,        // Compress older logs
        level: 'debug'         // Capture debug logs in files
      },
      {
        type: 'console',
        colorize: true,
        level: 'info'          // Only info and above in console
      },
      {
        type: 'cloud',
        enabled: process.env.NODE_ENV === 'production',
        provider: process.env.LOG_PROVIDER || 'aws-cloudwatch',
        config: {
          region: process.env.AWS_REGION || 'us-east-1',
          groupName: process.env.LOG_GROUP || 'personalysispro-production',
          streamName: process.env.LOG_STREAM || 'api-server'
        },
        level: 'info'
      }
    ],
    // Log format customization
    format: {
      timestamp: true,
      json: true,
      colorize: false,         // Don't colorize JSON logs
      includeMetadata: true
    },
    // Log data redaction
    redaction: {
      enabled: true,
      paths: [
        'password',
        'token',
        'authorization',
        'cookie',
        'apiKey',
        'creditCard',
        'ssn',
        '*.password',
        '*.token',
        '*.apiKey',
        'headers.authorization',
        'headers.cookie'
      ]
    }
  }
};

/**
 * Initialize application monitoring and reporting
 */
export function initializeMonitoring() {
  logger.info('Initializing production monitoring');
  
  if (!MONITORING_CONFIG.apm.enabled) {
    logger.warn('APM is disabled in configuration');
    return;
  }
  
  try {
    // In a real implementation, this would initialize a monitoring client
    // like New Relic, Datadog, or another APM solution
    
    // Mock implementation for now
    setupMetricsCollection();
    setupHealthChecks();
    
    logger.info('Production monitoring initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize monitoring', error);
  }
}

/**
 * Set up periodic metrics collection
 */
function setupMetricsCollection() {
  if (!MONITORING_CONFIG.metrics.enabled) {
    return;
  }
  
  const interval = setInterval(() => {
    try {
      // Collect and report system metrics
      const metrics = {
        timestamp: new Date().toISOString(),
        cpu: {
          usage: process.cpuUsage(),
          systemLoad: getSystemLoad()
        },
        memory: {
          heapUsed: process.memoryUsage().heapUsed,
          heapTotal: process.memoryUsage().heapTotal,
          rss: process.memoryUsage().rss,
          external: process.memoryUsage().external
        },
        // Additional metrics would be collected here
      };
      
      // In a real implementation, this would send metrics to a monitoring service
      logger.debug('Collected system metrics', { metrics });
    } catch (error) {
      logger.error('Error collecting metrics', error);
    }
  }, MONITORING_CONFIG.metrics.interval);
  
  // Ensure cleanup on process exit
  process.on('exit', () => {
    clearInterval(interval);
  });
}

/**
 * Helper function to get system load
 */
function getSystemLoad(): number[] {
  try {
    const os = require('os');
    return os.loadavg();
  } catch (error) {
    return [0, 0, 0];
  }
}

/**
 * Initialize health check endpoints
 */
function setupHealthChecks() {
  if (!MONITORING_CONFIG.healthChecks.enabled) {
    return;
  }
  
  // This would typically be set up in the main server file
  // by adding health check endpoints based on the configuration
  
  logger.info('Health check endpoints configured', {
    path: MONITORING_CONFIG.healthChecks.path,
    detailedPath: MONITORING_CONFIG.healthChecks.detailedPath
  });
}