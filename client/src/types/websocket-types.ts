// Define all WebSocket message types for type safety across both client and server

// Base message interface that all message types should extend
export interface WebSocketMessage {
  type: WebSocketMessageType;
}

// Enumeration of all supported message types
export type WebSocketMessageType = 
  | 'connection'
  | 'error'
  | 'surveyResponseReceived'
  | 'collaborationUpdate'
  | 'supportAgentTyping'
  | 'systemUpdate';

// Connection message (sent when WebSocket connection is established)
export interface ConnectionMessage extends WebSocketMessage {
  type: 'connection';
  userId: number;
  role: string;
  timestamp: string;
}

// Error message
export interface ErrorMessage extends WebSocketMessage {
  type: 'error';
  message: string;
  code?: string;
}

// SURVEY RESPONSE - Real-time survey response updates
export interface SurveyResponseReceivedData {
  type: 'surveyResponseReceived';
  surveyId: number;
  responseId: number;
  userId?: number;
  isAnonymous: boolean;
  isComplete: boolean;
  completionTimeSeconds?: number;
  questionCount?: number;
  answeredCount?: number;
  timestamp: string;
}

// COLLABORATION - Users collaborating on the same entity
export interface CollaborationUserData {
  type: 'collaborationUpdate';
  entityId: string | number;
  entityType: string; // e.g., 'survey', 'report', 'dashboard'
  userId: number;
  username?: string;
  action: 'join' | 'leave' | 'update';
  timestamp: string;
  changes?: {
    field: string;
    value: any;
  }[];
}

// SUPPORT SYSTEM - Agent typing indicator
export interface SupportAgentTypingData {
  type: 'supportAgentTyping';
  ticketId: number;
  userId: number;
  username?: string;
  isTyping: boolean;
  lastActive: string; // ISO timestamp
}

// SYSTEM - Real-time system health updates
export interface SystemUpdateData {
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
}

// Type guards for each message type
export function isConnectionMessage(message: any): message is ConnectionMessage {
  return message && message.type === 'connection';
}

export function isErrorMessage(message: any): message is ErrorMessage {
  return message && message.type === 'error';
}

export function isSurveyResponseReceivedData(message: any): message is SurveyResponseReceivedData {
  return message && message.type === 'surveyResponseReceived';
}

export function isCollaborationUserData(message: any): message is CollaborationUserData {
  return message && message.type === 'collaborationUpdate';
}

export function isSupportAgentTypingData(message: any): message is SupportAgentTypingData {
  return message && message.type === 'supportAgentTyping';
}

export function isSystemUpdateData(message: any): message is SystemUpdateData {
  return message && message.type === 'systemUpdate';
}