import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db';

// Define message types for collaboration
export type CollaborationMessageType = 
  | 'connection' 
  | 'connectionSuccess'
  | 'connectionError'
  | 'collaborationJoin'
  | 'collaborationSync'
  | 'collaborationConnectionSuccess'
  | 'collaborationUpdate'
  | 'collaborationUserJoined'
  | 'collaborationUserLeft'
  | 'questionAdd'
  | 'questionUpdate'
  | 'questionDelete'
  | 'questionMove'
  | 'questionLock'
  | 'questionUnlock'
  | 'optionAdd'
  | 'optionUpdate'
  | 'optionDelete'
  | 'versionCreate'
  | 'versionSwitch'
  | 'reviewRequest'
  | 'reviewComment'
  | 'reviewComplete'
  | 'elementLock'
  | 'elementUnlock'
  | 'notification';

// Define client connection information
interface ClientConnection {
  ws: WebSocket;
  userId: number | null;
  username: string | null;
  sessionIds: number[];
  connectionId: string;
  isAuthenticated: boolean;
  lastActivity: Date;
}

// Define WebSocket service interface
export interface WebSocketService {
  broadcast: (channel: string, data: any) => void;
  broadcastToSession: (sessionId: number, data: any) => void;
  broadcastToUser: (userId: number, data: any) => void;
  addClient: (channelId: string, connection: ClientConnection) => void;
  removeClient: (channelId: string, connection: ClientConnection) => void;
  getClients: (channelId: string) => Set<ClientConnection>;
  handleMessage: (connection: ClientConnection, message: any) => void;
  getSessionParticipants: (sessionId: number) => ClientConnection[];
  lockElement: (sessionId: number, elementId: string, elementType: string, userId: number, username: string) => Promise<boolean>;
  unlockElement: (sessionId: number, elementId: string, userId: number) => Promise<boolean>;
  handleCollaborationJoin: (connection: ClientConnection, sessionId: number, userId: number, username: string) => Promise<void>;
}

// Singleton WebSocket service
let webSocketService: WebSocketService | null = null;

