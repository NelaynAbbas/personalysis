import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MessageSquare, 
  AlertCircle, 
  UserCheck, 
  Send, 
  Edit, 
  Eye
} from 'lucide-react';

export type ReviewStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'changes_requested';

export interface ReviewComment {
  id: string;
  userId: number;
  username: string;
  content: string;
  createdAt: Date;
  elementId?: string; // Optional ID of the specific element being commented on
}

export interface ReviewRequest {
  id: string;
  title: string;
  description?: string;
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
  requestedBy: {
    id: number;
    username: string;
  };
  reviewers: Array<{
    id: number;
    username: string;
    status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  }>;
  comments: ReviewComment[];
  versionId?: string; // Optional reference to a specific version
}

interface ReviewProcessProps {
  sessionId: number;
  userId: number;
  username: string;
  reviewRequests: ReviewRequest[];
  onCreateReviewRequest: (title: string, description: string, reviewerIds: number[]) => void;
  onUpdateReviewStatus: (reviewId: string, status: ReviewStatus) => void;
  onAddReviewComment: (reviewId: string, content: string, elementId?: string) => void;
  onCompleteReview: (reviewId: string, approved: boolean, comment: string) => void;
  availableReviewers: Array<{ id: number; username: string }>;
  readOnly?: boolean;
}

