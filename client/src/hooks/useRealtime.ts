import { useState, useEffect, useRef } from 'react';
import { getWebSocketService } from '@/lib/websocketService';
import { updateQueryCache } from '@/lib/queryClient';

type WebSocketMessageType = 'connection' | 'surveyResponseReceived' | 'collaborationUpdate' | 'supportAgentTyping' | 'surveyAnalyticsUpdate' | 'systemUpdate' | 'businessContextUpdate' | 'surveyUpdate' | 'surveyStatusUpdate' | 'licenseUpdate' | 'usageUpdate' | 'supportTicketUpdate' | 'notificationUpdate';

type SurveyResponseReceivedData = {
  responseId: number;
  surveyId: number;
  userId?: number;
  isAnonymous: boolean;
  isComplete: boolean;
  completionTimeSeconds?: number;
  timestamp: string;
};

type CollaborationUserData = {
  userId: number;
  username: string;
  entityId: string | number;
  entityType: string;
  action: 'join' | 'leave' | 'edit' | 'comment';
  timestamp: string;
  position?: { x: number; y: number };
  editingField?: string;
  commentText?: string;
};

type SupportAgentTypingData = {
  agentId: number;
  agentName: string;
  ticketId: number;
  isTyping: boolean;
  timestamp: string;
};

type SurveyAnalyticsUpdateData = {
  type: 'surveyAnalyticsUpdate';
  surveyId: number;
  metrics: {
    totalResponses: number;
    completionRate: number;
    averageRating: number;
    uniqueRespondents: number;
    lastResponseTime: string;
    averageCompletionTime: number;
  };
  demographics?: {
    ageGroups: Record<string, number>;
    genders: Record<string, number>;
    regions: Record<string, number>;
  };
  responseRates?: {
    hourly: Record<string, number>;
    daily: Record<string, number>;
    weekly: Record<string, number>;
  };
  timestamp: string;
};

type ConnectionData = {
  connected: boolean;
  timestamp: string;
  message?: string;
};

type BusinessContextUpdateData = {
  contextId: number;
  action: 'create' | 'update' | 'delete';
  userId?: number;
  timestamp: string;
};

type SurveyUpdateData = {
  surveyId: number;
  action: 'create' | 'update' | 'delete' | 'publish' | 'close';
  userId?: number;
  timestamp: string;
};

type LicenseUpdateData = {
  type: 'licenseUpdate';
  companyId?: number;
  licenseId: number;
  license?: any;
  action?: 'validation_success' | 'validation_failed' | 'update' | 'expire';
  message?: string;
  timestamp: string;
};

type UsageUpdateData = {
  type: 'usageUpdate';
  companyId?: number;
  surveyId?: number;
  timestamp: string;
};

type SupportTicketUpdateData = {
  ticketId: number;
  action: 'create' | 'update' | 'comment' | 'status_change' | 'assignment';
  userId?: number;
  agentId?: number;
  status?: string;
  timestamp: string;
};

type NotificationData = {
  id: number;
  title?: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
};

type SystemUpdateData = {
  type: 'systemUpdate';
  updateType: 'metrics' | 'error' | 'status';
  cpu?: {
    usage: number;
  };
  memory?: {
    usage: number;
    heapUsed: number;
    heapTotal: number;
  };
  activeConnections?: {
    total: number;
    websocket: number;
    http: number;
  };
  status?: 'healthy' | 'degraded' | 'critical';
  errorCount?: number;
  timestamp: string;
};

type MessageHandler<T> = (data: T) => void;

// Define a mapping of message types to their data shapes
type MessageTypes = {
  surveyResponseReceived: SurveyResponseReceivedData;
  collaborationUpdate: CollaborationUserData;
  supportAgentTyping: SupportAgentTypingData;
  surveyAnalyticsUpdate: SurveyAnalyticsUpdateData;
  systemUpdate: SystemUpdateData;
  connection: ConnectionData;
  businessContextUpdate: BusinessContextUpdateData;
  surveyUpdate: SurveyUpdateData;
  surveyStatusUpdate: SurveyUpdateData;
  licenseUpdate: LicenseUpdateData;
  usageUpdate: UsageUpdateData;
  supportTicketUpdate: SupportTicketUpdateData;
  notificationUpdate: NotificationData;
}

/**
 * Hook for handling real-time WebSocket communication with type safety
 * @param messageType The type of message to listen for
 * @param onMessage Callback to handle incoming messages of the specified type
 * @param invalidateQueryKeys Optional array of query keys to invalidate when a message is received
 * @returns Object with connection status and methods to interact with the WebSocket
 */
export function useRealtime<T extends WebSocketMessageType>(
  messageType: T,
  onMessage: MessageHandler<MessageTypes[T]>,
  invalidateQueryKeys: string[] = []
) {
  const [connected, setConnected] = useState(false);
  const wsService = getWebSocketService();
  const handlerRef = useRef(onMessage);
  
  // Update handler reference when the callback changes
  useEffect(() => {
    handlerRef.current = onMessage;
  }, [onMessage]);
  
  useEffect(() => {
    // Handle incoming WebSocket messages
    const handleMessage = (event: MessageEvent) => {
      // Parse the message data
      try {
        const data = JSON.parse(event.data);
        
        // Only process messages of the specified type
        if (data.type === messageType) {
          // Process the message data - pass the full data object (not data.data)
          handlerRef.current(data);
          
          // Invalidate any specified query keys
          if (invalidateQueryKeys.length > 0) {
            invalidateQueryKeys.forEach(key => {
              updateQueryCache(key);
            });
          }
        }
      } catch (error) {
        console.error(`Error processing WebSocket message for ${messageType}:`, error);
      }
    };
    
    // Handle connection status changes
    const handleConnected = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };
    
    const handleDisconnected = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    };
    
    // Add message subscription and connection state monitoring
    const messageUnsubscribe = wsService.subscribe(messageType, (data) => {
      // Process the message data
      handlerRef.current(data);
      
      // Invalidate any specified query keys
      if (invalidateQueryKeys.length > 0) {
        invalidateQueryKeys.forEach(key => {
          updateQueryCache(key);
        });
      }
    });
    
    // Subscribe to connection state
    const stateUnsubscribe = wsService.subscribeToState((state) => {
      setConnected(state === 'connected');
    });
    
    // Initial connection status
    setConnected(wsService.getConnectionState() === 'connected');
    
    // Clean up subscriptions
    return () => {
      // Unsubscribe from message events
      if (messageUnsubscribe) {
        messageUnsubscribe();
      }
      
      // Unsubscribe from state changes
      if (stateUnsubscribe) {
        stateUnsubscribe();
      }
    };
  }, [messageType, invalidateQueryKeys]);
  
  /**
   * Send a message to the WebSocket server
   */
  const sendMessage = (data: any) => {
    return wsService.send({
      type: messageType,
      data,
      timestamp: new Date().toISOString()
    });
  };
  
  return {
    connected,
    sendMessage
  };
}