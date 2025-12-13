import { CollaborationAction } from '@shared/schema';

// Define callback types for different events
export type MessageCallback = (data: any) => void;
export type ErrorCallback = (error: any) => void;
export type ConnectionCallback = () => void;

// Define collaboration service class
export class CollaborationService {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private messageListeners: Map<string, MessageCallback[]> = new Map();
  private errorListeners: ErrorCallback[] = [];
  private connectListeners: ConnectionCallback[] = [];
  private disconnectListeners: ConnectionCallback[] = [];
  private reconnecting: boolean = false;
  private sessionId: number | null = null;
  private userId: number | null = null;

  // Initialize the WebSocket connection
  connect(sessionId: number, userId: number) {
    this.sessionId = sessionId;
    this.userId = userId;

    // If already connected, disconnect first
    if (this.socket) {
      this.disconnect();
    }

    // Create the WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    this.socket = new WebSocket(wsUrl);

    // Set up event handlers
    this.socket.onopen = this.handleOpen.bind(this);
    this.socket.onmessage = this.handleMessage.bind(this);
    this.socket.onerror = this.handleError.bind(this);
    this.socket.onclose = this.handleClose.bind(this);
    
    console.log(`Connecting to collaboration session ${sessionId} as user ${userId}...`);
  }

  // Disconnect and clean up
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.sessionId = null;
    this.userId = null;
    console.log('Disconnected from collaboration session');
  }

  // Join a collaboration session
  joinSession() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.sessionId || !this.userId) {
      console.error('Cannot join session: not connected');
      return;
    }

    const action: CollaborationAction = {
      type: 'JOIN_SESSION',
      sessionId: this.sessionId,
      userId: this.userId
    };

    this.sendMessage(action);
  }

  // Leave the current session
  leaveSession() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.sessionId || !this.userId) {
      console.error('Cannot leave session: not connected');
      return;
    }

    const action: CollaborationAction = {
      type: 'LEAVE_SESSION',
      sessionId: this.sessionId,
      userId: this.userId
    };

    this.sendMessage(action);
  }

  // Update cursor position
  updateCursor(position: { x: number, y: number }) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.sessionId || !this.userId) {
      console.error('Cannot update cursor: not connected');
      return;
    }

    const action: CollaborationAction = {
      type: 'UPDATE_CURSOR',
      sessionId: this.sessionId,
      userId: this.userId,
      position
    };

    this.sendMessage(action);
  }

  // Send a change to the collaboration session
  sendChange(change: any) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.sessionId || !this.userId) {
      console.error('Cannot send change: not connected');
      return;
    }

    const action: CollaborationAction = {
      type: 'ADD_CHANGE',
      change
    };

    this.sendMessage(action);
  }

  // Add a comment to the collaboration session
  addComment(comment: any) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.sessionId || !this.userId) {
      console.error('Cannot add comment: not connected');
      return;
    }

    const action: CollaborationAction = {
      type: 'ADD_COMMENT',
      comment
    };

    this.sendMessage(action);
  }

  // Resolve a comment
  resolveComment(commentId: number) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.sessionId || !this.userId) {
      console.error('Cannot resolve comment: not connected');
      return;
    }

    const action: CollaborationAction = {
      type: 'RESOLVE_COMMENT',
      commentId,
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.sendMessage(action);
  }

  // Request synchronization of session data
  requestSync() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.sessionId || !this.userId) {
      console.error('Cannot request sync: not connected');
      return;
    }

    const action: CollaborationAction = {
      type: 'SYNC_REQUEST',
      sessionId: this.sessionId,
      userId: this.userId
    };

    this.sendMessage(action);
  }

  // Update user status
  updateStatus(status: string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.sessionId || !this.userId) {
      console.error('Cannot update status: not connected');
      return;
    }

    const action: CollaborationAction = {
      type: 'USER_STATUS',
      sessionId: this.sessionId,
      userId: this.userId,
      status
    };

    this.sendMessage(action);
  }

  // Add a message listener for specific message types
  onMessage(type: string, callback: MessageCallback) {
    if (!this.messageListeners.has(type)) {
      this.messageListeners.set(type, []);
    }
    this.messageListeners.get(type)?.push(callback);
  }

  // Remove a message listener
  offMessage(type: string, callback: MessageCallback) {
    if (!this.messageListeners.has(type)) return;
    
    const listeners = this.messageListeners.get(type) || [];
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  // Add an error listener
  onError(callback: ErrorCallback) {
    this.errorListeners.push(callback);
  }

  // Remove an error listener
  offError(callback: ErrorCallback) {
    const index = this.errorListeners.indexOf(callback);
    if (index !== -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  // Add a connection listener
  onConnect(callback: ConnectionCallback) {
    this.connectListeners.push(callback);
  }

  // Remove a connection listener
  offConnect(callback: ConnectionCallback) {
    const index = this.connectListeners.indexOf(callback);
    if (index !== -1) {
      this.connectListeners.splice(index, 1);
    }
  }

  // Add a disconnection listener
  onDisconnect(callback: ConnectionCallback) {
    this.disconnectListeners.push(callback);
  }

  // Remove a disconnection listener
  offDisconnect(callback: ConnectionCallback) {
    const index = this.disconnectListeners.indexOf(callback);
    if (index !== -1) {
      this.disconnectListeners.splice(index, 1);
    }
  }

  // Send a message to the server
  private sendMessage(message: CollaborationAction) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  // Handle WebSocket open event
  private handleOpen() {
    console.log('WebSocket connection established');
    this.reconnecting = false;
    
    // Notify all connect listeners
    this.connectListeners.forEach(listener => listener());
    
    // Join the session if session and user IDs are available
    if (this.sessionId !== null && this.userId !== null) {
      this.joinSession();
    }
  }

  // Handle WebSocket message event
  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      const type = data.type;
      
      if (type) {
        // Notify type-specific listeners
        const listeners = this.messageListeners.get(type) || [];
        listeners.forEach(listener => listener(data));
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  // Handle WebSocket error event
  private handleError(error: Event) {
    console.error('WebSocket error:', error);
    
    // Notify all error listeners
    this.errorListeners.forEach(listener => listener(error));
  }

  // Handle WebSocket close event
  private handleClose(event: CloseEvent) {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    
    // Notify all disconnect listeners
    this.disconnectListeners.forEach(listener => listener());
    
    // Attempt to reconnect if not intentionally disconnected
    if (this.sessionId && this.userId && !this.reconnecting) {
      this.reconnecting = true;
      this.reconnectTimer = setTimeout(() => {
        console.log('Attempting to reconnect...');
        this.connect(this.sessionId!, this.userId!);
      }, 3000); // Retry after 3 seconds
    }
  }
}

// Export a singleton instance
export const collaborationService = new CollaborationService();