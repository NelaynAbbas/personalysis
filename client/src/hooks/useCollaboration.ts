import { useState, useEffect, useCallback, useRef } from 'react';
import { CollaborationUserData } from '../../../shared/websocket-types';

// Define the shape of the collaboration state
interface CollaborationState {
  connected: boolean;
  connectionId: string | null;
  participants: Array<{
    userId: number;
    username: string;
    status: 'online' | 'idle' | 'offline';
    cursorPosition?: { x: number, y: number };
  }>;
  document: {
    content: string;
    version: number;
  };
  comments: Array<{
    id: string;
    userId: number;
    username: string;
    text: string;
    createdAt: string;
    position: number;
    resolved: boolean;
    resolvedBy?: number;
    resolvedAt?: string;
  }>;
}

// Define function for handling document changes
export type ChangeHandler = (change: any) => void;
export type CommentHandler = (comment: any) => void;
export type ParticipantHandler = (participant: any) => void;

// UseCollaboration hook params
interface UseCollaborationParams {
  sessionId: number;
  userId: number;
  username: string;
  onDocumentChange?: ChangeHandler;
  onCommentAdded?: CommentHandler;
  onCommentResolved?: CommentHandler;
  onParticipantJoined?: ParticipantHandler;
  onParticipantLeft?: ParticipantHandler;
  onParticipantUpdated?: ParticipantHandler;
}

