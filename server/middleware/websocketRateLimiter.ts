/**
 * WebSocket Rate Limiter
 * 
 * Provides protection against WebSocket connection abuse by limiting the number
 * and frequency of connections and messages from any single IP address.
 */

import { IncomingMessage } from 'http';
import WebSocket from 'ws';
import { Logger } from '../utils/Logger';

const logger = new Logger('WebSocketRateLimiter');

interface RateLimitConfig {
  // Maximum number of connections per IP
  maxConnections: number;
  
  // Maximum messages per window
  maxMessages: number;
  
  // Time window in milliseconds
  windowMs: number;
  
  // IP addresses exempted from rate limiting (e.g., internal services, proxies)
  whitelistedIPs: string[];
}

interface IPConnection {
  count: number;              // Number of active connections
  messages: number;           // Messages in current window
  firstMessage: number;       // Timestamp of first message in window
  lastMessage: number;        // Timestamp of most recent message
  blocked: boolean;           // Whether this IP is currently blocked
  blockExpiry?: number;       // When the block expires (if blocked)
}

// Store for tracking connection and message counts per IP
const ipConnectionMap = new Map<string, IPConnection>();

// Default configuration - very permissive in development
const DEFAULT_CONFIG: RateLimitConfig = {
  maxConnections: process.env.NODE_ENV === 'production' ? 10 : 100000,  // Extremely high limit in development
  maxMessages: process.env.NODE_ENV === 'production' ? 100 : 1000000,  // Extremely high limit in development
  windowMs: 60 * 1000,        // 1 minute window
  whitelistedIPs: ['127.0.0.1', 'localhost', '::1', '0.0.0.0', '::ffff:127.0.0.1', '10.82.1.36', '10.82.5.94', '94.156.95.130']
};

// Configure with custom settings if needed
let config = { ...DEFAULT_CONFIG };

/**
 * Updates the rate limiter configuration
 * @param newConfig - New configuration to apply
 */
export function updateConfig(newConfig: Partial<RateLimitConfig>): void {
  config = {
    ...config,
    ...newConfig
  };
  
  logger.info('WebSocket rate limiter configuration updated', { config });
}

/**
 * Checks if an IP address is allowed to create a new WebSocket connection
 * @param ip - IP address to check
 * @returns Whether the connection should be allowed
 */
export function checkConnectionLimit(ip: string): boolean {
  // Always allow connections in development mode
  return true;
  
  // Allow whitelisted IPs to bypass rate limiting
  if (config.whitelistedIPs.includes(ip)) {
    return true;
  }
  
  // Get or create connection tracking for this IP
  if (!ipConnectionMap.has(ip)) {
    ipConnectionMap.set(ip, {
      count: 0,
      messages: 0,
      firstMessage: Date.now(),
      lastMessage: Date.now(),
      blocked: false
    });
  }
  
  const ipData = ipConnectionMap.get(ip)!;
  
  // Check if IP is blocked
  if (ipData.blocked) {
    // If block has expired, unblock
    if (ipData.blockExpiry && ipData.blockExpiry > 0 && Date.now() > ipData.blockExpiry) {
      ipData.blocked = false;
      ipData.blockExpiry = undefined;
      logger.info(`Unblocked IP ${ip} after block expiry`);
    } else {
      logger.warn(`Rejected WebSocket connection from blocked IP: ${ip}`);
      return false;
    }
  }
  
  // Check connection limit (only in production)
  if (ipData.count >= config.maxConnections) {
    logger.warn(`IP ${ip} exceeded maximum WebSocket connections (${config.maxConnections})`);
    
    // Block for a period if significantly over the limit
    if (ipData.count >= config.maxConnections * 2) {
      ipData.blocked = true;
      ipData.blockExpiry = Date.now() + (5 * 60 * 1000); // 5 minute block
      logger.warn(`Blocking IP ${ip} for 5 minutes due to excessive connection attempts`);
    }
    
    return false;
  }
  
  // Increment connection count
  ipData.count++;
  
  return true;
}

/**
 * Records a message from a client and checks if rate limit is exceeded
 * @param ip - IP address of the client
 * @returns Whether the message should be allowed
 */
