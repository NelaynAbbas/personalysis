import logger from './logger';
import { updateQueryCache } from './queryClient';
import { performLogout } from './logout';

// WebSocket connection states
type WebSocketConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed';

// WebSocket message types
export type WebSocketMessageType = 
  | 'connection' 
  | 'connectionSuccess'
  | 'connectionError'
  | 'systemUpdate'
  | 'surveyResponseReceived'
  | 'collaborationUpdate'
  | 'collaborationUserJoined'
  | 'collaborationUserLeft'
  | 'supportAgentTyping'
  | 'surveyAnalyticsUpdate'
  | 'businessContextUpdate'
  | 'surveyUpdate'
  | 'licenseUpdate'
  | 'supportTicketUpdate'
  | 'notificationUpdate'
  | 'clientUpdate'
  | 'ping'
  | 'pong';

interface WebSocketMessage {
  type: WebSocketMessageType;
  [key: string]: any;
}

// Configurable options
const WS_RECONNECT_DELAY_MS = 5000; // Start with 5 seconds (less aggressive)
const WS_MAX_RECONNECT_DELAY_MS = 60000; // Max 60 seconds
const WS_RECONNECT_BACKOFF_FACTOR = 2.0; // Exponential backoff
const WS_PING_INTERVAL_MS = 60000; // 60 seconds (less frequent)
const WS_PONG_TIMEOUT_MS = 15000; // 15 seconds
const WS_MAX_RECONNECT_ATTEMPTS = 10; // Limit reconnection attempts

class WebSocketService {
  private socket: WebSocket | null = null;
  private connectionState: WebSocketConnectionState = 'disconnected';
  private connectionId: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: number | null = null;
  private pingInterval: number | null = null;
  private pongTimeout: number | null = null;
  private messageListeners: Map<WebSocketMessageType, Set<(data: any) => void>> = new Map();
  private stateChangeListeners: Set<(state: WebSocketConnectionState) => void> = new Set();
  private authenticated = false;

  constructor() {
    // Start connection when service is initialized
    this.connect();

    // Listen for online/offline events to reconnect when network changes
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Listen for visibility changes to reconnect when tab becomes visible
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    logger.info('WebSocket service initialized');
  }

