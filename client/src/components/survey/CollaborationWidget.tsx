import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';
import { useToast } from '@/hooks/use-toast';

interface CollaboratorData {
  userId: number;
  username: string;
  avatarUrl?: string;
  isActive: boolean;
  lastActive: string;
  editingField?: string;
  position?: {
    x: number;
    y: number;
  };
}

interface CollaborationWidgetProps {
  entityId: string | number;
  entityType: string;
  currentUserId: number;
  maxVisible?: number;
}

export default function CollaborationWidget({
  entityId,
  entityType,
  currentUserId,
  maxVisible = 3
}: CollaborationWidgetProps) {
  const [collaborators, setCollaborators] = useState<CollaboratorData[]>([]);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const { toast } = useToast();
  
  // Connect to real-time collaboration updates
  const { connected, sendMessage } = useRealtime('collaborationUpdate', (data) => {
    // Only process updates for this entity
    if (
      data.entityId.toString() !== entityId.toString() ||
      data.entityType !== entityType
    ) {
      return;
    }
    
    console.log('Received collaboration update:', data);
    
    // Process different collaboration actions
    switch (data.action) {
      case 'join':
        // Add new collaborator
        setCollaborators(prev => {
          // Check if already in the list
          if (prev.some(c => c.userId === data.userId)) {
            // Update existing entry
            return prev.map(c => 
              c.userId === data.userId 
                ? {
                    ...c,
                    isActive: true,
                    lastActive: data.timestamp,
                  }
                : c
            );
          }
          
          // Add new collaborator
          return [
            ...prev,
            {
              userId: data.userId,
              username: data.username,
              isActive: true,
              lastActive: data.timestamp,
            }
          ];
        });
        
        // Show notification for other users, not own join event
        if (data.userId !== currentUserId) {
          toast({
            title: "New Collaborator",
            description: `${data.username} has joined the session`,
            duration: 3000,
          });
        }
        break;
        
      case 'leave':
        // Mark collaborator as inactive
        setCollaborators(prev => 
          prev.map(c => 
            c.userId === data.userId 
              ? {
                  ...c,
                  isActive: false,
                  lastActive: data.timestamp,
                  editingField: undefined,
                }
              : c
          )
        );
        break;
        
      case 'edit':
        // Update collaborator editing state
        setCollaborators(prev => 
          prev.map(c => 
            c.userId === data.userId 
              ? {
                  ...c,
                  isActive: true,
                  lastActive: data.timestamp,
                  editingField: data.editingField,
                  position: data.position,
                }
              : c
          )
        );
        break;
        
      case 'comment':
        // Process comment, show notification
        if (data.userId !== currentUserId) {
          toast({
            title: "New Comment",
            description: `${data.username}: ${data.commentText?.substring(0, 50)}${data.commentText && data.commentText.length > 50 ? '...' : ''}`,
            duration: 5000,
          });
        }
        break;
    }
  });
  
  // Join collaboration session on mount
  useEffect(() => {
    if (connected) {
      // Send join message
      sendMessage({
        userId: currentUserId,
        username: 'Current User', // In a real app, get from auth context
        entityId,
        entityType,
        action: 'join',
      });
      
      // Send leave message on unmount
      return () => {
        sendMessage({
          userId: currentUserId,
          username: 'Current User', // In a real app, get from auth context
          entityId,
          entityType,
          action: 'leave',
        });
      };
    }
  }, [connected, currentUserId, entityId, entityType, sendMessage]);
  
  // Filter active collaborators to display
  const activeCollaborators = collaborators.filter(c => c.isActive && c.userId !== currentUserId);
  const totalCollaborators = activeCollaborators.length;
  const visibleCollaborators = activeCollaborators.slice(0, maxVisible);
  const remainingCount = Math.max(0, totalCollaborators - maxVisible);
  
  // Function to share collaboration link
  const shareCollaboration = () => {
    const shareUrl = `${window.location.origin}/${entityType}/${entityId}/collaborate`;
    
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast({
          title: "Collaboration Link Copied",
          description: "Link has been copied to clipboard. Share it with your team.",
          duration: 3000,
        });
      })
      .catch(error => {
        console.error('Failed to copy link:', error);
        toast({
          title: "Failed to Copy",
          description: "Could not copy collaboration link to clipboard.",
          variant: "destructive",
          duration: 3000,
        });
      });
  };
  
  return (
    <>
      <div className="flex items-center">
        {visibleCollaborators.length > 0 ? (
          <div className="flex -space-x-2 mr-2 items-center">
            {visibleCollaborators.map(collaborator => (
              <TooltipProvider key={collaborator.userId}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="h-8 w-8 border-2 border-white cursor-pointer">
                      {collaborator.avatarUrl ? (
                        <AvatarImage src={collaborator.avatarUrl} alt={collaborator.username} />
                      ) : (
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {collaborator.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-medium">{collaborator.username}</p>
                      {collaborator.editingField && (
                        <p className="text-xs text-gray-500">
                          Editing: {collaborator.editingField}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            
            {remainingCount > 0 && (
              <Avatar 
                className="h-8 w-8 border-2 border-white cursor-pointer bg-muted"
                onClick={() => setShowCollaborators(true)}
              >
                <AvatarFallback>+{remainingCount}</AvatarFallback>
              </Avatar>
            )}
          </div>
        ) : (
          <Badge variant="outline" className="mr-2 bg-gray-50 text-gray-500">
            <Users className="h-3 w-3 mr-1" />
            No collaborators
          </Badge>
        )}
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowInviteDialog(true)}
          className="text-xs h-8"
        >
          Invite
        </Button>
      </div>
      
      {/* Collaborators dialog */}
      <AlertDialog open={showCollaborators} onOpenChange={setShowCollaborators}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Active Collaborators</AlertDialogTitle>
            <AlertDialogDescription>
              These users are currently collaborating on this {entityType}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 my-4">
            {activeCollaborators.length > 0 ? (
              activeCollaborators.map(collaborator => (
                <div key={collaborator.userId} className="flex items-center space-x-3">
                  <Avatar>
                    {collaborator.avatarUrl ? (
                      <AvatarImage src={collaborator.avatarUrl} alt={collaborator.username} />
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {collaborator.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium">{collaborator.username}</p>
                    {collaborator.editingField ? (
                      <p className="text-xs text-gray-500">
                        Editing: {collaborator.editingField}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500">
                        Active {new Date(collaborator.lastActive).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center">No active collaborators</p>
            )}
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Invite dialog */}
      <AlertDialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Invite Collaborators</AlertDialogTitle>
            <AlertDialogDescription>
              Share this link with others to collaborate on this {entityType}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4">
            <div className="flex items-center space-x-2">
              <div className="bg-gray-100 p-3 rounded text-sm flex-1 truncate">
                {`${window.location.origin}/${entityType}/${entityId}/collaborate`}
              </div>
              <Button size="sm" onClick={shareCollaboration}>
                Copy
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Anyone with this link can view and edit this {entityType}.
            </p>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={shareCollaboration}>
              Copy & Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}