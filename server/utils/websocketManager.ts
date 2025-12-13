/**
 * WebSocket Connection Manager
 * 
 * This module provides centralized WebSocket connection management
 * including connection limiting, heartbeat monitoring, and resource cleanup.
 */

import { WebSocket, WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import { Logger } from './Logger';
import { createId } from '@paralleldrive/cuid2';
import * as WebSocketLib from 'ws';

const logger = new Logger('WebSocketManager');

// Configuration constants
// const CONNECTION_TIMEOUT_MS = 30000;       // 30 seconds - unused constant
const HEARTBEAT_INTERVAL_MS = 15000;       // 15 seconds
const MAX_CONNECTIONS_PER_IP = process.env.NODE_ENV === 'production' ? 5 : 1000;  // High limit in development
const CONNECTION_POOL_SIZE = process.env.NODE_ENV === 'production' ? 100 : 10000; // High limit in development
const INACTIVE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes of inactivity

// Client connection state
interface ClientConnection {
  id: string;
  ws: WebSocket;
  ip: string;
  userId?: number;
  isAlive: boolean;
  lastActivity: number;
  connectionTime: number;
  closeHandler: () => void;
  messageHandler: (data: WebSocketLib.Data) => void;
}

// Event types
export type ConnectionEvent = 'connect' | 'disconnect' | 'message' | 'error';

/**
 * WebSocket Connection Manager
 * Handles connection pooling, heartbeats, and resource cleanup
 */
export class WebSocketManager extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientConnection> = new Map();
  private ipConnections: Map<string, Set<string>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private initialized = false;
  // private path: string = '/ws'; // Unused but needed for property access
  // private rateLimiter: Map<string, number> = new Map();
  // private connectionCounts: Map<string, number> = new Map();
  // private maxConnectionsPerIP = 3;

  constructor() {
    super();
    // Increase max listeners to prevent warnings
    this.setMaxListeners(20);
  }

  /**
   * Initialize the WebSocket manager
   * @param wss WebSocketServer instance
   * @param path Path for WebSocket connections
   */
  initialize(wss: WebSocketServer, path: string = '/ws') {
    if (this.initialized) {
      logger.warn('WebSocketManager already initialized');
      return;
    }

    this.wss = wss;
    this.initialized = true;
    // Path stored for logging purposes
    console.log(`WebSocket path: ${path}`);

    logger.info(`WebSocketManager initialized with path: ${path}`);
    this.setupHeartbeat();
    this.setupCleanupTask();
  }

  /**
   * Handle a new WebSocket connection
   * @param ws WebSocket instance
   * @param req Request object
   * @param userId Optional user ID for authentication
   * @returns Connection ID if successful, null if connection was rejected
   */
  handleConnection(ws: WebSocket, req: any, userId?: number): string | null {
    if (!this.initialized || !this.wss) {
      logger.error('WebSocketManager not initialized');
      ws.close(1011, 'Server not initialized');
      return null;
    }

    // Get client IP
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    // Check connection limits
    if (this.clients.size >= CONNECTION_POOL_SIZE) {
      logger.warn(`Connection rejected - pool full (${this.clients.size}/${CONNECTION_POOL_SIZE})`);
      ws.close(1013, 'Connection limit reached');
      return null;
    }

    // Check per-IP limits (disabled in development)
    const ipSet = this.ipConnections.get(ip) || new Set();
    if (process.env.NODE_ENV === 'production' && ipSet.size >= MAX_CONNECTIONS_PER_IP) {
      logger.warn(`Connection rejected - too many connections from IP: ${ip}`);
      ws.close(1013, 'Too many connections from this IP');
      return null;
    }

    // Create connection ID and add to tracking
    const connectionId = createId();
    const now = Date.now();

    // Create message handler bound to this connection
    const messageHandler = (data: WebSocketLib.Data) => {
      this.handleMessage(connectionId, data);
    };

    // Create close handler bound to this connection
    const closeHandler = () => {
      this.removeConnection(connectionId);
    };

    // Create error handler bound to this connection
    const errorHandler = (error: Error) => {
      logger.error(`WebSocket error for connection ${connectionId}`, { error });
      this.removeConnection(connectionId);
    };

    // Add event listeners
    ws.on('message', messageHandler);
    ws.on('close', closeHandler);
    ws.on('error', errorHandler);
    ws.on('pong', () => this.heartbeat(connectionId));

    // Add connection to tracking
    const client: ClientConnection = {
      id: connectionId,
      ws,
      ip,
      userId,
      isAlive: true,
      lastActivity: now,
      connectionTime: now,
      closeHandler,
      messageHandler
    };

    this.clients.set(connectionId, client);

    // Update IP tracking
    ipSet.add(connectionId);
    this.ipConnections.set(ip, ipSet);

    // Set initial ping 
    this.heartbeat(connectionId);

    // Log connection
    logger.info(`WebSocket client connected: ${connectionId} from ${ip}`);

    // Emit connect event
    this.emit('connect', { connectionId, ip, userId });

    return connectionId;
  }

  /**
   * Refresh the heartbeat for a connection
   * @param connectionId Connection ID to update
   */
  private heartbeat(connectionId: string) {
    const client = this.clients.get(connectionId);
    if (client) {
      client.isAlive = true;
      client.lastActivity = Date.now();
    }
  }

  /**
   * Handle an incoming message from a client
   * @param connectionId Connection ID
   * @param data Message data
   */
  private handleMessage(connectionId: string, data: WebSocketLib.Data) {
    const client = this.clients.get(connectionId);
    if (!client) {
      logger.warn(`Message received from unknown connection: ${connectionId}`);
      return;
    }

    // Update last activity time
    client.lastActivity = Date.now();

    // Parse message (assuming JSON)
    let message;
    try {
      if (typeof data === 'string') {
        message = JSON.parse(data);
      } else if (data instanceof Buffer) {
        message = JSON.parse(data.toString());
      } else {
        // Handle array of Buffer/Uint8Array (WebSocket data chunks)
        const buffer = Buffer.concat(data as Uint8Array[]);
        message = JSON.parse(buffer.toString());
      }
    } catch (error) {
      logger.warn(`Invalid message format from ${connectionId}`, { error });
      return;
    }

    // Emit message event
    this.emit('message', { connectionId, userId: client.userId, message });
  }

  /**
   * Set up the heartbeat interval
   */
  private setupHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (!this.clients.size) return;

      // Check all clients
      for (const [connectionId, client] of this.clients.entries()) {
        if (!client.isAlive) {
          logger.debug(`Terminating inactive connection: ${connectionId}`);
          this.removeConnection(connectionId);
          continue;
        }

        // Mark as not alive, will be reset by pong
        client.isAlive = false;

        // Send ping (will expect pong back)
        try {
          client.ws.ping();
        } catch (error) {
          logger.error(`Error sending ping to ${connectionId}`, { error });
          this.removeConnection(connectionId);
        }
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  /**
   * Set up the inactive connection cleanup task
   */
  private setupCleanupTask() {
    this.cleanupInterval = setInterval(() => {
      if (!this.clients.size) return;

      const now = Date.now();

      // Check all clients for inactivity
      for (const [connectionId, client] of this.clients.entries()) {
        const inactiveTime = now - client.lastActivity;

        if (inactiveTime > INACTIVE_TIMEOUT_MS) {
          logger.debug(`Closing inactive connection: ${connectionId} (inactive for ${Math.round(inactiveTime / 1000)}s)`);
          this.removeConnection(connectionId);
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Remove a connection and clean up resources
   * @param connectionId Connection ID to remove
   */
  removeConnection(connectionId: string) {
    const client = this.clients.get(connectionId);
    if (!client) return;

    // Remove event listeners
    client.ws.removeListener('message', client.messageHandler);
    client.ws.removeListener('close', client.closeHandler);

    // Clean up IP tracking
    const ipSet = this.ipConnections.get(client.ip);
    if (ipSet) {
      ipSet.delete(connectionId);
      if (ipSet.size === 0) {
        this.ipConnections.delete(client.ip);
      } else {
        this.ipConnections.set(client.ip, ipSet);
      }
    }

    // Try to close socket if still open
    try {
      if (client.ws.readyState === WebSocketLib.WebSocket.OPEN) {
        client.ws.close();
      }
    } catch (error) {
      logger.error(`Error closing WebSocket for ${connectionId}`, { error });
    }

    // Remove from tracking
    this.clients.delete(connectionId);

    // Emit disconnect event
    this.emit('disconnect', { connectionId, ip: client.ip, userId: client.userId });

    logger.info(`WebSocket client disconnected: ${connectionId}`);
  }

  /**
   * Send a message to a specific client
   * @param connectionId Connection ID to send to
   * @param message Message to send
   * @returns true if sent successfully, false otherwise
   */
  sendToClient(connectionId: string, message: any): boolean {
    const client = this.clients.get(connectionId);
    if (!client || client.ws.readyState !== WebSocketLib.WebSocket.OPEN) {
      return false;
    }

    try {
      client.ws.send(JSON.stringify(message));
      client.lastActivity = Date.now();
      return true;
    } catch (error) {
      logger.error(`Error sending message to ${connectionId}`, { error });
      this.removeConnection(connectionId);
      return false;
    }
  }

  /**
   * Broadcast a message to all connected clients
   * @param message Message to broadcast
   * @param filter Optional filter function to select clients
   * @returns Number of clients the message was sent to
   */
  broadcast(message: any, filter?: (client: { id: string, userId?: number, ip: string }) => boolean): number {
    if (!this.clients.size) return 0;

    let sentCount = 0;
    const serializedMessage = JSON.stringify(message);

    for (const [connectionId, client] of this.clients.entries()) {
      // Skip if filter provided and client doesn't match
      if (filter && !filter({ id: connectionId, userId: client.userId, ip: client.ip })) {
        continue;
      }

      // Skip if connection not open
      if (client.ws.readyState !== WebSocketLib.WebSocket.OPEN) {
        continue;
      }

      try {
        client.ws.send(serializedMessage);
        client.lastActivity = Date.now();
        sentCount++;
      } catch (error) {
        logger.error(`Error broadcasting to ${connectionId}`, { error });
        this.removeConnection(connectionId);
      }
    }

    return sentCount;
  }

  /**
   * Get active connection count
   * @returns Number of active connections
   */
  getConnectionCount(): number {
    return this.clients.size;
  }

  /**
   * Get active connections by user ID
   * @param userId User ID to filter by
   * @returns Array of connection IDs
   */
  getConnectionsByUserId(userId: number): string[] {
    const connectionIds: string[] = [];

    for (const [connectionId, client] of this.clients.entries()) {
      if (client.userId === userId) {
        connectionIds.push(connectionId);
      }
    }

    return connectionIds;
  }

  /**
   * Get connection metrics
   */
  getMetrics() {
    const uniqueIps = this.ipConnections.size;
    const uniqueUsers = new Set<number>();

    // Count unique user IDs
    for (const client of this.clients.values()) {
      if (client.userId) {
        uniqueUsers.add(client.userId);
      }
    }

    return {
      totalConnections: this.clients.size,
      uniqueIps,
      uniqueUsers: uniqueUsers.size,
      connectionPool: {
        used: this.clients.size,
        total: CONNECTION_POOL_SIZE,
        utilization: Math.round((this.clients.size / CONNECTION_POOL_SIZE) * 100)
      }
    };
  }

  /**
   * Clean up resources when shutting down
   */
  shutdown() {
    logger.info('Shutting down WebSocketManager');

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Close all connections
    for (const connectionId of this.clients.keys()) {
      this.removeConnection(connectionId);
    }

    this.initialized = false;
  }
}

// Export singleton instance
export const websocketManager = new WebSocketManager();