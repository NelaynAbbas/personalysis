import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import logger from './Logger';
import { 
  CollaborationUserData, 
  WebSocketMessage 
} from '../../shared/websocket-types';

// Participant in a collaboration session
interface Participant {
  userId: number;
  username: string;
  connectionId: string;
  socket: WebSocket;
  status: 'online' | 'idle' | 'offline';
  lastActiveAt: Date;
  cursorPosition?: { x: number, y: number };
}

// Change made to a document
interface DocumentChange {
  id: string;
  userId: number;
  username: string;
  timestamp: Date;
  type: 'insert' | 'delete' | 'update' | 'format';
  content: string;
  position: number;
  length: number;
}

// Comment on a document
interface Comment {
  id: string;
  userId: number;
  username: string;
  text: string;
  createdAt: Date;
  position: number;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: number;
}

// Collaboration session
interface Session {
  id: number;
  participants: Map<string, Participant>; // connectionId -> participant
  document: {
    content: string;
    version: number;
  };
  changes: DocumentChange[];
  comments: Comment[];
  lastActiveAt: Date;
  createdAt: Date;
}

class CollaborationManager {
  private sessions: Map<number, Session> = new Map();
  private connections: Map<string, {
    sessionId: number;
    userId: number;
  }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    logger.info('Collaboration manager initialized');
    
