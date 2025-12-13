import { useState, useEffect } from 'react';
import { useRealtime } from '@/hooks/useRealtime';
import { SupportAgentTypingData } from '../../../shared/websocket-types';

interface TypingIndicatorProps {
  ticketId: number;
  currentUserId: number;
}

export default function TypingIndicator({ ticketId, currentUserId }: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<{
    userId: number;
    username: string;
    lastActive: Date;
  }[]>([]);
  
  // Connect to real-time typing indicator updates
  const { connected } = useRealtime(
    'supportAgentTyping',
    (data: SupportAgentTypingData) => {
      // Only process updates for this ticket
      if (data.ticketId !== ticketId) return;
      
      // Ignore our own typing events
      if (data.userId === currentUserId) return;
      
      if (data.isTyping) {
        // Add or update typing user
        setTypingUsers(prev => {
          const existing = prev.find(user => user.userId === data.userId);
          if (existing) {
            // Update last active time
            return prev.map(user => 
              user.userId === data.userId
                ? { ...user, lastActive: new Date() }
                : user
            );
          } else {
            // Add new typing user
            return [
              ...prev,
              {
                userId: data.userId,
                username: data.username || `User ${data.userId}`,
                lastActive: new Date(),
              },
            ];
          }
        });
      } else {
        // Remove user from typing list
        setTypingUsers(prev => prev.filter(user => user.userId !== data.userId));
      }
    }
  );
  
  // Clean up users who stopped typing (after 3 seconds of inactivity)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTypingUsers(prev => 
        prev.filter(user => {
          const timeSinceActive = now.getTime() - user.lastActive.getTime();
          return timeSinceActive < 3000; // 3 seconds
        })
      );
    }, 1000); // Check every second
    
    return () => clearInterval(interval);
  }, []);
  
  // Send typing status
  const [lastTypingEvent, setLastTypingEvent] = useState<Date | null>(null);
  
  const { sendMessage } = useRealtime('supportAgentTyping');
  
  // Utility function to send typing status (throttled)
  const sendTypingStatus = (isTyping: boolean) => {
    const now = new Date();
    
    // Throttle events to once every 2 seconds when typing
    if (isTyping && lastTypingEvent) {
      const timeSinceLastEvent = now.getTime() - lastTypingEvent.getTime();
      if (timeSinceLastEvent < 2000) return; // Don't send too many events
    }
    
    sendMessage({
      ticketId,
      userId: currentUserId,
      isTyping,
      lastActive: now.toISOString(),
    });
    
    setLastTypingEvent(now);
  };
  
  // If not connected or no users are typing, don't render anything
  if (!connected || typingUsers.length === 0) {
    return null;
  }
  
  return (
    <div className="flex items-center h-6 text-sm text-muted-foreground px-2 italic">
      {typingUsers.length === 1 ? (
        <div className="flex items-center">
          <span className="inline-block mr-1">{typingUsers[0].username}</span>
          <span>is typing</span>
          <DotAnimation />
        </div>
      ) : (
        <div className="flex items-center">
          <span className="inline-block mr-1">
            {typingUsers.map(user => user.username).join(', ')}
          </span>
          <span>are typing</span>
          <DotAnimation />
        </div>
      )}
    </div>
  );
}

// Animated dots for the typing indicator
function DotAnimation() {
  const [dots, setDots] = useState('.');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '.';
        return prev + '.';
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  return <span className="ml-0.5">{dots}</span>;
}

// Higher-order component to wrap text inputs with typing detection
export function withTypingDetection(Component: React.ComponentType<any>, options: {
  ticketId: number;
  userId: number;
}) {
  return (props: any) => {
    const [isTyping, setIsTyping] = useState(false);
    const { sendMessage } = useRealtime('supportAgentTyping');
    
    // Track when typing starts
    const handleTypingStart = () => {
      if (!isTyping) {
        setIsTyping(true);
        sendMessage({
          ticketId: options.ticketId,
          userId: options.userId,
          isTyping: true,
          lastActive: new Date().toISOString(),
        });
      }
    };
    
    // Track when typing stops
    const handleTypingEnd = () => {
      if (isTyping) {
        setIsTyping(false);
        sendMessage({
          ticketId: options.ticketId,
          userId: options.userId,
          isTyping: false,
          lastActive: new Date().toISOString(),
        });
      }
    };
    
    // Set up input event handlers with debouncing for end-of-typing
    let typingTimer: NodeJS.Timeout | null = null;
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
      handleTypingStart();
      
      // Clear the existing timer
      if (typingTimer) {
        clearTimeout(typingTimer);
      }
      
      // Forward the event
      if (props.onKeyDown) {
        props.onKeyDown(e);
      }
    };
    
    const handleKeyUp = (e: React.KeyboardEvent) => {
      // Set a timer to detect when typing stops
      if (typingTimer) {
        clearTimeout(typingTimer);
      }
      
      typingTimer = setTimeout(handleTypingEnd, 2000); // 2 seconds of inactivity means stopped typing
      
      // Forward the event
      if (props.onKeyUp) {
        props.onKeyUp(e);
      }
    };
    
    // Clean up when unmounting
    useEffect(() => {
      return () => {
        if (typingTimer) {
          clearTimeout(typingTimer);
        }
        
        if (isTyping) {
          sendMessage({
            ticketId: options.ticketId,
            userId: options.userId,
            isTyping: false,
            lastActive: new Date().toISOString(),
          });
        }
      };
    }, [isTyping]);
    
    return (
      <Component
        {...props}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
      />
    );
  };
}