// Create a WebSocket service with the given WebSocketServer
export function createWebSocketService(wss: WebSocketServer): WebSocketService {
  const channels = new Map<string, Set<ClientConnection>>();
  const clients = new Map<string, ClientConnection>(); // Map connectionId to connection
  const elementLocks = new Map<string, { userId: number, username: string, expiration: Date }>(); // Map sessionId_elementId to lock info
  
  // Helper to generate lock key
  const getLockKey = (sessionId: number, elementId: string) => `${sessionId}_${elementId}`;
  
  const service: WebSocketService = {
    // Broadcast a message to all clients in a channel
    broadcast: (channel: string, data: any) => {
      const clientConnections = channels.get(channel);
      if (!clientConnections) return;
      
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      
      clientConnections.forEach(connection => {
        if (connection.ws.readyState === WebSocket.OPEN) {
          connection.ws.send(message);
          connection.lastActivity = new Date();
        }
      });
    },
    
    // Broadcast a message to all clients in a collaboration session
    broadcastToSession: (sessionId: number, data: any) => {
      const sessionChannel = `collaboration_${sessionId}`;
      service.broadcast(sessionChannel, data);
    },
    
    // Broadcast a message to a specific user (across all their connections)
    broadcastToUser: (userId: number, data: any) => {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Find all connections for this user
      for (const connection of clients.values()) {
        if (connection.userId === userId && connection.ws.readyState === WebSocket.OPEN) {
          connection.ws.send(message);
          connection.lastActivity = new Date();
        }
      }
    },
    
    // Add a client to a channel
    addClient: (channelId: string, connection: ClientConnection) => {
      if (!channels.has(channelId)) {
        channels.set(channelId, new Set());
      }
      
      const clientConnections = channels.get(channelId)!;
      clientConnections.add(connection);
      
      // Add a handler for when the client disconnects
      const originalOnClose = connection.ws.onclose;
      connection.ws.onclose = (event) => {
        service.removeClient(channelId, connection);
        
        // Remove from clients map
        clients.delete(connection.connectionId);
        
        // Call the original onclose handler if it exists
        if (originalOnClose) {
          originalOnClose.call(connection.ws, event);
        }
        
        // Broadcast user left for each session
        if (connection.userId && connection.username) {
          connection.sessionIds.forEach(sessionId => {
            service.broadcastToSession(sessionId, {
              type: 'collaborationUserLeft',
              sessionId,
              userId: connection.userId,
              username: connection.username
            });
            
            console.log(`User ${connection.username} (${connection.userId}) left session ${sessionId}`);
          });
        }
      };
    },
    
    // Remove a client from a channel
    removeClient: (channelId: string, connection: ClientConnection) => {
      const clientConnections = channels.get(channelId);
      if (!clientConnections) return;
      
      clientConnections.delete(connection);
      
      // Remove the channel if it's empty
      if (clientConnections.size === 0) {
        channels.delete(channelId);
      }
      
      // Also remove this channel from the connection's session list
      if (channelId.startsWith('collaboration_')) {
        const sessionId = parseInt(channelId.replace('collaboration_', ''));
        connection.sessionIds = connection.sessionIds.filter(id => id !== sessionId);
      }
    },
    
    // Get all clients in a channel
    getClients: (channelId: string) => {
      return channels.get(channelId) || new Set();
    },
    
    // Get all participants in a session
    getSessionParticipants: (sessionId: number) => {
      const channelId = `collaboration_${sessionId}`;
      const clientConnections = channels.get(channelId);
      if (!clientConnections) return [];
      
      return Array.from(clientConnections);
    },
    
    // Lock an element for a user
    lockElement: async (sessionId: number, elementId: string, elementType: string, userId: number, username: string) => {
      const lockKey = getLockKey(sessionId, elementId);
      
      // Check if element is already locked
      const existingLock = elementLocks.get(lockKey);
      if (existingLock && existingLock.expiration > new Date() && existingLock.userId !== userId) {
        return false; // Can't lock an element that's locked by someone else
      }
      
      // Set lock for 30 minutes
      const expiration = new Date();
      expiration.setMinutes(expiration.getMinutes() + 30);
      
      elementLocks.set(lockKey, { userId, username, expiration });
      
      // Broadcast lock to all clients in the session
      service.broadcastToSession(sessionId, {
        type: 'elementLock',
        sessionId,
        elementId,
        elementType,
        userId,
        username,
        expiration
      });
      
      return true;
    },
    
    // Unlock an element
    unlockElement: async (sessionId: number, elementId: string, userId: number) => {
      const lockKey = getLockKey(sessionId, elementId);
      
      // Check if element is locked by this user
      const existingLock = elementLocks.get(lockKey);
      if (!existingLock || existingLock.userId !== userId) {
        return false; // Can't unlock an element that's not locked by this user
      }
      
      elementLocks.delete(lockKey);
      
      // Broadcast unlock to all clients in the session
      service.broadcastToSession(sessionId, {
        type: 'elementUnlock',
        sessionId,
        elementId,
        userId
      });
      
      return true;
    },
    
    // Handle websocket messages
    handleMessage: (connection: ClientConnection, message: any) => {
      console.log('Received message:', message.type);
      
      switch (message.type) {
        case 'connection':
          // Initial connection - store user info if provided
          if (message.userId) {
            connection.userId = message.userId;
            connection.username = message.username || 'Anonymous';
            connection.isAuthenticated = true;
          }
          
          // Send connection success response
          connection.ws.send(JSON.stringify({
            type: 'connectionSuccess',
            connectionId: connection.connectionId,
            userId: connection.userId,
            timestamp: new Date().toISOString()
          }));
          break;
          
        case 'collaborationJoin':
          // User joining a collaboration session
          if (!message.sessionId) {
            connection.ws.send(JSON.stringify({
              type: 'connectionError',
              error: 'Missing sessionId parameter',
              timestamp: new Date().toISOString()
            }));
            return;
          }
          
          // If we have user info, use it, otherwise use the message data
          const userId = connection.userId || message.userId;
          const username = connection.username || message.username;
          
          if (!userId || !username) {
            connection.ws.send(JSON.stringify({
              type: 'connectionError',
              error: 'Missing user information',
              timestamp: new Date().toISOString()
            }));
            return;
          }
          
          // Handle the join
          service.handleCollaborationJoin(connection, message.sessionId, userId, username);
          break;
          
        case 'collaborationUpdate':
          // User made changes to a collaboration session
          if (!message.sessionId || !connection.userId) {
            return;
          }
          
          // Broadcast the update to all other clients in the session
          service.broadcastToSession(message.sessionId, {
            ...message,
            userId: connection.userId,
            username: connection.username,
            timestamp: new Date().toISOString()
          });
          break;
          
        case 'questionAdd':
        case 'questionUpdate':
        case 'questionDelete':
        case 'questionMove':
        case 'questionLock':
        case 'questionUnlock':
        case 'optionAdd':
        case 'optionUpdate':
        case 'optionDelete':
          // Question management operations
          if (!message.sessionId || !connection.userId) {
            return;
          }
          
          if (message.type === 'questionLock') {
            // Handle question locking
            service.lockElement(message.sessionId, message.questionId, 'question', connection.userId!, connection.username!);
          } else if (message.type === 'questionUnlock') {
            // Handle question unlocking
            service.unlockElement(message.sessionId, message.questionId, connection.userId!);
          }
          
          // Broadcast the operation to all clients in the session
          service.broadcastToSession(message.sessionId, {
            ...message,
            userId: connection.userId,
            username: connection.username,
            timestamp: new Date().toISOString()
          });
          break;
          
        case 'versionCreate':
        case 'versionSwitch':
          // Version control operations
          if (!message.sessionId || !connection.userId) {
            return;
          }
          
          // Broadcast the operation to all clients in the session
          service.broadcastToSession(message.sessionId, {
            ...message,
            userId: connection.userId,
            username: connection.username,
            timestamp: new Date().toISOString()
          });
          break;
          
        case 'reviewRequest':
        case 'reviewComment':
        case 'reviewComplete':
          // Review process operations
          if (!message.sessionId || !connection.userId) {
            return;
          }
          
          // Broadcast the operation to all clients in the session
          service.broadcastToSession(message.sessionId, {
            ...message,
            userId: connection.userId,
            username: connection.username,
            timestamp: new Date().toISOString()
          });
          
          // If review is targeted at specific users, also send direct notifications
          if (message.reviewerIds && Array.isArray(message.reviewerIds)) {
            message.reviewerIds.forEach(reviewerId => {
              service.broadcastToUser(reviewerId, {
                type: 'notification',
                notificationType: message.type,
                title: message.type === 'reviewRequest' 
                  ? 'Review Requested' 
                  : message.type === 'reviewComment'
                    ? 'New Comment'
                    : 'Review Completed',
                message: message.message || `${connection.username} ${message.type === 'reviewRequest' ? 'requested a review' : message.type === 'reviewComment' ? 'added a comment' : 'completed a review'}`,
                sessionId: message.sessionId,
                userId: connection.userId,
                username: connection.username,
                timestamp: new Date().toISOString()
              });
            });
          }
          break;
          
        case 'elementLock':
          // Element locking
          if (!message.sessionId || !connection.userId || !message.elementId || !message.elementType) {
            return;
          }
          
          // Lock the element
          service.lockElement(message.sessionId, message.elementId, message.elementType, connection.userId, connection.username || 'Anonymous');
          break;
          
        case 'elementUnlock':
          // Element unlocking
          if (!message.sessionId || !connection.userId || !message.elementId) {
            return;
          }
          
          // Unlock the element
          service.unlockElement(message.sessionId, message.elementId, connection.userId);
          break;
          
        default:
          console.log('Unknown message type:', message.type);
      }
    },
    
    // Handle a user joining a collaboration session
    handleCollaborationJoin: async (connection: ClientConnection, sessionId: number, userId: number, username: string) => {
      try {
        // Check if the session exists
        const sessionQuery = 'SELECT * FROM collaboration_sessions WHERE id = $1';
        const sessionResult = await pool.query(sessionQuery, [sessionId]);
        
        if (sessionResult.rows.length === 0) {
          // Session not found
          connection.ws.send(JSON.stringify({
            type: 'connectionError',
            error: `Session with ID ${sessionId} not found`,
            timestamp: new Date().toISOString()
          }));
          return;
        }
        
        // Session exists, add user to it
        console.log(`[${new Date().toISOString()}] [INFO] User ${username} (${userId}) joined session ${sessionId}`);
        
        // Update connection info
        connection.userId = userId;
        connection.username = username;
        connection.sessionIds.push(sessionId);
        
        // Add to the session channel
        const sessionChannel = `collaboration_${sessionId}`;
        service.addClient(sessionChannel, connection);
        
        // Send success response
        connection.ws.send(JSON.stringify({
          type: 'collaborationConnectionSuccess',
          connectionId: connection.connectionId,
          sessionId,
          userId,
          timestamp: new Date().toISOString()
        }));
        
        // Log the sync operation
        console.log(`[${new Date().toISOString()}] [DEBUG] Synced session ${sessionId} to user ${userId}`);
        
        // Get current session participants
        const participants = service.getSessionParticipants(sessionId).map(c => ({
          userId: c.userId,
          username: c.username,
          status: 'online',
          connectionId: c.connectionId
        }));
        
        // Send session data to the user (in a real app, this would fetch from database)
        connection.ws.send(JSON.stringify({
          type: 'collaborationSync',
          sessionId,
          participants,
          data: sessionResult.rows[0],
          timestamp: new Date().toISOString()
        }));
        
        // Broadcast to other users that this user joined
        service.broadcastToSession(sessionId, {
          type: 'collaborationUserJoined',
          sessionId,
          userId,
          username,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('Error handling collaboration join:', error);
        connection.ws.send(JSON.stringify({
          type: 'connectionError',
          error: 'Failed to join collaboration session',
          timestamp: new Date().toISOString()
        }));
      }
    }
  };
  
  // Set up WebSocket message handling
  wss.on('connection', (ws: WebSocket) => {
    // Create a new connection object
    const connectionId = uuidv4();
    const connection: ClientConnection = {
      ws,
      userId: null,
      username: null,
      sessionIds: [],
      connectionId,
      isAuthenticated: false,
      lastActivity: new Date()
    };
    
    // Add to clients map
    clients.set(connectionId, connection);
    
    // Set up message handler
    ws.on('message', (data: WebSocket.Data) => {
      try {
        // Parse the message
        const message = JSON.parse(data.toString());
        
        // Update last activity
        connection.lastActivity = new Date();
        
        // Handle the message
        service.handleMessage(connection, message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    // Set up close handler
    ws.on('close', () => {
      // Remove from clients map
      clients.delete(connectionId);
      
      // Remove from all channels
      for (const [channelId, clientSet] of channels.entries()) {
        if (clientSet.has(connection)) {
          clientSet.delete(connection);
          
          if (clientSet.size === 0) {
            channels.delete(channelId);
          }
        }
      }
    });
  });
  
  // Set up a cleanup interval to remove expired locks
  setInterval(() => {
    const now = new Date();
    
    // Remove expired locks
    for (const [lockKey, lockInfo] of elementLocks.entries()) {
      if (lockInfo.expiration <= now) {
        elementLocks.delete(lockKey);
        
        // Extract sessionId and elementId from the lock key
        const [sessionId, elementId] = lockKey.split('_');
        
        // Broadcast unlock to all clients in the session
        service.broadcastToSession(parseInt(sessionId), {
          type: 'elementUnlock',
          sessionId: parseInt(sessionId),
          elementId,
          userId: lockInfo.userId,
          reason: 'expired'
        });
      }
    }
    
    // Log inactive clients (in production, would close them after a period)
    const inactiveThreshold = new Date();
    inactiveThreshold.setMinutes(inactiveThreshold.getMinutes() - 30); // 30 minutes
    
    for (const [connectionId, connection] of clients.entries()) {
      if (connection.lastActivity < inactiveThreshold) {
        console.log(`Client ${connectionId} inactive for more than 30 minutes`);
        // In production, would close the connection here
      }
    }
  }, 60000); // Run every minute
  
  return service;
}

// Initialize the WebSocket service with a WebSocketServer
export function initWebSocketService(wss: WebSocketServer): WebSocketService {
  if (webSocketService) {
    return webSocketService;
  }
  
  console.log(`[${new Date().toISOString()}] [INFO] Initializing WebSocket service`);
  webSocketService = createWebSocketService(wss);
  return webSocketService;
}

// Get the current WebSocket service
export function getWebSocketService(): WebSocketService | null {
  return webSocketService;
}