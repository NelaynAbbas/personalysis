import { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Send, 
  User 
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRealtime } from '@/hooks/useRealtime';
import TypingIndicator, { withTypingDetection } from './TypingIndicator';
import { TicketStatus, TicketPriority, TicketType } from '../../../shared/schema';

// Create the enhanced Textarea component with typing detection
const TypingTextarea = ({ ticketId, userId }: { ticketId: number, userId: number }) => {
  const EnhancedTextarea = withTypingDetection(Textarea, { ticketId, userId });
  return <EnhancedTextarea placeholder="Type your reply..." className="min-h-[100px]" />;
};

interface SupportTicketProps {
  ticketId: number;
  currentUserId: number;
  initialData?: {
    ticketNumber: string;
    subject: string;
    description: string;
    status: string;
    priority: string;
    type: string;
    createdAt: string;
    createdBy: {
      id: number;
      name: string;
    };
    assignedTo?: {
      id: number;
      name: string;
    };
    comments: Array<{
      id: number;
      userId: number;
      username: string;
      content: string;
      isInternal: boolean;
      createdAt: string;
    }>;
  };
}

export default function SupportTicket({ 
  ticketId, 
  currentUserId,
  initialData = {
    ticketNumber: `TICK-${ticketId}`,
    subject: 'Loading...',
    description: 'Loading ticket details...',
    status: TicketStatus.NEW,
    priority: TicketPriority.MEDIUM,
    type: TicketType.GENERAL,
    createdAt: new Date().toISOString(),
    createdBy: {
      id: 1,
      name: 'User'
    },
    comments: []
  }
}: SupportTicketProps) {
  const { toast } = useToast();
  const [ticketData, setTicketData] = useState(initialData);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Subscribe to real-time ticket updates
  const { connected } = useRealtime(
    'supportTicketUpdate',
    (data) => {
      // Only process updates for this ticket
      if (data.ticketId !== ticketId) return;
      
      // Handle different update types
      switch (data.action) {
        case 'comment':
          toast({
            title: 'New Comment',
            description: `${data.message || 'Someone commented on this ticket'}`,
            variant: 'default',
          });
          
          // Fetch the latest ticket data
          // In a real implementation, we'd update the ticket data from the WebSocket message
          // or make an API call to get the latest data
          break;
          
        case 'status_change':
          toast({
            title: 'Status Changed',
            description: `Ticket status changed to ${data.status}`,
            variant: 'default',
          });
          
          // Update ticket status
          setTicketData(prev => ({
            ...prev,
            status: data.status || prev.status
          }));
          break;
          
        case 'assignment':
          toast({
            title: 'Ticket Assignment',
            description: `Ticket has been assigned to a new agent`,
            variant: 'default',
          });
          
          // In a real implementation, we'd update the assignee from the WebSocket message
          break;
      }
    }
  );
  
  // Submit a new comment
  const handleCommentSubmit = () => {
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    
    // Mock API call
    setTimeout(() => {
      // Add comment locally
      const newCommentObj = {
        id: ticketData.comments.length + 1,
        userId: currentUserId,
        username: 'Current User', // In a real app, you'd get the actual username
        content: newComment,
        isInternal,
        createdAt: new Date().toISOString()
      };
      
      setTicketData(prev => ({
        ...prev,
        comments: [...prev.comments, newCommentObj]
      }));
      
      // Send WebSocket notification
      const { sendMessage } = useRealtime('supportTicketUpdate');
      sendMessage({
        action: 'comment',
        ticketId,
        userId: currentUserId,
        message: `New comment added by ${newCommentObj.username}`,
        timestamp: new Date().toISOString()
      });
      
      setNewComment('');
      setIsInternal(false);
      setSubmitting(false);
      
      toast({
        title: 'Comment Added',
        description: 'Your comment has been added to the ticket',
        variant: 'default',
      });
    }, 500); // Simulate API delay
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case TicketStatus.NEW:
        return 'default';
      case TicketStatus.OPEN:
        return 'outline';
      case TicketStatus.IN_PROGRESS:
        return 'secondary';
      case TicketStatus.WAITING_FOR_CUSTOMER:
        return 'warning';
      case TicketStatus.RESOLVED:
        return 'success';
      case TicketStatus.CLOSED:
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case TicketPriority.LOW:
        return 'outline';
      case TicketPriority.MEDIUM:
        return 'secondary';
      case TicketPriority.HIGH:
        return 'warning';
      case TicketPriority.URGENT:
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">{ticketData.subject}</CardTitle>
              <Badge variant="outline">{ticketData.ticketNumber}</Badge>
            </div>
            <CardDescription className="mt-1 flex items-center gap-2">
              <User className="h-3 w-3" />
              <span>
                Opened by {ticketData.createdBy.name} on {format(new Date(ticketData.createdAt), 'MMM d, yyyy')}
              </span>
            </CardDescription>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant={getStatusBadgeVariant(ticketData.status)}>
              {ticketData.status}
            </Badge>
            <Badge variant={getPriorityBadgeVariant(ticketData.priority)}>
              {ticketData.priority} Priority
            </Badge>
            <Badge variant="outline">{ticketData.type}</Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div className="rounded-md border p-4">
            <h3 className="text-sm font-medium mb-2">Description</h3>
            <p className="text-muted-foreground">{ticketData.description}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center">
              <MessageSquare className="h-4 w-4 mr-1" />
              Comments ({ticketData.comments.length})
            </h3>
            
            {ticketData.comments.length > 0 ? (
              <div className="space-y-4">
                {ticketData.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`rounded-md p-3 ${
                      comment.isInternal ? 'bg-muted/50 border border-dashed' : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={`https://avatar.vercel.sh/${comment.userId}.png`} />
                          <AvatarFallback>{comment.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{comment.username}</span>
                        {comment.isInternal && (
                          <Badge variant="outline" className="ml-2 text-xs">Internal Note</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                      </div>
                    </div>
                    
                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No comments yet</p>
                <p className="text-xs mt-1">Be the first to add a comment</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex-col items-start">
        <Separator className="mb-4" />
        
        <div className="w-full">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Add a Reply</h3>
            <div className="flex items-center">
              <Button 
                variant={isInternal ? "default" : "outline"} 
                size="sm"
                onClick={() => setIsInternal(!isInternal)}
                className="text-xs"
              >
                {isInternal ? 'Internal Note' : 'Public Reply'}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <TypingTextarea ticketId={ticketId} userId={currentUserId} />
            
            <TypingIndicator 
              ticketId={ticketId}
              currentUserId={currentUserId}
            />
            
            <div className="flex justify-end">
              <Button 
                disabled={!newComment.trim() || submitting}
                onClick={handleCommentSubmit}
              >
                {submitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {isInternal ? 'Add Internal Note' : 'Send Reply'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}