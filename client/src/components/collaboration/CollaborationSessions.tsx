import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Clock,
  Search,
  Plus,
  Users,
  Edit,
  Trash,
  ChevronRight,
  MessagesSquare,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

// Session type definition
interface CollaborationSession {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  createdBy: {
    id: number;
    username: string;
  };
  participants: number;
  lastActive: string;
  status: 'active' | 'archived';
}

// Empty initial sessions array
const initialSessions: CollaborationSession[] = [];

interface CollaborationSessionsProps {
  userId: number;
  username: string;
  onCreateSession?: (session: { title: string; description: string }) => Promise<number>;
}

const CollaborationSessions: React.FC<CollaborationSessionsProps> = ({
  userId,
  username,
  onCreateSession,
}) => {
  const [sessions, setSessions] = useState<CollaborationSession[]>(initialSessions);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionDescription, setNewSessionDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Fetch sessions from API when component mounts
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/collaboration');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch sessions: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success' && Array.isArray(data.data)) {
          // Transform the data to match our expected format if needed
          const formattedSessions = data.data.map((session: any) => ({
            id: session.id,
            title: session.title || 'Untitled Session',
            description: session.description || '',
            createdAt: session.createdAt,
            createdBy: {
              id: session.createdById,
              username: session.createdByUsername || 'Unknown User',
            },
            participants: session.participantCount || 0,
            lastActive: session.lastActiveAt || session.createdAt,
            status: session.isActive === false ? 'archived' : 'active',
          }));
          
          setSessions(formattedSessions);
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (error) {
        console.error('Error fetching collaboration sessions:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        toast({
          title: 'Error',
          description: 'Failed to load collaboration sessions',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSessions();
  }, [toast]);

  // Filter sessions based on search query
  const filteredSessions = sessions.filter(
    (session) =>
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.createdBy.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format date to a readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate time since for "last active"
  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
      return interval === 1 ? 'Yesterday' : `${interval} days ago`;
    }
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
      return `${interval} ${interval === 1 ? 'hour' : 'hours'} ago`;
    }
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
      return `${interval} ${interval === 1 ? 'minute' : 'minutes'} ago`;
    }
    return 'Just now';
  };

  // Handle session creation
  const handleCreateSession = async () => {
    if (!newSessionTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a session title',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    try {
      // Use the provided onCreateSession function or mock it
      const sessionId = onCreateSession
        ? await onCreateSession({
            title: newSessionTitle,
            description: newSessionDescription,
          })
        : Math.floor(Math.random() * 1000) + 10;

      // If we're using mock data, add it to our local state
      if (!onCreateSession) {
        const newSession: CollaborationSession = {
          id: sessionId,
          title: newSessionTitle,
          description: newSessionDescription,
          createdAt: new Date().toISOString(),
          createdBy: {
            id: userId,
            username,
          },
          participants: 1,
          lastActive: new Date().toISOString(),
          status: 'active',
        };

        setSessions([newSession, ...sessions]);
      }

      toast({
        title: 'Success',
        description: 'Collaboration session created successfully',
      });

      // Reset form and close dialog
      setNewSessionTitle('');
      setNewSessionDescription('');
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create collaboration session',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Collaboration Sessions</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Collaboration Session</DialogTitle>
              <DialogDescription>
                Start a new collaborative editing session for your team
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Session Title
                </label>
                <Input
                  id="title"
                  placeholder="Enter session title"
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Input
                  id="description"
                  placeholder="Enter session description"
                  value={newSessionDescription}
                  onChange={(e) => setNewSessionDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateSession} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Session'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search sessions..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Sessions</CardTitle>
          <CardDescription>
            View and manage all collaboration sessions across your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <MessagesSquare className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No sessions found</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                {searchQuery
                  ? 'No sessions match your search criteria. Try a different search term.'
                  : 'There are no active collaboration sessions. Create one to get started.'}
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{session.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {session.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{session.createdBy.username}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {session.participants}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span title={formatDate(session.lastActive)}>
                          {getTimeSince(session.lastActive)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={session.status === 'active' ? 'default' : 'secondary'}
                      >
                        {session.status === 'active' ? 'Active' : 'Archived'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Link href={`/collaboration/${session.id}`}>
                          <Button size="sm" variant="outline">
                            <ChevronRight className="h-4 w-4" />
                            <span className="sr-only">View Session</span>
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CollaborationSessions;