export function useCollaboration({
  sessionId,
  userId,
  username,
  onDocumentChange,
  onCommentAdded,
  onCommentResolved,
  onParticipantJoined,
  onParticipantLeft,
  onParticipantUpdated
}: UseCollaborationParams) {
  // State for tracking connection and collaboration data
  const [state, setState] = useState<CollaborationState>({
    connected: false,
    connectionId: null,
    participants: [],
    document: {
      content: '',
      version: 0
    },
    comments: []
  });

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  const connectionIdRef = useRef<string | null>(null);

  // Reconnection mechanism
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const BASE_RECONNECT_DELAY = 1000; // 1 second
  
  // Function to connect to WebSocket
  const connect = useCallback(() => {
    try {
      // Create WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Connecting to WebSocket server at', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      // Set up event handlers
      ws.onopen = () => {
        console.log('WebSocket connection established');
        
        // Reset reconnection attempts upon successful connection
        reconnectAttemptsRef.current = 0;
        
        if (connectionIdRef.current) {
          // If we have a connection ID, attempt to reconnect to an existing session
          ws.send(JSON.stringify({
            type: 'reconnect',
            connectionId: connectionIdRef.current
          }));
        } else {
          // Otherwise join as a new participant
          ws.send(JSON.stringify({
            type: 'collaborationJoin',
            sessionId,
            userId,
            username
          }));
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle different message types
          if (data.type === 'connection') {
            // This is the initial connection to the WebSocket server
            console.log('WebSocket connected');
          }
          else if (data.type === 'collaborationConnectionSuccess') {
            // Store the connection ID for reconnection
            connectionIdRef.current = data.connectionId;
            
            setState(prev => ({
              ...prev,
              connected: true,
              connectionId: data.connectionId
            }));
          }
          else if (data.type === 'collaborationSync') {
            // Handle full session sync
            setState(prev => ({
              ...prev,
              participants: data.participants || [],
              document: data.document || { content: '', version: 0 },
              comments: data.comments || []
            }));
          }
          else if (data.type === 'collaborationUpdate') {
            // Handle individual updates
            handleCollaborationUpdate(data);
          }
          else if (data.type === 'reconnect' && data.status === 'success') {
            // Reconnection was successful
            setState(prev => ({
              ...prev,
              connected: true
            }));
          }
          else if (data.type === 'error') {
            console.error('WebSocket error:', data.message, data.details || '');
          }
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
        }
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        
        // Update connection state
        setState(prev => ({
          ...prev,
          connected: false
        }));
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && event.code !== 1001) {
          scheduleReconnect();
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        
        // If there's an error, close the connection and try to reconnect
        ws.close();
      };
      
      return () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close();
        }
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };
    } catch (err) {
      console.error('Error connecting to WebSocket:', err);
      scheduleReconnect();
    }
  }, [sessionId, userId, username]);
  
  // Function to handle collaboration updates
  const handleCollaborationUpdate = useCallback((data: CollaborationUserData) => {
    if (!data.changes || data.changes.length === 0) {
      return;
    }
    
    // Process each change
    data.changes.forEach(change => {
      if (change.field === 'cursor') {
        // Update cursor position for a participant
        setState(prev => ({
          ...prev,
          participants: prev.participants.map(p => 
            p.userId === data.userId 
              ? { ...p, cursorPosition: change.value } 
              : p
          )
        }));
        
        // Call the participant updated handler
        if (onParticipantUpdated) {
          const participant = state.participants.find(p => p.userId === data.userId);
          if (participant) {
            onParticipantUpdated({
              ...participant,
              cursorPosition: change.value
            });
          }
        }
      }
      else if (change.field === 'status') {
        // Update status for a participant
        setState(prev => ({
          ...prev,
          participants: prev.participants.map(p => 
            p.userId === data.userId 
              ? { ...p, status: change.value } 
              : p
          )
        }));
        
        // Call the participant updated handler
        if (onParticipantUpdated) {
          const participant = state.participants.find(p => p.userId === data.userId);
          if (participant) {
            onParticipantUpdated({
              ...participant,
              status: change.value
            });
          }
        }
      }
      else if (change.field === 'participant') {
        if (data.action === 'join') {
          // Add new participant
          setState(prev => {
            const exists = prev.participants.some(p => p.userId === change.value.userId);
            
            if (exists) {
              return {
                ...prev,
                participants: prev.participants.map(p => 
                  p.userId === change.value.userId 
                    ? { ...p, ...change.value, status: 'online' } 
                    : p
                )
              };
            } else {
              return {
                ...prev,
                participants: [...prev.participants, change.value]
              };
            }
          });
          
          // Call the participant joined handler
          if (onParticipantJoined) {
            onParticipantJoined(change.value);
          }
        }
        else if (data.action === 'leave' || change.value.status === 'offline') {
          // Update participant to offline status
          setState(prev => ({
            ...prev,
            participants: prev.participants.map(p => 
              p.userId === change.value.userId 
                ? { ...p, status: 'offline' } 
                : p
            )
          }));
          
          // Call the participant left handler
          if (onParticipantLeft) {
            onParticipantLeft(change.value);
          }
        }
      }
      else if (change.field === 'change') {
        // Handle document change
        setState(prev => ({
          ...prev,
          document: {
            content: prev.document.content,
            version: change.value.docVersion
          }
        }));
        
        // Call the document change handler
        if (onDocumentChange) {
          onDocumentChange(change.value);
        }
      }
      else if (change.field === 'comment') {
        // Add new comment
        setState(prev => ({
          ...prev,
          comments: [...prev.comments, change.value]
        }));
        
        // Call the comment added handler
        if (onCommentAdded) {
          onCommentAdded(change.value);
        }
      }
      else if (change.field === 'resolveComment') {
        // Mark comment as resolved
        setState(prev => ({
          ...prev,
          comments: prev.comments.map(c => 
            c.id === change.value.commentId 
              ? { 
                  ...c, 
                  resolved: true, 
                  resolvedBy: change.value.resolvedBy,
                  resolvedAt: change.value.resolvedAt 
                } 
              : c
          )
        }));
        
        // Call the comment resolved handler
        if (onCommentResolved) {
          const comment = state.comments.find(c => c.id === change.value.commentId);
          if (comment) {
            onCommentResolved({
              ...comment,
              resolved: true,
              resolvedBy: change.value.resolvedBy,
              resolvedAt: change.value.resolvedAt
            });
          }
        }
      }
    });
  }, [
    onDocumentChange, 
    onCommentAdded, 
    onCommentResolved, 
    onParticipantJoined, 
    onParticipantLeft, 
    onParticipantUpdated,
    state.participants,
    state.comments
  ]);
  
  // Schedule reconnect with exponential backoff
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.log('Max reconnection attempts reached');
      return;
    }
    
    // Calculate delay with exponential backoff
    const delay = BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current);
    console.log(`Scheduling reconnection attempt in ${delay}ms`);
    
    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    // Set new timeout
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current++;
      connect();
    }, delay);
  }, [connect]);
  
  // Send a message to the server
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Add the connection ID to the message
      const messageWithConnectionId = {
        ...message,
        connectionId: connectionIdRef.current
      };
      
      wsRef.current.send(JSON.stringify(messageWithConnectionId));
      return true;
    }
    return false;
  }, []);
  
  // Update cursor position
  const updateCursorPosition = useCallback((position: { x: number, y: number }) => {
    return sendMessage({
      type: 'collaborationUpdate',
      action: 'update',
      entityId: sessionId,
      userId,
      changes: [{
        field: 'cursor',
        value: position
      }]
    });
  }, [sendMessage, sessionId, userId]);
  
  // Update status
  const updateStatus = useCallback((status: 'online' | 'idle' | 'offline') => {
    return sendMessage({
      type: 'collaborationUpdate',
      action: 'update',
      entityId: sessionId,
      userId,
      changes: [{
        field: 'status',
        value: status
      }]
    });
  }, [sendMessage, sessionId, userId]);
  
  // Send a document change
  const sendChange = useCallback((changeData: any) => {
    return sendMessage({
      type: 'collaborationUpdate',
      action: 'update',
      entityId: sessionId,
      userId,
      changes: [{
        field: 'change',
        value: changeData
      }]
    });
  }, [sendMessage, sessionId, userId]);
  
  // Add a comment
  const addComment = useCallback((commentData: any) => {
    return sendMessage({
      type: 'collaborationUpdate',
      action: 'update',
      entityId: sessionId,
      userId,
      changes: [{
        field: 'comment',
        value: commentData
      }]
    });
  }, [sendMessage, sessionId, userId]);
  
  // Resolve a comment
  const resolveComment = useCallback((commentId: string) => {
    return sendMessage({
      type: 'collaborationUpdate',
      action: 'update',
      entityId: sessionId,
      userId,
      changes: [{
        field: 'resolveComment',
        value: {
          commentId
        }
      }]
    });
  }, [sendMessage, sessionId, userId]);
  
  // Leave the session
  const leaveSession = useCallback(() => {
    const result = sendMessage({
      type: 'collaborationUpdate',
      action: 'leave',
      entityId: sessionId,
      userId
    });
    
    // Clear the connection ID
    connectionIdRef.current = null;
    
    return result;
  }, [sendMessage, sessionId, userId]);
  
  // Connect when the hook is first used
  useEffect(() => {
    connect();
    
    return () => {
      // Clean up WebSocket and any pending reconnect timeouts
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connect]);
  
  // Return state and methods
  return {
    ...state,
    updateCursorPosition,
    updateStatus,
    sendChange,
    addComment,
    resolveComment,
    leaveSession
  };
}