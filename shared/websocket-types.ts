// WebSocket Message Types

// Base message interface
export interface WebSocketMessage {
  type: string;
}

// System update message
export interface SystemUpdateData extends WebSocketMessage {
  type: 'systemUpdate';
  updateType: 'metrics' | 'health' | 'logs' | 'errors';
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
  logs?: string[];
  errors?: any[];
  timestamp: string;
}

// Survey analytics update message
export interface SurveyAnalyticsUpdateData extends WebSocketMessage {
  type: 'surveyAnalyticsUpdate';
  surveyId: number;
  metrics: {
    totalResponses: number;
    completionRate: number;
    averageTimeSpent: number;
    averageRating: number;
    uniqueRespondents: number;
    activeRespondents?: number; // Currently taking the survey
    lastResponseTime: string;
    averageCompletionTime: number;
    traitDistribution: { [key: string]: number };
  };
  demographics: any;
  responseRates: any;
  timestamp: string;
}

// Survey response received message
export interface SurveyResponseReceivedData extends WebSocketMessage {
  type: 'surveyResponseReceived';
  surveyId: number;
  responseId: number;
  isAnonymous: boolean;
  isComplete: boolean;
  completionTimeSeconds: number;
  questionCount: number;
  answeredCount: number;
  timestamp: string;
}

// Connection message
export interface ConnectionMessage extends WebSocketMessage {
  type: 'connection';
  status: 'connected';
  clientId: string;
  userId?: number;
  role?: string;
}

// Collaboration Join message - sent from client to server
export interface CollaborationJoinMessage extends WebSocketMessage {
  type: 'collaborationJoin';
  sessionId: number;
  userId: number;
  username: string;
}

// Collaboration Connection Success message - sent from server to client
export interface CollaborationConnectionSuccessMessage extends WebSocketMessage {
  type: 'collaborationConnectionSuccess';
  connectionId: string;
  timestamp: string;
}

// Collaboration Sync message - sent from server to client
export interface CollaborationSyncMessage extends WebSocketMessage {
  type: 'collaborationSync';
  sessionId: number;
  document: {
    content: string;
    version: number;
  };
  participants: Array<{
    userId: number;
    username: string;
    status: 'online' | 'idle' | 'offline';
    lastActiveAt: string;
    cursorPosition?: { x: number, y: number };
  }>;
  comments: Array<{
    id: string;
    userId: number;
    username: string;
    text: string;
    createdAt: string;
    position: number;
    resolved: boolean;
    resolvedAt?: string;
    resolvedBy?: number;
  }>;
  timestamp: string;
}

// Collaboration update message - can be sent in both directions
export interface CollaborationUserData extends WebSocketMessage {
  type: 'collaborationUpdate';
  action: 'join' | 'leave' | 'update' | 'sync' 
        | 'ADD_QUESTION' | 'UPDATE_QUESTION' | 'DELETE_QUESTION'
        | 'ADD_QUESTION_OPTION' | 'UPDATE_QUESTION_OPTION' | 'DELETE_QUESTION_OPTION'
        | 'LOCK_ELEMENT' | 'UNLOCK_ELEMENT'
        | 'CREATE_VERSION' | 'SWITCH_VERSION'
        | 'REQUEST_REVIEW' | 'SUBMIT_REVIEW'
        | 'NOTIFICATION';
  entityId: number; // sessionId
  userId: number;
  changes?: Array<{
    field: 'cursor' | 'status' | 'change' | 'comment' | 'resolveComment' | 'participant'
         | 'addQuestion' | 'updateQuestion' | 'deleteQuestion'
         | 'addQuestionOption' | 'updateQuestionOption' | 'deleteQuestionOption'
         | 'lockElement' | 'unlockElement'
         | 'createVersion' | 'switchVersion'
         | 'requestReview' | 'submitReview'
         | 'notification';
    value: any;
  }>;
  timestamp?: string;
}

// Reconnect message
export interface ReconnectMessage extends WebSocketMessage {
  type: 'reconnect';
  connectionId: string;
}

// Error message
export interface ErrorMessage extends WebSocketMessage {
  type: 'error';
  message: string;
  details?: string;
}

// Union type for all WebSocket messages
export type WebSocketMessageTypes = 
  | SystemUpdateData
  | SurveyAnalyticsUpdateData
  | SurveyResponseReceivedData
  | ConnectionMessage
  | CollaborationJoinMessage
  | CollaborationConnectionSuccessMessage
  | CollaborationSyncMessage
  | CollaborationUserData
  | ReconnectMessage
  | ErrorMessage;