import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getQueryFn } from './queryClient';
import { useEffect, useRef, useState } from 'react';
import { isSystemUpdateData, SystemUpdateData } from '@/types/websocket-types';

/**
 * Type definitions for system performance metrics
 */
export interface SystemPerformanceMetrics {
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    usage: number;
  };
  cpu: {
    usage: number;
    cores: number;
  };
  disk: {
    total: number;
    free: number;
    usage: number;
  };
  uptime: number;
  performance: {
    overall: {
      totalRequests: number;
      successfulRequests: number;
      failedRequests: number;
      averageResponseTime: number;
    };
    endpoints: {
      [endpoint: string]: {
        count: number;
        averageResponseTime: number;
        errorRate: number;
      };
    };
  };
  cache: {
    hits: number;
    misses: number;
    size: number;
    groups: {
      [group: string]: number;
    };
  };
  rateLimiter: {
    activeKeys: number;
    limitsByEndpoint: {
      [endpoint: string]: number;
    };
  };
  activeConnections: {
    total: number;
    websockets: number;
    http: number;
  };
  health: {
    status: 'healthy' | 'degraded' | 'down';
    lastCheck: string;
    services: {
      database: {
        status: 'operational' | 'degraded' | 'down';
        connections: number;
        queryTime: number;
      };
      cache: {
        status: 'operational' | 'degraded' | 'down';
        connections: number;
      };
      storage: {
        status: 'operational' | 'degraded' | 'down';
        latency: number;
      };
    };
  };
  timestamp: string;
}

/**
 * Helper to create a WebSocket connection
 */
function createWebSocketConnection(): WebSocket | null {
  try {
    // Determine the correct WebSocket protocol based on page protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('Connecting to WebSocket server at', wsUrl);
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connection established');
      // Send initial connection message
      socket.send(JSON.stringify({
        type: 'connection',
        userId: 0, // Will be replaced with actual user ID in a real app
        role: 'guest', // Will be replaced with actual role in a real app
        timestamp: new Date().toISOString()
      }));
    };
    
    return socket;
  } catch (error) {
    console.error('Failed to create WebSocket connection:', error);
    return null;
  }
}

/**
 * Hook to fetch system performance data with real-time updates via WebSocket
 */
export function useSystemPerformance() {
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const [wsConnectionStatus, setWsConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  
  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    // Create WebSocket connection
    socketRef.current = createWebSocketConnection();
    
    if (socketRef.current) {
      // Handle WebSocket connection success
      socketRef.current.onopen = () => {
        console.log('WebSocket connected');
        setWsConnectionStatus('connected');
      };
      
      // Handle WebSocket messages
      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data.type);
          
          // Handle connection confirmation
          if (data.type === 'connection') {
            console.log('WebSocket authentication successful');
          }
          
          // Handle system update messages
          if (isSystemUpdateData(data)) {
            // Update the query cache with the new system metrics
            if (data.updateType === 'metrics' && (data.cpu || data.memory || data.activeConnections)) {
              queryClient.setQueryData<SystemPerformanceMetrics>(
                ['/api/system/performance'],
                (oldData) => {
                  if (!oldData) return oldData;
                  
                  // Create a new object with the updated metrics
                  return {
                    ...oldData,
                    // Update CPU data if provided
                    ...(data.cpu && { cpu: { ...oldData.cpu, ...data.cpu } }),
                    // Update memory data if provided
                    ...(data.memory && { memory: { ...oldData.memory, ...data.memory } }),
                    // Update active connections if provided
                    ...(data.activeConnections && { 
                      activeConnections: { ...oldData.activeConnections, ...data.activeConnections } 
                    }),
                    // Update health status if provided
                    ...(data.status && { 
                      health: { ...oldData.health, status: data.status } 
                    }),
                    // Update timestamp
                    timestamp: data.timestamp
                  };
                }
              );
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
      
      // Handle WebSocket errors
      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnectionStatus('disconnected');
      };
      
      // Handle WebSocket disconnection
      socketRef.current.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        console.log('WebSocket disconnected');
        setWsConnectionStatus('disconnected');
        
        // Schedule reconnection attempt
        console.log('Scheduling reconnection attempt in 1000ms');
        setTimeout(() => {
          if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
            console.log('Attempting to reconnect WebSocket...');
            socketRef.current = createWebSocketConnection();
          }
        }, 1000); // Quicker reconnection for better user experience
      };
    }
    
    // Set up a periodic check to verify WebSocket connection
    const checkConnectionInterval = setInterval(() => {
      if (socketRef.current) {
        const isConnected = socketRef.current.readyState === WebSocket.OPEN;
        setWsConnectionStatus(isConnected ? 'connected' : 'disconnected');
        
        // If disconnected, try to reconnect
        if (!isConnected && socketRef.current.readyState === WebSocket.CLOSED) {
          console.log('WebSocket connection lost, attempting to reconnect...');
          socketRef.current = createWebSocketConnection();
        }
      }
    }, 10000);
    
    // Clean up WebSocket connection and interval on unmount
    return () => {
      clearInterval(checkConnectionInterval);
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
    };
  }, [queryClient]);
  
  // Use regular HTTP polling as a fallback and initial data load
  const queryResult = useQuery<SystemPerformanceMetrics>({
    queryKey: ['/api/system/performance'],
    queryFn: getQueryFn({
      on401: 'throw',
    }),
    refetchInterval: 30000, // Refetch every 30 seconds for up-to-date metrics
  });
  
  // Return the query result plus the WebSocket connection status
  return {
    ...queryResult,
    wsConnectionStatus,
  };
}