const ReviewProcess: React.FC<ReviewProcessProps> = ({
  sessionId,
  userId,
  username,
  reviewRequests,
  onCreateReviewRequest,
  onUpdateReviewStatus,
  onAddReviewComment,
  onCompleteReview,
  availableReviewers,
  readOnly = false,
}) => {
  const [newReview, setNewReview] = useState({
    title: '',
    description: '',
    selectedReviewers: [] as number[],
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Active review for comments
  const activeReview = activeReviewId 
    ? reviewRequests.find(r => r.id === activeReviewId) 
    : null;
  
  // Handle creating a new review request
  const handleCreateReviewRequest = () => {
    if (!newReview.title) {
      toast({
        title: 'Error',
        description: 'Review title is required',
        variant: 'destructive',
      });
      return;
    }
    
    if (newReview.selectedReviewers.length === 0) {
      toast({
        title: 'Error',
        description: 'You must select at least one reviewer',
        variant: 'destructive',
      });
      return;
    }
    
    onCreateReviewRequest(
      newReview.title, 
      newReview.description, 
      newReview.selectedReviewers
    );
    
    // Reset form and close dialog
    setNewReview({
      title: '',
      description: '',
      selectedReviewers: [],
    });
    setOpenDialog(false);
    
    toast({
      title: 'Review Requested',
      description: 'Your review request has been sent to the selected reviewers.',
    });
  };
  
  // Handle adding a comment to a review
  const handleAddComment = () => {
    if (!activeReviewId || !commentText) return;
    
    onAddReviewComment(activeReviewId, commentText);
    setCommentText('');
    
    toast({
      title: 'Comment Added',
      description: 'Your comment has been added to the review.',
    });
  };
  
  // Handle completing a review
  const handleCompleteReview = (reviewId: string, approved: boolean) => {
    if (!commentText) {
      toast({
        title: 'Error',
        description: 'Please add a comment to complete the review',
        variant: 'destructive',
      });
      return;
    }
    
    onCompleteReview(reviewId, approved, commentText);
    setCommentText('');
    
    toast({
      title: approved ? 'Review Approved' : 'Changes Requested',
      description: approved 
        ? 'You have approved this review.'
        : 'You have requested changes for this review.',
    });
  };
  
  // Filter review requests into active and completed
  const activeReviews = reviewRequests.filter(
    r => ['pending', 'in_progress', 'changes_requested'].includes(r.status)
  );
  
  const completedReviews = reviewRequests.filter(
    r => ['approved', 'rejected'].includes(r.status)
  );
  
  // Helper to get status badge
  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="text-blue-500 border-blue-500">In Progress</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-500 border-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-500 border-red-500">Rejected</Badge>;
      case 'changes_requested':
        return <Badge variant="outline" className="text-orange-500 border-orange-500">Changes Requested</Badge>;
      default:
        return null;
    }
  };
  
  // Check if current user is a reviewer for a specific review
  const isReviewer = (review: ReviewRequest) => {
    return review.reviewers.some(r => r.id === userId);
  };
  
  // Get reviewer status for displaying in the UI
  const getReviewerStatus = (status: 'pending' | 'approved' | 'rejected' | 'changes_requested') => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'changes_requested':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Review Process</h3>
        
        {!readOnly && (
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Request Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Request a Review</DialogTitle>
                <DialogDescription>
                  Request others to review the current state of your survey. You'll be notified when they provide feedback.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Review Title</label>
                  <Input
                    value={newReview.title}
                    onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                    placeholder="e.g., Final review before launch"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <Textarea
                    value={newReview.description}
                    onChange={(e) => setNewReview({ ...newReview, description: e.target.value })}
                    placeholder="Describe what you'd like reviewers to focus on..."
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Reviewers</label>
                  <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
                    {availableReviewers.length === 0 ? (
                      <div className="text-sm text-muted-foreground p-2">
                        No reviewers available
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {availableReviewers.map(reviewer => (
                          <div 
                            key={reviewer.id}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              id={`reviewer-${reviewer.id}`}
                              checked={newReview.selectedReviewers.includes(reviewer.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewReview({
                                    ...newReview,
                                    selectedReviewers: [...newReview.selectedReviewers, reviewer.id]
                                  });
                                } else {
                                  setNewReview({
                                    ...newReview,
                                    selectedReviewers: newReview.selectedReviewers.filter(
                                      id => id !== reviewer.id
                                    )
                                  });
                                }
                              }}
                            />
                            <label
                              htmlFor={`reviewer-${reviewer.id}`}
                              className="text-sm flex items-center space-x-2"
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarFallback>
                                  {reviewer.username.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span>{reviewer.username}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateReviewRequest}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Request Review
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Active Reviews
            {activeReviews.length > 0 && (
              <Badge variant="secondary">{activeReviews.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Completed
            {completedReviews.length > 0 && (
              <Badge variant="secondary">{completedReviews.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-4 space-y-4">
          {activeReviews.length === 0 ? (
            <div className="text-center p-6 border border-dashed rounded-md text-muted-foreground">
              No active review requests.
            </div>
          ) : (
            activeReviews.map(review => (
              <Card key={review.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-base">{review.title}</CardTitle>
                      {getStatusBadge(review.status)}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {!readOnly && isReviewer(review) && review.status !== 'approved' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setActiveReviewId(review.id)}
                          className="flex items-center gap-1"
                        >
                          <MessageSquare className="h-3 w-3" />
                          Review
                        </Button>
                      )}
                      
                      {!readOnly && review.requestedBy.id === userId && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setActiveReviewId(review.id)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {review.description && (
                    <CardDescription>{review.description}</CardDescription>
                  )}
                </CardHeader>
                
                <CardContent className="pb-0">
                  <div className="text-sm text-muted-foreground">
                    Requested by {review.requestedBy.username} on{' '}
                    {new Date(review.createdAt).toLocaleString()}
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Reviewers</h4>
                    <div className="flex flex-wrap gap-2">
                      {review.reviewers.map(reviewer => (
                        <Badge 
                          key={reviewer.id}
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          {getReviewerStatus(reviewer.status)}
                          {reviewer.username}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {/* Show a preview of comments */}
                  {review.comments.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">
                        Recent Comments ({review.comments.length})
                      </h4>
                      <div className="border rounded-md p-2 max-h-20 overflow-y-auto">
                        {review.comments.slice(0, 2).map(comment => (
                          <div key={comment.id} className="text-sm mb-1">
                            <span className="font-medium">{comment.username}: </span>
                            <span className="text-muted-foreground">
                              {comment.content.length > 60 
                                ? `${comment.content.substring(0, 60)}...` 
                                : comment.content}
                            </span>
                          </div>
                        ))}
                        {review.comments.length > 2 && (
                          <div className="text-sm text-muted-foreground">
                            ... and {review.comments.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="pt-4 pb-4">
                  <div className="w-full flex justify-end space-x-2">
                    {!readOnly && isReviewer(review) && review.status !== 'approved' && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setActiveReviewId(review.id)}
                        >
                          <MessageSquare className="mr-1 h-3 w-3" />
                          Comment
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => setActiveReviewId(review.id)}
                        >
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Request Changes
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-green-500 hover:text-green-700"
                          onClick={() => setActiveReviewId(review.id)}
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Approve
                        </Button>
                      </>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-4 space-y-4">
          {completedReviews.length === 0 ? (
            <div className="text-center p-6 border border-dashed rounded-md text-muted-foreground">
              No completed review requests.
            </div>
          ) : (
            completedReviews.map(review => (
              <Card key={review.id} className="opacity-80">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-base">{review.title}</CardTitle>
                      {getStatusBadge(review.status)}
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setActiveReviewId(review.id)}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                  
                  {review.description && (
                    <CardDescription>{review.description}</CardDescription>
                  )}
                </CardHeader>
                
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Completed on {new Date(review.updatedAt).toLocaleString()}
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Reviewers</h4>
                    <div className="flex flex-wrap gap-2">
                      {review.reviewers.map(reviewer => (
                        <Badge 
                          key={reviewer.id}
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          {getReviewerStatus(reviewer.status)}
                          {reviewer.username}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
      
      {/* Review Detail Dialog */}
      {activeReview && (
        <Dialog open={!!activeReviewId} onOpenChange={(open) => !open && setActiveReviewId(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center space-x-2">
                <DialogTitle>{activeReview.title}</DialogTitle>
                {getStatusBadge(activeReview.status)}
              </div>
              <DialogDescription>
                {activeReview.description || 'No description provided.'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                  Requested by {activeReview.requestedBy.username} on{' '}
                  {new Date(activeReview.createdAt).toLocaleString()}
                </div>
                <div>
                  Last updated: {new Date(activeReview.updatedAt).toLocaleString()}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Reviewers</h4>
                <div className="flex flex-wrap gap-2">
                  {activeReview.reviewers.map(reviewer => (
                    <Badge 
                      key={reviewer.id}
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      {getReviewerStatus(reviewer.status)}
                      {reviewer.username}
                      {reviewer.id === userId && ' (You)'}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Comments</h4>
                {activeReview.comments.length === 0 ? (
                  <div className="text-center p-4 border border-dashed rounded-md text-muted-foreground">
                    No comments yet. Be the first to comment!
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto border rounded-md p-3">
                    {activeReview.comments.map(comment => (
                      <div 
                        key={comment.id}
                        className={`p-3 rounded-md ${
                          comment.userId === userId
                            ? 'bg-primary/10 ml-8'
                            : 'bg-muted/50 mr-8'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>
                              {comment.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{comment.username}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm">
                          {comment.content}
                        </div>
                        {comment.elementId && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Comment on element: {comment.elementId}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {!readOnly && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Add Comment</h4>
                  <div className="space-y-2">
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Type your comment here..."
                      className="min-h-20"
                    />
                    <div className="flex items-center justify-end space-x-2">
                      {isReviewer(activeReview) && activeReview.status !== 'approved' && (
                        <>
                          <Button 
                            variant="outline"
                            onClick={() => handleCompleteReview(activeReview.id, false)}
                            className="text-red-500"
                          >
                            <AlertCircle className="mr-2 h-4 w-4" />
                            Request Changes
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => handleCompleteReview(activeReview.id, true)}
                            className="text-green-500"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                        </>
                      )}
                      <Button 
                        onClick={handleAddComment}
                        disabled={!commentText}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Send Comment
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ReviewProcess;