import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import websocketService from '../lib/websocketService';
import type { WebSocketMessageType } from '../lib/websocketService';
import logger from '../lib/logger';
import { useToast } from './use-toast';

interface UseRealTimeUpdatesOptions {
  /**
   * ID of the entity to listen for updates (e.g., surveyId, clientId)
   */
  entityId?: string | number;
  
  /**
   * Type of entity (used for filtering messages)
   */
  entityType?: 'survey' | 'client' | 'response' | 'license' | 'analytics';
  
  /**
   * If true, show toast notifications for updates
   */
  showNotifications?: boolean;
  
  /**
   * Override notification titles
   */
  notificationTitles?: Record<WebSocketMessageType, string>;
  
  /**
   * If true, automatically refetch affected queries on relevant updates
   */
  autoRefetchQueries?: boolean;
  
  /**
   * Query keys to refetch on relevant updates
   */
  refetchQueryKeys?: string[];
  
  /**
   * Callback to run on successful connection
   */
  onConnected?: () => void;
  
  /**
   * Callback to run when connection is lost
   */
  onDisconnected?: () => void;
}

/**
 * Default mapping of message types to notification titles
 */
const DEFAULT_NOTIFICATION_TITLES: Record<WebSocketMessageType, string> = {
  surveyResponseReceived: 'New Survey Response',
  surveyUpdate: 'Survey Updated',
  clientUpdate: 'Client Updated',
  collaborationUpdate: 'Collaboration Update',
  collaborationUserJoined: 'User Joined Collaboration',
  collaborationUserLeft: 'User Left Collaboration',
  businessContextUpdate: 'Business Context Updated',
  licenseUpdate: 'License Updated',
  supportTicketUpdate: 'Support Ticket Updated',
  notificationUpdate: 'New Notification',
  systemUpdate: 'System Update',
  connection: 'Connected',
  connectionSuccess: 'Connection Successful',
  connectionError: 'Connection Error',
  ping: 'Ping',
  pong: 'Pong',
  supportAgentTyping: 'Support Agent is Typing',
  surveyAnalyticsUpdate: 'Analytics Updated',
};

/**
 * Map message types to related query keys for automatic refetching
 */
const MESSAGE_TYPE_TO_QUERY_KEYS: Record<WebSocketMessageType, string[]> = {
  surveyResponseReceived: ['/api/survey-responses', '/api/analytics'],
  surveyUpdate: ['/api/surveys'],
  clientUpdate: ['/api/clients'],
  collaborationUpdate: ['/api/collaborations'],
  businessContextUpdate: ['/api/business-contexts'],
  licenseUpdate: ['/api/licenses'],
  supportTicketUpdate: ['/api/support-tickets'],
  notificationUpdate: ['/api/notifications'],
  surveyAnalyticsUpdate: ['/api/analytics'],
  
  // These don't typically require query refetching
  systemUpdate: [],
  connection: [],
  connectionSuccess: [],
  connectionError: [],
  ping: [],
  pong: [],
  supportAgentTyping: [],
  collaborationUserJoined: [],
  collaborationUserLeft: [],
};

/**
 * Hook to integrate real-time updates via WebSocket with React components
 */
export function useRealTimeUpdates(options: UseRealTimeUpdatesOptions = {}) {
  const {
    entityId,
    entityType,
    showNotifications = false,
    notificationTitles = {},
    autoRefetchQueries = true,
    refetchQueryKeys = [],
    onConnected,
    onDisconnected,
  } = options;
  
  const [connectionState, setConnectionState] = useState(websocketService.getConnectionState());
  const [lastUpdate, setLastUpdate] = useState<Record<string, Date>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Helper function to show a toast notification
  const showNotification = useCallback((type: WebSocketMessageType, data: any) => {
    if (!showNotifications) return;
    
    const title = notificationTitles[type] || DEFAULT_NOTIFICATION_TITLES[type] || 'Update Received';
    
    // Extract description from the data if possible
    let description = '';
    if (data) {
      if (data.message) {
        description = data.message;
      } else if (data.description) {
        description = data.description;
      } else if (type === 'surveyResponseReceived') {
        description = `Response #${data.responseId} received for survey #${data.surveyId}`;
      } else if (type === 'collaborationUserJoined') {
        description = `${data.username || 'Someone'} joined the collaboration`;
      }
    }
    
    toast({
      title,
      description,
      duration: 5000,
    });
  }, [showNotifications, notificationTitles, toast]);
  
  // Helper function to refetch related queries
  const refetchRelatedQueries = useCallback((type: WebSocketMessageType, data: any) => {
    if (!autoRefetchQueries) return;
    
    // Get query keys to refetch based on message type
    const queryKeysToRefetch = [
      ...MESSAGE_TYPE_TO_QUERY_KEYS[type] || [],
      ...refetchQueryKeys
    ];
    
    // Add entity-specific query keys if entityId is provided
    if (entityId) {
      if (entityType === 'survey' && type === 'surveyUpdate') {
        queryKeysToRefetch.push(`/api/surveys/${entityId}`);
        queryKeysToRefetch.push(`/api/survey-responses?surveyId=${entityId}`);
      } else if (entityType === 'client' && type === 'clientUpdate') {
        queryKeysToRefetch.push(`/api/clients/${entityId}`);
      }
    }
    
    // Refetch each query
    if (queryKeysToRefetch.length > 0) {
      logger.debug('Refetching queries due to WebSocket update', { 
        type, 
        queryKeysToRefetch,
        entityId,
        entityType
      });
      
      queryKeysToRefetch.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    }
  }, [autoRefetchQueries, entityId, entityType, queryClient, refetchQueryKeys]);
  
  // Subscribe to connection state changes
  useEffect(() => {
    const unsubscribe = websocketService.subscribeToState(state => {
      setConnectionState(state);
      
      if (state === 'connected' && onConnected) {
        onConnected();
      } else if ((state === 'disconnected' || state === 'failed') && onDisconnected) {
        onDisconnected();
      }
    });
    
    return unsubscribe;
  }, [onConnected, onDisconnected]);
  
  // Subscribe to all relevant message types
  useEffect(() => {
    const subscriptions: (() => void)[] = [];
    
    // Subscribe to each message type that might be relevant
    Object.keys(MESSAGE_TYPE_TO_QUERY_KEYS).forEach(type => {
      const messageType = type as WebSocketMessageType;
      
      const unsubscribe = websocketService.subscribe(messageType, data => {
        // Skip processing if this update is for a different entity
        if (entityId && entityType && data.entityType === entityType && data.entityId !== entityId) {
          return;
        }
        
        // Record the last update time for this type
        setLastUpdate(prev => ({
          ...prev,
          [messageType]: new Date()
        }));
        
        // Show notification if enabled
        showNotification(messageType, data);
        
        // Refetch related queries if enabled
        refetchRelatedQueries(messageType, data);
        
        // Log the update
        logger.debug(`Real-time update received: ${messageType}`, { data });
      });
      
      subscriptions.push(unsubscribe);
    });
    
    // Cleanup subscriptions on unmount
    return () => {
      subscriptions.forEach(unsubscribe => unsubscribe());
    };
  }, [entityId, entityType, refetchRelatedQueries, showNotification]);
  
  // Public API
  return {
    connectionState,
    isConnected: connectionState === 'connected',
    isReconnecting: connectionState === 'reconnecting',
    lastUpdate,
    connect: websocketService.connect,
    disconnect: websocketService.disconnect,
    send: websocketService.send,
  };
}

export default useRealTimeUpdates;