    // Set up periodic cleanup of inactive sessions
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveSessions();
    }, 15 * 60 * 1000); // Run every 15 minutes
  }

  /**
   * Create a new session or get an existing one
   */
  getOrCreateSession(sessionId: number): Session {
    if (!this.sessions.has(sessionId)) {
      logger.info(`Creating new collaboration session ${sessionId}`);
      
      this.sessions.set(sessionId, {
        id: sessionId,
        participants: new Map(),
        document: {
          content: '',
          version: 0
        },
        changes: [],
        comments: [],
        lastActiveAt: new Date(),
        createdAt: new Date()
      });
    }
    
    return this.sessions.get(sessionId)!;
  }

  /**
   * Add a participant to a session
   */
  addParticipant(sessionId: number, userId: number, username: string, socket: WebSocket): string {
    const session = this.getOrCreateSession(sessionId);
    const connectionId = uuidv4();
    
    const participant: Participant = {
      userId,
      username,
      connectionId,
      socket,
      status: 'online',
      lastActiveAt: new Date()
    };
    
    session.participants.set(connectionId, participant);
    session.lastActiveAt = new Date();
    
    // Store the connection mapping for quick lookups
    this.connections.set(connectionId, {
      sessionId,
      userId
    });
    
    // Broadcast the join event to all participants
    this.broadcastToSession(sessionId, {
      type: 'collaborationUpdate',
      action: 'join',
      entityId: sessionId,
      userId,
      changes: [{
        field: 'participant',
        value: {
          userId,
          username,
          status: 'online',
          lastActiveAt: new Date().toISOString()
        }
      }],
      timestamp: new Date().toISOString()
    }, connectionId);
    
    logger.info(`User ${username} (${userId}) joined session ${sessionId}`);
    return connectionId;
  }

  /**
   * Remove a participant from a session
   */
  removeParticipant(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }
    
    const { sessionId, userId } = connection;
    const session = this.sessions.get(sessionId);
    
    if (session) {
      const participant = session.participants.get(connectionId);
      if (participant) {
        // Broadcast the leave event
        this.broadcastToSession(sessionId, {
          type: 'collaborationUpdate',
          action: 'leave',
          entityId: sessionId,
          userId: participant.userId,
          changes: [{
            field: 'participant',
            value: {
              userId: participant.userId,
              status: 'offline'
            }
          }],
          timestamp: new Date().toISOString()
        }, connectionId);
        
        logger.info(`User ${participant.username} (${participant.userId}) left session ${sessionId}`);
        
        // Remove the participant
        session.participants.delete(connectionId);
        session.lastActiveAt = new Date();
      }
    }
    
    // Remove the connection mapping
    this.connections.delete(connectionId);
  }

  /**
   * Update a participant's cursor position
   */
  updateCursorPosition(connectionId: string, position: { x: number, y: number }): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }
    
    const { sessionId, userId } = connection;
    const session = this.sessions.get(sessionId);
    
    if (session) {
      const participant = session.participants.get(connectionId);
      if (participant) {
        participant.cursorPosition = position;
        participant.lastActiveAt = new Date();
        session.lastActiveAt = new Date();
        
        // Broadcast the cursor update
        this.broadcastToSession(sessionId, {
          type: 'collaborationUpdate',
          action: 'update',
          entityId: sessionId,
          userId,
          changes: [{
            field: 'cursor',
            value: position
          }],
          timestamp: new Date().toISOString()
        }, connectionId);
      }
    }
  }

  /**
   * Update a participant's status
   */
  updateParticipantStatus(connectionId: string, status: 'online' | 'idle' | 'offline'): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }
    
    const { sessionId, userId } = connection;
    const session = this.sessions.get(sessionId);
    
    if (session) {
      const participant = session.participants.get(connectionId);
      if (participant) {
        participant.status = status;
        participant.lastActiveAt = new Date();
        session.lastActiveAt = new Date();
        
        // Broadcast the status update
        this.broadcastToSession(sessionId, {
          type: 'collaborationUpdate',
          action: 'update',
          entityId: sessionId,
          userId,
          changes: [{
            field: 'status',
            value: status
          }],
          timestamp: new Date().toISOString()
        }, connectionId);
      }
    }
  }

  /**
   * Process a document change
   */
  processChange(connectionId: string, changeData: any): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }
    
    const { sessionId, userId } = connection;
    const session = this.sessions.get(sessionId);
    
    if (session) {
      const participant = session.participants.get(connectionId);
      if (participant) {
        // Create a change record
        const change: DocumentChange = {
          id: uuidv4(),
          userId,
          username: participant.username,
          timestamp: new Date(),
          type: changeData.type,
          content: changeData.content,
          position: changeData.position,
          length: changeData.length
        };
        
        // Update document content - this is simplified and would need more logic for accurate text merging
        const doc = session.document;
        
        if (change.type === 'insert') {
          const before = doc.content.substring(0, change.position);
          const after = doc.content.substring(change.position);
          doc.content = before + change.content + after;
        } else if (change.type === 'delete') {
          const before = doc.content.substring(0, change.position);
          const after = doc.content.substring(change.position + change.length);
          doc.content = before + after;
        } else if (change.type === 'update') {
          const before = doc.content.substring(0, change.position);
          const after = doc.content.substring(change.position + change.length);
          doc.content = before + change.content + after;
        }
        
        // Increment document version
        doc.version++;
        
        // Add change to history
        session.changes.push(change);
        
        // Update activity timestamps
        participant.lastActiveAt = new Date();
        session.lastActiveAt = new Date();
        
        // Broadcast the change
        this.broadcastToSession(sessionId, {
          type: 'collaborationUpdate',
          action: 'update',
          entityId: sessionId,
          userId,
          changes: [{
            field: 'change',
            value: {
              id: change.id,
              userId,
              username: participant.username,
              timestamp: change.timestamp.toISOString(),
              type: change.type,
              content: change.content,
              position: change.position,
              length: change.length,
              docVersion: doc.version
            }
          }],
          timestamp: new Date().toISOString()
        }, connectionId);
      }
    }
  }

  /**
   * Add a comment to a document
   */
  addComment(connectionId: string, commentData: any): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }
    
    const { sessionId, userId } = connection;
    const session = this.sessions.get(sessionId);
    
    if (session) {
      const participant = session.participants.get(connectionId);
      if (participant) {
        // Create a comment
        const comment: Comment = {
          id: uuidv4(),
          userId,
          username: participant.username,
          text: commentData.text,
          createdAt: new Date(),
          position: commentData.position,
          resolved: false
        };
        
        // Add comment to session
        session.comments.push(comment);
        
        // Update activity timestamps
        participant.lastActiveAt = new Date();
        session.lastActiveAt = new Date();
        
        // Broadcast the comment
        this.broadcastToSession(sessionId, {
          type: 'collaborationUpdate',
          action: 'update',
          entityId: sessionId,
          userId,
          changes: [{
            field: 'comment',
            value: {
              id: comment.id,
              userId,
              username: participant.username,
              text: comment.text,
              createdAt: comment.createdAt.toISOString(),
              position: comment.position,
              resolved: comment.resolved
            }
          }],
          timestamp: new Date().toISOString()
        }, connectionId);
      }
    }
  }

  /**
   * Resolve a comment
   */
  resolveComment(connectionId: string, commentId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }
    
    const { sessionId, userId } = connection;
    const session = this.sessions.get(sessionId);
    
    if (session) {
      const participant = session.participants.get(connectionId);
      if (participant) {
        // Find and update the comment
        const comment = session.comments.find(c => c.id === commentId);
        if (comment) {
          comment.resolved = true;
          comment.resolvedAt = new Date();
          comment.resolvedBy = userId;
          
          // Update activity timestamps
          participant.lastActiveAt = new Date();
          session.lastActiveAt = new Date();
          
          // Broadcast the resolution
          this.broadcastToSession(sessionId, {
            type: 'collaborationUpdate',
            action: 'update',
            entityId: sessionId,
            userId,
            changes: [{
              field: 'resolveComment',
              value: {
                commentId,
                resolvedBy: userId,
                resolvedAt: comment.resolvedAt.toISOString()
              }
            }],
            timestamp: new Date().toISOString()
          }, connectionId);
        }
      }
    }
  }
  
  /**
   * Add a new survey question
   */
  addSurveyQuestion(connectionId: string, surveyId: number, questionData: any, position?: number): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }
    
    const { sessionId, userId } = connection;
    const session = this.sessions.get(sessionId);
    
    if (session) {
      const participant = session.participants.get(connectionId);
      if (participant) {
        // Update activity timestamps
        participant.lastActiveAt = new Date();
        session.lastActiveAt = new Date();
        
        // Broadcast the question addition
        this.broadcastToSession(sessionId, {
          type: 'collaborationUpdate',
          action: 'ADD_QUESTION',
          entityId: sessionId,
          userId,
          changes: [{
            field: 'addQuestion',
            value: {
              surveyId,
              question: questionData,
              position,
              addedBy: userId,
              addedAt: new Date().toISOString()
            }
          }],
          timestamp: new Date().toISOString()
        }, connectionId);
      }
    }
  }
  
  /**
   * Update a survey question
   */
  updateSurveyQuestion(connectionId: string, questionId: number, updates: any): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }
    
    const { sessionId, userId } = connection;
    const session = this.sessions.get(sessionId);
    
    if (session) {
      const participant = session.participants.get(connectionId);
      if (participant) {
        // Update activity timestamps
        participant.lastActiveAt = new Date();
        session.lastActiveAt = new Date();
        
        // Broadcast the question update
        this.broadcastToSession(sessionId, {
          type: 'collaborationUpdate',
          action: 'UPDATE_QUESTION',
          entityId: sessionId,
          userId,
          changes: [{
            field: 'updateQuestion',
            value: {
              questionId,
              updates,
              updatedBy: userId,
              updatedAt: new Date().toISOString()
            }
          }],
          timestamp: new Date().toISOString()
        }, connectionId);
      }
    }
  }
  
  /**
   * Delete a survey question
   */
  deleteSurveyQuestion(connectionId: string, questionId: number): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }
    
    const { sessionId, userId } = connection;
    const session = this.sessions.get(sessionId);
    
    if (session) {
      const participant = session.participants.get(connectionId);
      if (participant) {
        // Update activity timestamps
        participant.lastActiveAt = new Date();
        session.lastActiveAt = new Date();
        
        // Broadcast the question deletion
        this.broadcastToSession(sessionId, {
          type: 'collaborationUpdate',
          action: 'DELETE_QUESTION',
          entityId: sessionId,
          userId,
          changes: [{
            field: 'deleteQuestion',
            value: {
              questionId,
              deletedBy: userId,
              deletedAt: new Date().toISOString()
            }
          }],
          timestamp: new Date().toISOString()
        }, connectionId);
      }
    }
  }
  
  /**
   * Add an option to a survey question
   */
  addQuestionOption(connectionId: string, questionId: number, optionData: any, position?: number): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }
    
    const { sessionId, userId } = connection;
    const session = this.sessions.get(sessionId);
    
    if (session) {
      const participant = session.participants.get(connectionId);
      if (participant) {
        // Update activity timestamps
        participant.lastActiveAt = new Date();
        session.lastActiveAt = new Date();
        
        // Broadcast the option addition
        this.broadcastToSession(sessionId, {
          type: 'collaborationUpdate',
          action: 'ADD_QUESTION_OPTION',
          entityId: sessionId,
          userId,
          changes: [{
            field: 'addQuestionOption',
            value: {
              questionId,
              option: optionData,
              position,
              addedBy: userId,
              addedAt: new Date().toISOString()
            }
          }],
          timestamp: new Date().toISOString()
        }, connectionId);
      }
    }
  }
  
  /**
   * Update an option for a survey question
   */
  updateQuestionOption(connectionId: string, questionId: number, optionId: number, updates: any): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }
    
    const { sessionId, userId } = connection;
    const session = this.sessions.get(sessionId);
    
    if (session) {
      const participant = session.participants.get(connectionId);
      if (participant) {
        // Update activity timestamps
        participant.lastActiveAt = new Date();
        session.lastActiveAt = new Date();
        
        // Broadcast the option update
        this.broadcastToSession(sessionId, {
          type: 'collaborationUpdate',
          action: 'UPDATE_QUESTION_OPTION',
          entityId: sessionId,
          userId,
          changes: [{
            field: 'updateQuestionOption',
            value: {
              questionId,
              optionId,
              updates,
              updatedBy: userId,
              updatedAt: new Date().toISOString()
            }
          }],
          timestamp: new Date().toISOString()
        }, connectionId);
      }
    }
  }
  
  /**
   * Delete an option from a survey question
   */
  deleteQuestionOption(connectionId: string, questionId: number, optionId: number): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }
    
    const { sessionId, userId } = connection;
    const session = this.sessions.get(sessionId);
    
    if (session) {
      const participant = session.participants.get(connectionId);
      if (participant) {
        // Update activity timestamps
        participant.lastActiveAt = new Date();
        session.lastActiveAt = new Date();
        
        // Broadcast the option deletion
        this.broadcastToSession(sessionId, {
          type: 'collaborationUpdate',
          action: 'DELETE_QUESTION_OPTION',
          entityId: sessionId,
          userId,
          changes: [{
            field: 'deleteQuestionOption',
            value: {
              questionId,
              optionId,
              deletedBy: userId,
              deletedAt: new Date().toISOString()
            }
          }],
          timestamp: new Date().toISOString()
        }, connectionId);
      }
    }
  }
  
  /**
   * Lock an element for editing by a user
   */
  lockElement(connectionId: string, elementType: string, elementId: number): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }
    
    const { sessionId, userId } = connection;
    const session = this.sessions.get(sessionId);
    
    if (session) {
      const participant = session.participants.get(connectionId);
      if (participant) {
        // Update activity timestamps
        participant.lastActiveAt = new Date();
        session.lastActiveAt = new Date();
        
        // Broadcast the lock
        this.broadcastToSession(sessionId, {
          type: 'collaborationUpdate',
          action: 'LOCK_ELEMENT',
          entityId: sessionId,
          userId,
          changes: [{
            field: 'lockElement',
            value: {
              elementType,
              elementId,
              lockedBy: userId,
              lockedAt: new Date().toISOString(),
              username: participant.username
            }
          }],
          timestamp: new Date().toISOString()
        }, connectionId);
      }
    }
  }
  
  /**
   * Unlock an element that was being edited
   */
  unlockElement(connectionId: string, elementType: string, elementId: number): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }
    
    const { sessionId, userId } = connection;
    const session = this.sessions.get(sessionId);
    
    if (session) {
      const participant = session.participants.get(connectionId);
      if (participant) {
        // Update activity timestamps
        participant.lastActiveAt = new Date();
        session.lastActiveAt = new Date();
        
        // Broadcast the unlock
        this.broadcastToSession(sessionId, {
          type: 'collaborationUpdate',
          action: 'UNLOCK_ELEMENT',
          entityId: sessionId,
          userId,
          changes: [{
            field: 'unlockElement',
            value: {
              elementType,
              elementId,
              unlockedBy: userId,
              unlockedAt: new Date().toISOString()
            }
          }],
          timestamp: new Date().toISOString()
        }, connectionId);
      }
    }
  }
  
  /**
   * Create a new version of a survey
   */
  createVersion(connectionId: string, surveyId: number, versionName: string, versionNotes?: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }
    
    const { sessionId, userId } = connection;
    const session = this.sessions.get(sessionId);
    
    if (session) {
      const participant = session.participants.get(connectionId);
      if (participant) {
        // Update activity timestamps
        participant.lastActiveAt = new Date();
        session.lastActiveAt = new Date();
        
        // Broadcast the version creation
        this.broadcastToSession(sessionId, {
          type: 'collaborationUpdate',
          action: 'CREATE_VERSION',
          entityId: sessionId,
          userId,
          changes: [{
            field: 'createVersion',
            value: {
              surveyId,
              versionName,
              versionNotes,
              createdBy: userId,
              createdAt: new Date().toISOString(),
              username: participant.username
            }
          }],
          timestamp: new Date().toISOString()
        }, connectionId);
      }
    }
  }
  
  /**
   * Switch to a different version of a survey
   */
  switchVersion(connectionId: string, surveyId: number, versionId: number): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }
    
    const { sessionId, userId } = connection;
    const session = this.sessions.get(sessionId);
    
    if (session) {
      const participant = session.participants.get(connectionId);
      if (participant) {
        // Update activity timestamps
        participant.lastActiveAt = new Date();
        session.lastActiveAt = new Date();
        
        // Broadcast the version switch
        this.broadcastToSession(sessionId, {
          type: 'collaborationUpdate',
          action: 'SWITCH_VERSION',
          entityId: sessionId,
          userId,
          changes: [{
            field: 'switchVersion',
            value: {
              surveyId,
              versionId,
              switchedBy: userId,
              switchedAt: new Date().toISOString(),
              username: participant.username
            }
          }],
          timestamp: new Date().toISOString()
        }, connectionId);
      }
    }
  }
  
  /**
   * Request a review of the survey
   */
  requestReview(connectionId: string, surveyId: number, notes?: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }
    
    const { sessionId, userId } = connection;
    const session = this.sessions.get(sessionId);
    
    if (session) {
      const participant = session.participants.get(connectionId);
      if (participant) {
        // Update activity timestamps
        participant.lastActiveAt = new Date();
        session.lastActiveAt = new Date();
        
        // Broadcast the review request
        this.broadcastToSession(sessionId, {
          type: 'collaborationUpdate',
          action: 'REQUEST_REVIEW',
          entityId: sessionId,
          userId,
          changes: [{
            field: 'requestReview',
            value: {
              surveyId,
              requestedBy: userId,
              notes,
              requestedAt: new Date().toISOString(),
              username: participant.username
            }
          }],
          timestamp: new Date().toISOString()
        }, connectionId);
      }
    }
  }
  
  /**
   * Submit a review of the survey
   */
  submitReview(connectionId: string, surveyId: number, status: 'approved' | 'rejected', comments?: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }
    
    const { sessionId, userId } = connection;
    const session = this.sessions.get(sessionId);
    
    if (session) {
      const participant = session.participants.get(connectionId);
      if (participant) {
        // Update activity timestamps
        participant.lastActiveAt = new Date();
        session.lastActiveAt = new Date();
        
        // Broadcast the review submission
        this.broadcastToSession(sessionId, {
          type: 'collaborationUpdate',
          action: 'SUBMIT_REVIEW',
          entityId: sessionId,
          userId,
          changes: [{
            field: 'submitReview',
            value: {
              surveyId,
              reviewedBy: userId,
              status,
              comments,
              reviewedAt: new Date().toISOString(),
              username: participant.username
            }
          }],
          timestamp: new Date().toISOString()
        }, connectionId);
      }
    }
  }
  
  /**
   * Send a notification to all session participants
   */
  sendNotification(connectionId: string, message: string, level: 'info' | 'warning' | 'error'): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }
    
    const { sessionId, userId } = connection;
    const session = this.sessions.get(sessionId);
    
    if (session) {
      const participant = session.participants.get(connectionId);
      if (participant) {
        // Update activity timestamps
        participant.lastActiveAt = new Date();
        session.lastActiveAt = new Date();
        
        // Broadcast the notification
        this.broadcastToSession(sessionId, {
          type: 'collaborationUpdate',
          action: 'NOTIFICATION',
          entityId: sessionId,
          userId,
          changes: [{
            field: 'notification',
            value: {
              message,
              level,
              sentBy: userId,
              sentAt: new Date().toISOString(),
              username: participant.username
            }
          }],
          timestamp: new Date().toISOString()
        }, connectionId);
      }
    }
  }

  /**
   * Get all participants in a session
   */
  getSessionParticipants(sessionId: number): Participant[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }
    
    return Array.from(session.participants.values());
  }

  /**
   * Sync a participant with the current session state
   */
  syncParticipant(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }
    
    const { sessionId, userId } = connection;
    const session = this.sessions.get(sessionId);
    
    if (session && session.participants.has(connectionId)) {
      const participant = session.participants.get(connectionId)!;
      const socket = participant.socket;
      
      if (socket.readyState === WebSocket.OPEN) {
        // Create a simplified view of participants for the sync
        const participantsData = Array.from(session.participants.values()).map(p => ({
          userId: p.userId,
          username: p.username,
          status: p.status,
          lastActiveAt: p.lastActiveAt.toISOString(),
          cursorPosition: p.cursorPosition
        }));
        
        // Send the sync data
        socket.send(JSON.stringify({
          type: 'collaborationSync',
          sessionId,
          document: {
            content: session.document.content,
            version: session.document.version
          },
          participants: participantsData,
          comments: session.comments.map(c => ({
            id: c.id,
            userId: c.userId,
            username: c.username,
            text: c.text,
            createdAt: c.createdAt.toISOString(),
            position: c.position,
            resolved: c.resolved,
            resolvedAt: c.resolvedAt?.toISOString(),
            resolvedBy: c.resolvedBy
          })),
          timestamp: new Date().toISOString()
        }));
        
        logger.debug(`Synced session ${sessionId} to user ${userId}`);
      }
    }
  }

  /**
   * Broadcast a message to all participants in a session
   */
  private broadcastToSession(
    sessionId: number, 
    message: CollaborationUserData | WebSocketMessage, 
    excludeConnectionId?: string
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }
    
    const messageStr = JSON.stringify(message);
    
    session.participants.forEach((participant, connectionId) => {
      if (connectionId !== excludeConnectionId && participant.socket.readyState === WebSocket.OPEN) {
        participant.socket.send(messageStr);
      }
    });
  }

  /**
   * Clean up inactive sessions and participants
   */
  private cleanupInactiveSessions(): void {
    const now = new Date();
    const inactiveThreshold = 24 * 60 * 60 * 1000; // 24 hours of inactivity
    
    // Update status of inactive participants
    this.connections.forEach((connection, connectionId) => {
      const { sessionId } = connection;
      const session = this.sessions.get(sessionId);
      
      if (session && session.participants.has(connectionId)) {
        const participant = session.participants.get(connectionId)!;
        const inactiveTime = now.getTime() - participant.lastActiveAt.getTime();
        
        if (inactiveTime > 30 * 60 * 1000 && participant.status !== 'offline') { // 30 minutes
          this.updateParticipantStatus(connectionId, 'offline');
        } else if (inactiveTime > 5 * 60 * 1000 && participant.status === 'online') { // 5 minutes
          this.updateParticipantStatus(connectionId, 'idle');
        }
      }
    });
    
    // Remove inactive sessions
    this.sessions.forEach((session, sessionId) => {
      const inactiveTime = now.getTime() - session.lastActiveAt.getTime();
      
      if (inactiveTime > inactiveThreshold) {
        logger.info(`Removing inactive session ${sessionId}`);
        
        // Clean up connections for this session
        Array.from(session.participants.keys()).forEach(connectionId => {
          this.connections.delete(connectionId);
        });
        
        // Remove the session
        this.sessions.delete(sessionId);
      }
    });
  }
}

// Export a singleton instance
const collaborationManager = new CollaborationManager();
export default collaborationManager;