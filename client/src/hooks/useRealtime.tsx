import { useEffect, useRef, useState } from 'react';

// Get the WebSocket URL based on the current window location
const getWebSocketUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws`;
};

// This hook manages a WebSocket connection and subscribes to a specific channel
export function useRealtime(channel: string, onMessage: (data: any) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const channelRef = useRef(channel);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update channel ref when channel changes
  useEffect(() => {
    channelRef.current = channel;
  }, [channel]);

  useEffect(() => {
    // Connect to WebSocket and set up event handlers
    const connect = () => {
      try {
        console.log('Connecting to WebSocket server at', getWebSocketUrl());
        const socket = new WebSocket(getWebSocketUrl());
        socketRef.current = socket;

        socket.onopen = () => {
          console.log('WebSocket connection established');
          setIsConnected(true);
          console.log('WebSocket connected');

          // Send authentication message
          const authMessage = {
            type: 'connection',
            channel: channelRef.current
          };
          socket.send(JSON.stringify(authMessage));
        };

        socket.onmessage = (event) => {
          console.log('Received WebSocket message:', event.data);
          try {
            const data = JSON.parse(event.data);
            
            // Check if this is a general system message or a channel-specific message
            if (data.type === 'connection') {
              console.log('WebSocket authentication successful');
            } else if (data.channel === channelRef.current || 
                      // Also handle collaboration messages which use a different format
                      (data.type && channelRef.current.startsWith('collaboration_'))) {
              onMessage(data);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        socket.onclose = (event) => {
          console.log('WebSocket connection closed:', event.code, event.reason);
          setIsConnected(false);
          console.log('WebSocket disconnected');

          // Attempt to reconnect after a delay
          console.log('Scheduling reconnection attempt in 1000ms');
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(connect, 1000);
        };

        socket.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        // Attempt to reconnect after a delay
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(connect, 1000);
      }
    };

    connect();

    // Clean up WebSocket connection when the component unmounts
    return () => {
      if (socketRef.current) {
        console.log('Closing WebSocket connection');
        socketRef.current.close();
        socketRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [onMessage]);

  // Function to send a message through the WebSocket
  const sendMessage = (message: any) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message - WebSocket is not connected');
      return false;
    }

    try {
      // Add channel information to the message
      const messageWithChannel = {
        ...message,
        channel: channelRef.current
      };
      
      socketRef.current.send(JSON.stringify(messageWithChannel));
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  };

  return {
    isConnected,
    sendMessage
  };
}