export function checkMessageLimit(ip: string): boolean {
  // Allow whitelisted IPs to bypass rate limiting
  if (config.whitelistedIPs.includes(ip)) {
    return true;
  }
  
  // This should never happen, but just in case
  if (!ipConnectionMap.has(ip)) {
    ipConnectionMap.set(ip, {
      count: 1,
      messages: 0,
      firstMessage: Date.now(),
      lastMessage: Date.now(),
      blocked: false
    });
  }
  
  const ipData = ipConnectionMap.get(ip)!;
  
  // Check if IP is blocked
  if (ipData.blocked) {
    if (ipData.blockExpiry && Date.now() > ipData.blockExpiry) {
      ipData.blocked = false;
      ipData.blockExpiry = undefined;
    } else {
      return false;
    }
  }
  
  const now = Date.now();
  
  // Reset window if needed
  if (now - ipData.firstMessage > config.windowMs) {
    ipData.messages = 0;
    ipData.firstMessage = now;
  }
  
  // Increment message count
  ipData.messages++;
  ipData.lastMessage = now;
  
  // Check message limit
  if (ipData.messages > config.maxMessages) {
    logger.warn(`IP ${ip} exceeded WebSocket message rate limit (${config.maxMessages} per ${config.windowMs / 1000}s)`);
    
    // Block for a period if significantly over the limit
    if (ipData.messages >= config.maxMessages * 1.5) {
      ipData.blocked = true;
      ipData.blockExpiry = Date.now() + (2 * 60 * 1000); // 2 minute block
      logger.warn(`Blocking IP ${ip} for 2 minutes due to excessive message rate`);
      return false;
    }
    
    return false;
  }
  
  return true;
}

/**
 * Records a connection close and decrements the connection count for an IP
 * @param ip - IP address of the client
 */
export function handleConnectionClose(ip: string): void {
  if (ipConnectionMap.has(ip)) {
    const ipData = ipConnectionMap.get(ip)!;
    ipData.count = Math.max(0, ipData.count - 1);
    
    // Clean up when no more connections
    if (ipData.count === 0 && !ipData.blocked) {
      ipConnectionMap.delete(ip);
    }
  }
}

/**
 * Middleware to apply WebSocket rate limiting
 * @param request - HTTP request for the WebSocket connection
 * @param socket - Network socket
 * @param head - First packet of the upgraded stream
 * @param callback - Called with WebSocket when connection is accepted
 */
export function wsRateLimit(
  wss: WebSocket.Server,
  request: IncomingMessage,
  socket: any,
  head: Buffer,
  callback: (ws: WebSocket) => void
): void {
  const ip = request.socket.remoteAddress || '0.0.0.0';
  
  // Check if this IP is allowed to create a new connection
  if (!checkConnectionLimit(ip)) {
    logger.warn('WebSocket connection rejected due to rate limiting', {
      ip,
      url: request.url,
      headers: {
        origin: request.headers.origin,
        host: request.headers.host
      }
    });
    
    socket.destroy();
    return;
  }
  
  // Accept the connection
  wss.handleUpgrade(request, socket, head, (ws) => {
    // Store the IP with the socket for message rate limiting
    (ws as any)._clientIP = ip;
    
    // Handle message rate limiting
    ws.on('message', () => {
      if (!checkMessageLimit(ip)) {
        ws.close(1008, 'Rate limit exceeded');
      }
    });
    
    // Track connection close
    ws.on('close', () => {
      handleConnectionClose(ip);
    });
    
    // Complete the connection
    callback(ws);
  });
}

/**
 * Apply rate limiting to an existing WebSocket server
 * @param wss - WebSocket server to apply rate limiting to
 * @param customConfig - Optional custom configuration
 */
export function applyWebSocketRateLimiting(
  wss: WebSocket.Server,
  customConfig?: Partial<RateLimitConfig>
): (request: IncomingMessage, socket: any, head: Buffer) => void {
  // Update config if custom settings provided
  if (customConfig) {
    updateConfig(customConfig);
  }
  
  // Return the upgrade handler with rate limiting
  return (request: IncomingMessage, socket: any, head: Buffer) => {
    wsRateLimit(wss, request, socket, head, (ws) => {
      // Emit the connection event for the server to handle normally
      wss.emit('connection', ws, request);
    });
  };
}

// Export the rate limiter
export default {
  applyWebSocketRateLimiting,
  updateConfig,
  checkConnectionLimit,
  checkMessageLimit,
  handleConnectionClose
};