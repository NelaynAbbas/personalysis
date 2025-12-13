import { useState, useEffect, useCallback } from 'react';
import websocketService from '../lib/websocketService';
import type { WebSocketMessageType } from '../lib/websocketService';
import logger from '../lib/logger';

type WebSocketConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed';

/**
 * Hook to use WebSocket connection in React components
 * Provides connection state, message subscription, and send function
 */
export function useWebSocket() {
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>(
    websocketService.getConnectionState()
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    websocketService.isAuthenticated()
  );
  
  // Update connection state when it changes
  useEffect(() => {
    const unsubscribe = websocketService.subscribeToState(state => {
      setConnectionState(state);
      setIsAuthenticated(websocketService.isAuthenticated());
    });
    
    return unsubscribe;
  }, []);
  
  /**
   * Subscribe to WebSocket messages of a specific type
   */
  const subscribe = useCallback(<T = any>(
    messageType: WebSocketMessageType,
    callback: (data: T) => void
  ) => {
    logger.debug(`Subscribing to WebSocket message type: ${messageType}`);
    return websocketService.subscribe(messageType, callback);
  }, []);
  
  /**
   * Send a message to the WebSocket server
   */
  const send = useCallback((message: any): boolean => {
    return websocketService.send(message);
  }, []);
  
  /**
   * Manually connect to the WebSocket server
   */
  const connect = useCallback(() => {
    logger.info('Manually connecting to WebSocket');
    websocketService.connect();
  }, []);
  
  /**
   * Manually disconnect from the WebSocket server
   */
  const disconnect = useCallback(() => {
    logger.info('Manually disconnecting from WebSocket');
    websocketService.disconnect();
  }, []);
  
  return {
    connectionState,
    isConnected: connectionState === 'connected',
    isReconnecting: connectionState === 'reconnecting',
    isAuthenticated,
    subscribe,
    send,
    connect,
    disconnect
  };
}

/**
 * Hook to subscribe to a specific type of WebSocket message
 */
export function useWebSocketMessage<T = any>(
  messageType: WebSocketMessageType,
  initialValue?: T
) {
  const [data, setData] = useState<T | undefined>(initialValue);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { subscribe, connectionState, isAuthenticated } = useWebSocket();
  
  useEffect(() => {
    const unsubscribe = subscribe<T>(messageType, (message) => {
      setData(message);
      setLastUpdated(new Date());
      logger.debug(`Received WebSocket message of type: ${messageType}`, { message });
    });
    
    return unsubscribe;
  }, [messageType, subscribe]);
  
  return {
    data,
    lastUpdated,
    connectionState,
    isConnected: connectionState === 'connected',
    isAuthenticated
  };
}

export default useWebSocket;