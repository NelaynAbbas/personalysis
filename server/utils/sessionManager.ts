import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { CollaborationUserData } from '../../shared/websocket-types';
import { logger } from './logger';

// Define types for session management
interface CollaborationParticipant {
  userId: number;
  username: string;
  connectionId: string;
  socket: WebSocket;
  status: 'online' | 'idle' | 'offline';
  lastActiveAt: Date;
  cursorPosition?: { x: number, y: number };
  entityId: number; // sessionId this participant belongs to
}

interface CollaborationSession {
  id: number;
  participants: Map<string, CollaborationParticipant>; // connectionId -> participant
  document?: any;
  changes: any[];
  comments: any[];
  lastActiveAt: Date;
  createdAt: Date;
}

// Session manager class
export class SessionManager {
  private sessions: Map<number, CollaborationSession> = new Map();
  private participants: Map<string, CollaborationParticipant> = new Map(); // connectionId -> participant
  
  constructor() {
    logger.info('SessionManager initialized');
    
    // Setup periodic cleanup of inactive sessions
    setInterval(() => {
      this.cleanupInactiveSessions();
    }, 60 * 60 * 1000); // Cleanup every hour
  }
  
  // Create a new session or return existing
  createSession(sessionId: number): CollaborationSession {
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }
    
    const session: CollaborationSession = {
      id: sessionId,
      participants: new Map(),
      changes: [],
      comments: [],
      lastActiveAt: new Date(),
      createdAt: new Date()
    };
    
