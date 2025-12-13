import React, { useState, useEffect, useRef } from 'react';
import { useCollaboration } from '../../hooks/useCollaboration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  UserCircle,
  MessageCircle,
  Check,
  Send,
  ArrowUpCircle,
  ArrowDownCircle,
  Edit,
} from 'lucide-react';

interface CollaborativeEditorProps {
  sessionId: number;
  userId: number;
  username: string;
  initialContent?: string;
  readOnly?: boolean;
}

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  sessionId,
  userId,
  username,
  initialContent = '',
  readOnly = false,
}) => {
  const [content, setContent] = useState(initialContent);
  const [comment, setComment] = useState('');
  const [commentPosition, setCommentPosition] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Initialize collaboration hook
  const {
    connected,
    connectionId,
    participants,
    document: collaborativeDocument,
    comments,
    updateCursorPosition,
    updateStatus,
    sendChange,
    addComment,
    resolveComment,
    leaveSession,
  } = useCollaboration({
    sessionId,
    userId,
    username,
    onDocumentChange: (change) => {
      console.log('Document changed:', change);
      if (change.content !== undefined) {
        setContent(change.content);
      }
    },
    onCommentAdded: (comment) => {
      console.log('Comment added:', comment);
      toast({
        title: 'New Comment',
        description: `${comment.username}: ${comment.text}`,
      });
    },
    onCommentResolved: (comment) => {
      console.log('Comment resolved:', comment);
      toast({
        title: 'Comment Resolved',
        description: `Comment by ${comment.username} has been resolved`,
        variant: 'default',
      });
    },
    onParticipantJoined: (participant) => {
      console.log('Participant joined:', participant);
      toast({
        title: 'User Joined',
        description: `${participant.username} joined the session`,
        variant: 'default',
      });
    },
    onParticipantLeft: (participant) => {
      console.log('Participant left:', participant);
      toast({
        title: 'User Left',
        description: `${participant.username} left the session`,
        variant: 'default',
      });
    },
  });

  // Update content when document changes from server
  useEffect(() => {
    if (collaborativeDocument && collaborativeDocument.content) {
      setContent(collaborativeDocument.content);
    }
  }, [collaborativeDocument]);

  // Handle cursor position change
  const handleCursorPositionChange = () => {
    if (!editorRef.current) return;
    
    const cursorPosition = editorRef.current.selectionStart;
    setCommentPosition(cursorPosition);
    
    // Send cursor position to server
    updateCursorPosition({ 
      x: cursorPosition, 
      y: 0 // We're using a 1D text editor, so y is always 0
    });
  };

  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;
    
    const newContent = e.target.value;
    setContent(newContent);
    
    // Debounce sending changes to server
    // In a real implementation, you might want to track text differences
    // and send only the changes rather than the entire content
    setIsSaving(true);
    sendChange({
      content: newContent,
      docVersion: collaborativeDocument?.version || 0 + 1,
      timestamp: new Date().toISOString(),
      userId,
      type: 'replace'
    });
    
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  // Handle adding comment
  const handleAddComment = () => {
    if (!comment || commentPosition === null) return;
    
    addComment({
      text: comment,
      position: commentPosition,
      userId,
      username,
      createdAt: new Date().toISOString(),
      resolved: false
    });
    
    setComment('');
  };

  // Handle resolving comment
  const handleResolveComment = (commentId: string) => {
    resolveComment(commentId);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Notify server that user is leaving
      leaveSession();
    };
  }, [leaveSession]);

  // Update status when user focuses/blurs the editor
  useEffect(() => {
    const handleFocus = () => {
      updateStatus('online');
      setIsEditing(true);
    };
    
    const handleBlur = () => {
      updateStatus('idle');
      setIsEditing(false);
    };
    
    if (editorRef.current) {
      editorRef.current.addEventListener('focus', handleFocus);
      editorRef.current.addEventListener('blur', handleBlur);
    }
    
    return () => {
      if (editorRef.current) {
        editorRef.current.removeEventListener('focus', handleFocus);
        editorRef.current.removeEventListener('blur', handleBlur);
      }
    };
  }, [updateStatus]);

  // Helper to get participant status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'idle':
        return 'bg-yellow-500';
      case 'offline':
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Main editor */}
      <div className="md:col-span-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Collaborative Editor
              {connected && (
                <Badge variant="outline" className="ml-2">
                  Connected
                </Badge>
              )}
              {isSaving && (
                <Badge variant="outline" className="ml-2">
                  Saving...
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              {participants
                .filter(p => p.status !== 'offline')
                .map(participant => (
                  <TooltipProvider key={participant.userId}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          <div className={`w-3 h-3 absolute bottom-0 right-0 rounded-full ${getStatusColor(participant.status)}`}></div>
                          <UserCircle 
                            size={24} 
                            className={participant.userId === userId ? 'text-primary' : 'text-gray-500'} 
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{participant.username} ({participant.status})</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              ref={editorRef}
              value={content}
              onChange={handleContentChange}
              onKeyUp={handleCursorPositionChange}
              onClick={handleCursorPositionChange}
              readOnly={readOnly}
              placeholder="Start typing..."
              className="min-h-[300px] font-mono"
            />
            
            {!readOnly && (
              <div className="mt-4 flex gap-2">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1"
                />
                <Button 
                  onClick={handleAddComment} 
                  disabled={!comment || commentPosition === null}
                  className="self-end"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Comment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Comments sidebar */}
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {comments.length === 0 ? (
                <div className="text-center text-muted-foreground p-4">
                  No comments yet
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map(comment => (
                    <div 
                      key={comment.id} 
                      className={`p-3 rounded-lg ${comment.resolved ? 'bg-muted/50' : 'bg-muted'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-semibold flex items-center">
                          <UserCircle className="h-4 w-4 mr-1" />
                          {comment.username}
                        </div>
                        {!comment.resolved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResolveComment(comment.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="text-sm">{comment.text}</div>
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <div>
                          <ArrowUpCircle className="inline h-3 w-3 mr-1" />
                          Pos: {comment.position}
                        </div>
                        {comment.resolved && (
                          <div>
                            Resolved by {participants.find(p => p.userId === comment.resolvedBy)?.username || 'Unknown'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export { CollaborativeEditor };
export default CollaborativeEditor;