  /**
   * Connect to the WebSocket server
   */
  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) {
      logger.debug('WebSocket already connected or connecting');
      return;
    }

    this.updateConnectionState('connecting');

    try {
      // Determine the correct WebSocket protocol based on page protocol
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      logger.info('Connecting to WebSocket server at', { url: wsUrl });
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      logger.error('Failed to create WebSocket connection:', { error });
      this.updateConnectionState('failed');
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    this.clearTimers();
    
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.close();
      }
      
      this.socket = null;
    }
    
    this.updateConnectionState('disconnected');
    this.authenticated = false;
    this.connectionId = null;
    logger.info('WebSocket disconnected');
  }

  /**
   * Send a message to the WebSocket server
   */
  public send(message: any): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      logger.warn('Cannot send message - WebSocket not connected');
      return false;
    }

    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      this.socket.send(messageStr);
      return true;
    } catch (error) {
      logger.error('Failed to send WebSocket message:', { error, message });
      return false;
    }
  }

  /**
   * Subscribe to WebSocket messages of a specific type
   */
  public subscribe(messageType: WebSocketMessageType, callback: (data: any) => void): () => void {
    if (!this.messageListeners.has(messageType)) {
      this.messageListeners.set(messageType, new Set());
    }
    
    this.messageListeners.get(messageType)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.messageListeners.get(messageType);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.messageListeners.delete(messageType);
        }
      }
    };
  }

  /**
   * Subscribe to connection state changes
   */
  public subscribeToState(callback: (state: WebSocketConnectionState) => void): () => void {
    this.stateChangeListeners.add(callback);
    
    // Immediately call with current state
    callback(this.connectionState);
    
    // Return unsubscribe function
    return () => {
      this.stateChangeListeners.delete(callback);
    };
  }

  /**
   * Get current connection state
   */
  public getConnectionState(): WebSocketConnectionState {
    return this.connectionState;
  }

  /**
   * Check if the connection is authenticated
   */
  public isAuthenticated(): boolean {
    return this.authenticated;
  }

  /**
   * Get the connection ID (if authenticated)
   */
  public getConnectionId(): string | null {
    return this.connectionId;
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.reconnectTimeout !== null) {
      window.clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.pingInterval !== null) {
      window.clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.pongTimeout !== null) {
      window.clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout !== null) {
      window.clearTimeout(this.reconnectTimeout);
    }
    
    // Stop reconnecting after max attempts
    if (this.reconnectAttempts >= WS_MAX_RECONNECT_ATTEMPTS) {
      logger.warn(`Maximum reconnection attempts (${WS_MAX_RECONNECT_ATTEMPTS}) reached, stopping reconnection`);
      this.updateConnectionState('failed');
      return;
    }
    
    this.reconnectAttempts++;
    
    // Calculate delay with exponential backoff
    const delay = Math.min(
      WS_RECONNECT_DELAY_MS * Math.pow(WS_RECONNECT_BACKOFF_FACTOR, this.reconnectAttempts - 1),
      WS_MAX_RECONNECT_DELAY_MS
    );
    
    logger.info(`Scheduling reconnection attempt in ${Math.round(delay)}ms`, { attempt: this.reconnectAttempts });
    this.updateConnectionState('reconnecting');
    
    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, delay);
  }

  /**
   * Start ping/pong heartbeat
   */
  private startHeartbeat(): void {
    this.clearTimers();
    
    // Send ping every WS_PING_INTERVAL_MS
    this.pingInterval = window.setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: new Date().toISOString() });
        
        // Set timeout for pong response
        this.pongTimeout = window.setTimeout(() => {
          logger.warn('WebSocket pong timeout, reconnecting');
          this.disconnect();
          this.connect();
        }, WS_PONG_TIMEOUT_MS);
      }
    }, WS_PING_INTERVAL_MS);
  }

  /**
   * Update connection state and notify listeners
   */
  private updateConnectionState(state: WebSocketConnectionState): void {
    if (this.connectionState === state) return;
    
    this.connectionState = state;
    logger.info(`WebSocket connection state: ${state}`);
    
    // Notify all state change listeners
    this.stateChangeListeners.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        logger.error('Error in WebSocket state change listener', { error });
      }
    });
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(event: Event): void {
    logger.info('WebSocket connection established');
    this.updateConnectionState('connected');
    this.reconnectAttempts = 0;
    
    // Send initial connection message
    this.send({
      type: 'connection',
      userId: this.getUserId(),
      role: this.getUserRole(),
      timestamp: new Date().toISOString()
    });
    
    // Start heartbeat
    this.startHeartbeat();
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      logger.debug('Received WebSocket message:', { message });
      
      // Handle connection error messages (authentication failures)
      if (message.type === 'connectionError') {
        const errorMessage = (message as any).message || '';
        const isAuthError = 
          errorMessage.toLowerCase().includes('authentication') ||
          errorMessage.toLowerCase().includes('unauthorized') ||
          errorMessage.toLowerCase().includes('session expired') ||
          errorMessage.toLowerCase().includes('invalid session') ||
          (message as any).code === 401;
        
        if (isAuthError) {
          logger.warn('WebSocket authentication error received, logging out user');
          performLogout({
            showToast: true,
            reason: 'Your session has expired. Please log in again.',
            redirectTo: '/'
          });
          return;
        }
      }
      
      // Handle pong response
      if (message.type === 'pong') {
        if (this.pongTimeout !== null) {
          window.clearTimeout(this.pongTimeout);
          this.pongTimeout = null;
        }
        return;
      }
      
      // Handle connection success
      if (message.type === 'connectionSuccess') {
        this.authenticated = true;
        this.connectionId = message.connectionId;
        logger.info('WebSocket authentication successful');
      }
      
      // Update query cache for real-time data
      if (this.isDataUpdateMessage(message.type)) {
        updateQueryCache(message.type, message);
      }
      
      // Notify all listeners for this message type
      const listeners = this.messageListeners.get(message.type);
      if (listeners) {
        listeners.forEach(callback => {
          try {
            callback(message);
          } catch (error) {
            logger.error('Error in WebSocket message listener', { error, messageType: message.type });
          }
        });
      }
    } catch (error) {
      logger.error('Error parsing WebSocket message', { error, data: event.data });
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    logger.info('WebSocket connection closed:', { code: event.code, reason: event.reason });
    this.updateConnectionState('disconnected');
    this.authenticated = false;
    this.connectionId = null;
    this.clearTimers();
    
    // Check if this is an authentication error
    // WebSocket close codes:
    // 1008 = Policy violation (often used for auth failures)
    // 1003 = Unsupported data (can be used for auth failures)
    // 4001-4003 = Custom authentication error codes (if server uses them)
    const isAuthError = 
      event.code === 1008 || 
      event.code === 1003 ||
      (event.code >= 4001 && event.code <= 4003) ||
      event.reason?.toLowerCase().includes('authentication') ||
      event.reason?.toLowerCase().includes('unauthorized') ||
      event.reason?.toLowerCase().includes('session expired') ||
      event.reason?.toLowerCase().includes('invalid session');
    
    if (isAuthError) {
      logger.warn('WebSocket closed due to authentication error, logging out user');
      // Don't reconnect on auth errors - logout instead
      performLogout({
        showToast: true,
        reason: 'Your session has expired. Please log in again.',
        redirectTo: '/'
      });
      return;
    }
    
    // Schedule reconnect if not closed by us and not an auth error
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    logger.error('WebSocket error:', { event });
    // No need to update state or reconnect here, the close event will follow
  }

  /**
   * Handle browser coming online
   */
  private handleOnline(): void {
    logger.info('Browser came online, reconnecting WebSocket');
    this.disconnect();
    this.connect();
  }

  /**
   * Handle browser going offline
   */
  private handleOffline(): void {
    logger.info('Browser went offline, disconnecting WebSocket');
    this.disconnect();
  }

  /**
   * Handle visibility change
   */
  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      // Check if connection is still valid when tab becomes visible
      if (this.socket?.readyState !== WebSocket.OPEN) {
        logger.info('Tab became visible, reconnecting WebSocket');
        this.disconnect();
        this.connect();
      }
    }
  }

  /**
   * Check if message type is a data update that should trigger query invalidation
   */
  private isDataUpdateMessage(type: WebSocketMessageType): boolean {
    return [
      'surveyUpdate',
      'surveyResponseReceived',
      'collaborationUpdate',
      'surveyAnalyticsUpdate',
      'businessContextUpdate',
      'licenseUpdate',
      'supportTicketUpdate',
      'notificationUpdate',
      'clientUpdate'
    ].includes(type);
  }

  /**
   * Get current user ID from localStorage
   */
  private getUserId(): number {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id || 0;
      }
    } catch (e) {
      // Ignore errors
    }
    return 0;
  }

  /**
   * Get current user role from localStorage
   */
  private getUserRole(): string {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.role || 'guest';
      }
    } catch (e) {
      // Ignore errors
    }
    return 'guest';
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

/**
 * Get the websocket service singleton instance
 * This function ensures consistent access to the WebSocket service
 */
export function getWebSocketService(): WebSocketService {
  return webSocketService;
}

export default webSocketService;