/**
 * Production Environment Configuration
 * 
 * This file defines environment variables for the production environment.
 * NOTE: Sensitive values should be stored in environment variables
 * and NOT committed to version control. The values here are just placeholders.
 */

export const productionEnv = {
  // Server configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: 'production',
  HOST: process.env.HOST || '0.0.0.0',
  
  // API configuration
  API_VERSION: 'v1',
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100, // 100 requests per window
  
  // Database configuration
  DATABASE_URL: process.env.DATABASE_URL, // Required in production
  
  // Authentication and session
  SESSION_SECRET: process.env.SESSION_SECRET || 'production-session-secret-change-this', // Should always be overridden
  JWT_SECRET: process.env.JWT_SECRET || 'production-jwt-secret-change-this', // Should always be overridden
  JWT_EXPIRY: '24h', // Token expiration
  
  // CORS configuration
  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS || 'https://example.com',
  
  // Cache configuration
  CACHE_TTL: 3600, // 1 hour in seconds
  
  // Security
  BCRYPT_SALT_ROUNDS: 12,
  
  // Logging configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FORMAT: 'combined',
  
  // Google Gemini API
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  
  // Email configuration
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@example.com',
  
  // Monitoring and metrics
  ENABLE_PERFORMANCE_MONITORING: true,
  
  // File storage
  STORAGE_LOCATION: process.env.STORAGE_LOCATION || './uploads',
  MAX_UPLOAD_SIZE_MB: 10, // 10 MB
  
  // Error reporting
  SENTRY_DSN: process.env.SENTRY_DSN,
};