    this.sessions.set(sessionId, session);
    logger.info(`Session ${sessionId} created`);
    return session;
  }
  
  // Add a participant to a session
  addParticipant(
    sessionId: number, 
    userId: number, 
    username: string, 
    socket: WebSocket
  ): string {
    const connectionId = uuidv4();
    const session = this.createSession(sessionId);
    
    const participant: CollaborationParticipant = {
      userId,
      username,
      connectionId,
      socket,
      status: 'online',
      lastActiveAt: new Date(),
      entityId: sessionId
    };
    
    // Add to both maps for easy lookup
    this.participants.set(connectionId, participant);
    session.participants.set(connectionId, participant);
    session.lastActiveAt = new Date();
    
    logger.info(`Participant ${username} (${userId}) joined session ${sessionId}`);
    
    // Notify other participants in the session
    this.broadcastUserAction(sessionId, 'join', userId, connectionId);
    
    return connectionId;
  }
  
  // Remove a participant from a session
  removeParticipant(connectionId: string): void {
    const participant = this.participants.get(connectionId);
    
    if (!participant) {
      logger.warn(`Attempted to remove non-existent participant: ${connectionId}`);
      return;
    }
    
    const { entityId, userId, username } = participant;
    const session = this.sessions.get(entityId);
    
    if (session) {
      session.participants.delete(connectionId);
      session.lastActiveAt = new Date();
      
      // Notify other participants
      this.broadcastUserAction(entityId, 'leave', userId, connectionId);
      
      logger.info(`Participant ${username} (${userId}) left session ${entityId}`);
      
      // Check if session is now empty
      if (session.participants.size === 0) {
        logger.info(`Session ${entityId} is now empty`);
      }
    }
    
    this.participants.delete(connectionId);
  }
  
  // Update participant status and activity
  updateParticipantStatus(
    connectionId: string, 
    status: 'online' | 'idle' | 'offline'
  ): void {
    const participant = this.participants.get(connectionId);
    
    if (!participant) {
      logger.warn(`Attempted to update non-existent participant: ${connectionId}`);
      return;
    }
    
    const { entityId, userId } = participant;
    participant.status = status;
    participant.lastActiveAt = new Date();
    
    // Notify others of the status change
    this.broadcastUserAction(entityId, 'update', userId, connectionId, [{
      field: 'status',
      value: status
    }]);
    
    logger.debug(`Participant ${participant.username} status updated to ${status}`);
  }
  
  // Update participant cursor position
  updateCursorPosition(
    connectionId: string, 
    position: { x: number, y: number }
  ): void {
    const participant = this.participants.get(connectionId);
    
    if (!participant) {
      logger.warn(`Attempted to update cursor for non-existent participant: ${connectionId}`);
      return;
    }
    
    const { entityId, userId } = participant;
    participant.cursorPosition = position;
    participant.lastActiveAt = new Date();
    
    // Notify others of the cursor change
    this.broadcastUserAction(entityId, 'update', userId, connectionId, [{
      field: 'cursor',
      value: position
    }]);
  }
  
  // Process a document change
  processChange(
    connectionId: string, 
    change: any
  ): void {
    const participant = this.participants.get(connectionId);
    
    if (!participant) {
      logger.warn(`Change from non-existent participant: ${connectionId}`);
      return;
    }
    
    const { entityId, userId } = participant;
    const session = this.sessions.get(entityId);
    
    if (!session) {
      logger.warn(`Change for non-existent session: ${entityId}`);
      return;
    }
    
    // Add change to history
    session.changes.push({
      ...change,
      userId,
      timestamp: new Date()
    });
    
    session.lastActiveAt = new Date();
    participant.lastActiveAt = new Date();
    
    // Broadcast change to other participants
    this.broadcastUserAction(entityId, 'update', userId, connectionId, [{
      field: 'change',
      value: change
    }]);
    
    logger.debug(`Document change processed in session ${entityId}`);
  }
  
  // Process a comment addition
  addComment(
    connectionId: string, 
    comment: any
  ): void {
    const participant = this.participants.get(connectionId);
    
    if (!participant) {
      logger.warn(`Comment from non-existent participant: ${connectionId}`);
      return;
    }
    
    const { entityId, userId } = participant;
    const session = this.sessions.get(entityId);
    
    if (!session) {
      logger.warn(`Comment for non-existent session: ${entityId}`);
      return;
    }
    
    // Add comment to session
    const commentWithMeta = {
      ...comment,
      id: uuidv4(),
      userId,
      username: participant.username,
      createdAt: new Date()
    };
    
    session.comments.push(commentWithMeta);
    session.lastActiveAt = new Date();
    participant.lastActiveAt = new Date();
    
    // Broadcast comment to other participants
    this.broadcastUserAction(entityId, 'update', userId, connectionId, [{
      field: 'comment',
      value: commentWithMeta
    }]);
    
    logger.debug(`Comment added to session ${entityId}`);
  }
  
  // Resolve a comment
  resolveComment(
    connectionId: string, 
    commentId: string
  ): void {
    const participant = this.participants.get(connectionId);
    
    if (!participant) {
      logger.warn(`Resolve comment from non-existent participant: ${connectionId}`);
      return;
    }
    
    const { entityId, userId } = participant;
    const session = this.sessions.get(entityId);
    
    if (!session) {
      logger.warn(`Resolve comment for non-existent session: ${entityId}`);
      return;
    }
    
    // Find and update the comment
    const commentIndex = session.comments.findIndex(c => c.id === commentId);
    
    if (commentIndex >= 0) {
      session.comments[commentIndex].resolved = true;
      session.comments[commentIndex].resolvedBy = userId;
      session.comments[commentIndex].resolvedAt = new Date();
      
      session.lastActiveAt = new Date();
      participant.lastActiveAt = new Date();
      
      // Broadcast resolution to other participants
      this.broadcastUserAction(entityId, 'update', userId, connectionId, [{
        field: 'resolveComment',
        value: {
          commentId,
          resolvedBy: userId,
          resolvedAt: new Date()
        }
      }]);
      
      logger.debug(`Comment ${commentId} resolved in session ${entityId}`);
    }
  }
  
  // Get all participants for a session
  getSessionParticipants(sessionId: number): CollaborationParticipant[] {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return [];
    }
    
    return Array.from(session.participants.values());
  }
  
  // Get a session by ID
  getSession(sessionId: number): CollaborationSession | undefined {
    return this.sessions.get(sessionId);
  }
  
  // Get a participant by connection ID
  getParticipant(connectionId: string): CollaborationParticipant | undefined {
    return this.participants.get(connectionId);
  }
  
  // Sync a newly joined participant with the current state
  syncParticipant(connectionId: string): void {
    const participant = this.participants.get(connectionId);
    
    if (!participant) {
      logger.warn(`Attempted to sync non-existent participant: ${connectionId}`);
      return;
    }
    
    const { entityId, socket } = participant;
    const session = this.sessions.get(entityId);
    
    if (!session) {
      logger.warn(`Attempted to sync with non-existent session: ${entityId}`);
      return;
    }
    
    // Create a sync message with all participants and their status
    const participantsData = Array.from(session.participants.values()).map(p => ({
      userId: p.userId,
      username: p.username,
      status: p.status,
      cursorPosition: p.cursorPosition,
      lastActiveAt: p.lastActiveAt
    }));
    
    // Send sync message to the joined participant
    const syncMessage: CollaborationUserData = {
      type: 'collaborationUpdate',
      action: 'sync',
      entityId,
      userId: participant.userId,
      changes: [{
        field: 'sync',
        value: {
          participants: participantsData,
          document: session.document,
          changes: session.changes.slice(-50), // Send last 50 changes
          comments: session.comments
        }
      }],
      timestamp: new Date().toISOString()
    };
    
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(syncMessage));
      logger.debug(`Synced participant ${participant.username} with session ${entityId}`);
    }
  }
  
  // Broadcast a user action to all participants in a session except the sender
  private broadcastUserAction(
    sessionId: number, 
    action: 'join' | 'leave' | 'update', 
    userId: number, 
    senderConnectionId: string,
    changes?: Array<{ field: string, value: any }>
  ): void {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return;
    }
    
    const message: CollaborationUserData = {
      type: 'collaborationUpdate',
      action,
      entityId: sessionId,
      userId,
      changes,
      timestamp: new Date().toISOString()
    };
    
    const messageStr = JSON.stringify(message);
    
    // Broadcast to all participants except the sender
    session.participants.forEach((participant, connectionId) => {
      if (connectionId !== senderConnectionId && participant.socket.readyState === WebSocket.OPEN) {
        participant.socket.send(messageStr);
      }
    });
  }
  
  // Cleanup inactive sessions and participants
  private cleanupInactiveSessions(): void {
    const now = new Date();
    const inactiveThreshold = 24 * 60 * 60 * 1000; // 24 hours of inactivity
    
    // First, mark participants as offline if they've been inactive
    this.participants.forEach((participant, connectionId) => {
      const inactiveTime = now.getTime() - participant.lastActiveAt.getTime();
      
      if (inactiveTime > 30 * 60 * 1000) { // 30 minutes of inactivity
        if (participant.status !== 'offline') {
          this.updateParticipantStatus(connectionId, 'offline');
        }
      } else if (inactiveTime > 5 * 60 * 1000) { // 5 minutes of inactivity
        if (participant.status === 'online') {
          this.updateParticipantStatus(connectionId, 'idle');
        }
      }
    });
    
    // Now cleanup inactive sessions
    this.sessions.forEach((session, sessionId) => {
      const inactiveTime = now.getTime() - session.lastActiveAt.getTime();
      
      if (inactiveTime > inactiveThreshold) {
        // Archive or delete the session
        logger.info(`Cleaning up inactive session ${sessionId}`);
        
        // Remove all participants from this session
        session.participants.forEach((_, connectionId) => {
          this.removeParticipant(connectionId);
        });
        
        // Remove the session
        this.sessions.delete(sessionId);
      }
    });
    
    logger.info(`Session cleanup completed. Active sessions: ${this.sessions.size}, Active participants: ${this.participants.size}`);
  }
}

export default SessionManager;