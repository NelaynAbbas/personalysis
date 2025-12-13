import { useState, useEffect, useCallback } from 'react';
import { useRealtime } from './useRealtime';

// Types for collaboration
export interface Participant {
  connectionId?: string;
  userId: number;
  username: string;
  status: 'online' | 'idle' | 'offline';
  cursorPosition?: { x: number; y: number };
  lastActiveAt?: string;
}

export interface DocumentChange {
  content?: string;
  docVersion?: number;
  appliedAt: string;
  userId: number;
  type: 'replace' | 'insert' | 'delete';
  // For insert/delete operations, we would add start/end positions
}

export interface Document {
  id: string;
  sessionId: number;
  content: string;
  version: number;
  lastModified: string;
}

export interface Comment {
  id: string;
  sessionId: number;
  text: string;
  position: number;
  userId: number;
  username: string;
  createdAt: string;
  resolved: boolean;
  resolvedBy?: number;
  resolvedAt?: string;
}

// Survey editing types
export interface SurveyQuestion {
  id?: number;
  sessionId: number;
  surveyId: number;
  text: string;
  type: string;
  required: boolean;
  order: number;
  options?: SurveyQuestionOption[];
  // Additional properties as needed
}

export interface SurveyQuestionOption {
  id?: number;
  questionId: number;
  text: string;
  value: string;
  order: number;
  // Additional properties as needed
}

export interface LockedElement {
  elementType: string;
  elementId: number;
  lockedBy: number;
  lockedByUsername: string;
  lockedAt: string;
}

export interface SurveyVersion {
  id: number;
  surveyId: number;
  name: string;
  notes?: string;
  createdBy: number;
  createdAt: string;
}

interface CollaborationOptions {
  sessionId: number;
  userId: number;
  username: string;
  onDocumentChange?: (change: DocumentChange) => void;
  onCommentAdded?: (comment: Comment) => void;
  onCommentResolved?: (comment: Comment) => void;
  onParticipantJoined?: (participant: Participant) => void;
  onParticipantLeft?: (participant: Participant) => void;
  // Survey-specific handlers
  onQuestionAdded?: (question: SurveyQuestion) => void;
  onQuestionUpdated?: (questionId: number, updates: Partial<SurveyQuestion>) => void;
  onQuestionDeleted?: (questionId: number) => void;
  onQuestionOptionAdded?: (questionId: number, option: SurveyQuestionOption) => void;
  onQuestionOptionUpdated?: (questionId: number, optionId: number, updates: Partial<SurveyQuestionOption>) => void;
  onQuestionOptionDeleted?: (questionId: number, optionId: number) => void;
  onElementLocked?: (element: LockedElement) => void;
  onElementUnlocked?: (elementType: string, elementId: number) => void;
  onVersionCreated?: (version: SurveyVersion) => void;
  onVersionSwitched?: (versionId: number) => void;
  onReviewRequested?: (surveyId: number, requestedBy: number, notes?: string) => void;
  onReviewSubmitted?: (surveyId: number, reviewedBy: number, status: 'approved' | 'rejected', comments?: string) => void;
  onNotification?: (message: string, level: 'info' | 'warning' | 'error') => void;
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
  // Survey-specific handlers
  onQuestionAdded,
  onQuestionUpdated,
  onQuestionDeleted,
  onQuestionOptionAdded,
  onQuestionOptionUpdated,
  onQuestionOptionDeleted,
  onElementLocked,
  onElementUnlocked,
  onVersionCreated,
  onVersionSwitched,
  onReviewRequested,
  onReviewSubmitted,
  onNotification
}: CollaborationOptions) {
  const [connected, setConnected] = useState(false);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [document, setDocument] = useState<Document | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);

  // Join the session when the component mounts
  useEffect(() => {
    const joinSession = async () => {
      try {
        const response = await fetch(`/api/collaboration/${sessionId}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, username }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success') {
            setConnected(true);
            setConnectionId(data.data.connectionId);
            setParticipants(data.data.participants || []);
            setDocument(data.data.document || null);
            setComments(data.data.comments || []);
            
            console.log('Successfully joined collaboration session', data.data);
          } else {
            console.error('Failed to join session:', data.message);
          }
        } else {
          console.error('Failed to join session, server returned:', response.status);
        }
      } catch (error) {
        console.error('Error joining collaboration session:', error);
      }
    };

    joinSession();

    // Cleanup function to leave the session
    return () => {
      // Handled by leaveSession function
    };
  }, [sessionId, userId, username]);

  // Handle realtime updates
  const handleRealtimeUpdate = useCallback(
    (data: any) => {
      if (!data) return;

      console.log('Received collaboration update:', data);

      // Handle different types of updates
      switch (data.type) {
        case 'document_change':
          if (data.change) {
            if (data.change.userId !== userId) {
              // Only handle changes from other users to avoid loops
              setDocument((prevDoc) => {
                if (!prevDoc) return null;
                return {
                  ...prevDoc,
                  content: data.change.content || prevDoc.content,
                  version: (prevDoc.version || 0) + 1,
                  lastModified: data.change.appliedAt,
                };
              });

              // Call the callback if provided
              if (onDocumentChange) {
                onDocumentChange(data.change);
              }
            }
          }
          break;

        case 'comment_added':
          if (data.comment) {
            setComments((prev) => [...prev, data.comment]);

            // Call the callback if provided
            if (onCommentAdded && data.comment.userId !== userId) {
              onCommentAdded(data.comment);
            }
          }
          break;

        case 'comment_resolved':
          if (data.comment) {
            setComments((prev) =>
              prev.map((c) => (c.id === data.comment.id ? data.comment : c))
            );

            // Call the callback if provided
            if (onCommentResolved && data.comment.resolvedBy !== userId) {
              onCommentResolved(data.comment);
            }
          }
          break;

        case 'participant_joined':
          if (data.participant) {
            setParticipants((prev) => {
              // Check if participant already exists
              const exists = prev.some((p) => p.userId === data.participant.userId);
              if (exists) {
                // Update existing participant
                return prev.map((p) =>
                  p.userId === data.participant.userId
                    ? { ...p, ...data.participant }
                    : p
                );
              } else {
                // Add new participant
                if (onParticipantJoined && data.participant.userId !== userId) {
                  onParticipantJoined(data.participant);
                }
                return [...prev, data.participant];
              }
            });
          }
          break;

        case 'participant_left':
          if (data.participant) {
            setParticipants((prev) => {
              const updatedParticipants = prev.map((p) =>
                p.userId === data.participant.userId
                  ? { ...p, status: 'offline' }
                  : p
              );

              if (onParticipantLeft && data.participant.userId !== userId) {
                onParticipantLeft(data.participant);
              }

              return updatedParticipants;
            });
          }
          break;

        case 'status_update':
          if (data.participant) {
            setParticipants((prev) =>
              prev.map((p) =>
                p.userId === data.participant.userId
                  ? { ...p, ...data.participant }
                  : p
              )
            );
          }
          break;

        case 'cursor_update':
          if (data.participant) {
            setParticipants((prev) =>
              prev.map((p) =>
                p.userId === data.participant.userId
                  ? { ...p, cursorPosition: data.participant.cursorPosition }
                  : p
              )
            );
          }
          break;

        case 'full_sync':
          // Handle a full sync of all data
          if (data.document) setDocument(data.document);
          if (data.comments) setComments(data.comments);
          if (data.participants) setParticipants(data.participants);
          break;
          
        // Survey-specific actions
        case 'question_added':
          if (data.question && onQuestionAdded) {
            onQuestionAdded(data.question);
          }
          break;
          
        case 'question_updated':
          if (data.question && data.questionId && onQuestionUpdated) {
            onQuestionUpdated(data.questionId, data.question);
          }
          break;
          
        case 'question_deleted':
          if (data.questionId && onQuestionDeleted) {
            onQuestionDeleted(data.questionId);
          }
          break;
          
        case 'question_option_added':
          if (data.questionId && data.option && onQuestionOptionAdded) {
            onQuestionOptionAdded(data.questionId, data.option);
          }
          break;
          
        case 'question_option_updated':
          if (data.questionId && data.optionId && data.updates && onQuestionOptionUpdated) {
            onQuestionOptionUpdated(data.questionId, data.optionId, data.updates);
          }
          break;
          
        case 'question_option_deleted':
          if (data.questionId && data.optionId && onQuestionOptionDeleted) {
            onQuestionOptionDeleted(data.questionId, data.optionId);
          }
          break;
          
        case 'element_locked':
          if (data.element && onElementLocked) {
            onElementLocked(data.element);
          }
          break;
          
        case 'element_unlocked':
          if (data.elementType && data.elementId && onElementUnlocked) {
            onElementUnlocked(data.elementType, data.elementId);
          }
          break;
          
        case 'version_created':
          if (data.version && onVersionCreated) {
            onVersionCreated(data.version);
          }
          break;
          
        case 'version_switched':
          if (data.versionId && onVersionSwitched) {
            onVersionSwitched(data.versionId);
          }
          break;
          
        case 'review_requested':
          if (data.surveyId && data.requestedBy && onReviewRequested) {
            onReviewRequested(data.surveyId, data.requestedBy, data.notes);
          }
          break;
          
        case 'review_submitted':
          if (data.surveyId && data.reviewedBy && data.status && onReviewSubmitted) {
            onReviewSubmitted(data.surveyId, data.reviewedBy, data.status, data.comments);
          }
          break;
          
        case 'notification':
          if (data.message && data.level && onNotification) {
            onNotification(data.message, data.level);
          }
          break;

        default:
          console.warn('Unknown collaboration update type:', data.type);
      }
    },
    [
    userId, 
    onDocumentChange, 
    onCommentAdded, 
    onCommentResolved, 
    onParticipantJoined, 
    onParticipantLeft,
    onQuestionAdded,
    onQuestionUpdated,
    onQuestionDeleted,
    onQuestionOptionAdded,
    onQuestionOptionUpdated,
    onQuestionOptionDeleted,
    onElementLocked,
    onElementUnlocked,
    onVersionCreated,
    onVersionSwitched,
    onReviewRequested,
    onReviewSubmitted,
    onNotification
  ]
  );

  // Subscribe to collaboration events
  useRealtime(`collaboration_${sessionId}`, handleRealtimeUpdate);

  // Send cursor position update
  const updateCursorPosition = useCallback(
    async (position: { x: number; y: number }) => {
      if (!connected || !sessionId) return;

      try {
        await fetch(`/api/collaboration/${sessionId}/cursor`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            position,
          }),
        });
      } catch (error) {
        console.error('Error updating cursor position:', error);
      }
    },
    [connected, sessionId, userId]
  );

  // Send status update
  const updateStatus = useCallback(
    async (status: 'online' | 'idle' | 'offline') => {
      if (!connected || !sessionId) return;

      try {
        await fetch(`/api/collaboration/${sessionId}/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            status,
          }),
        });
      } catch (error) {
        console.error('Error updating status:', error);
      }
    },
    [connected, sessionId, userId]
  );

  // Send document change
  const sendChange = useCallback(
    async (change: DocumentChange) => {
      if (!connected || !sessionId) return;

      try {
        await fetch(`/api/collaboration/${sessionId}/change`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            change,
          }),
        });
      } catch (error) {
        console.error('Error sending document change:', error);
      }
    },
    [connected, sessionId, userId]
  );

  // Add comment
  const addComment = useCallback(
    async (comment: Omit<Comment, 'id' | 'sessionId'>) => {
      if (!connected || !sessionId) return;

      try {
        const response = await fetch(`/api/collaboration/${sessionId}/comment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...comment,
            userId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // The new comment will be broadcast to all participants by the server
          // and handled by the realtime update handler
          return data.data.comment;
        }
      } catch (error) {
        console.error('Error adding comment:', error);
      }
    },
    [connected, sessionId, userId]
  );

  // Resolve comment
  const resolveComment = useCallback(
    async (commentId: string) => {
      if (!connected || !sessionId) return;

      try {
        await fetch(`/api/collaboration/${sessionId}/comment/${commentId}/resolve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
          }),
        });
        // The resolved comment will be broadcast to all participants by the server
        // and handled by the realtime update handler
      } catch (error) {
        console.error('Error resolving comment:', error);
      }
    },
    [connected, sessionId, userId]
  );

  // Leave session
  const leaveSession = useCallback(async () => {
    if (!sessionId) return;

    try {
      await fetch(`/api/collaboration/${sessionId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
        }),
      });
      setConnected(false);
    } catch (error) {
      console.error('Error leaving session:', error);
    }
  }, [sessionId, userId]);

  // Add userId to the current participant
  const currentParticipant = participants.find((p) => p.userId === userId);

  // Add survey question
  const addQuestion = useCallback(
    async (question: Omit<SurveyQuestion, 'id'>) => {
      if (!connected || !sessionId) return;

      try {
        const response = await fetch(`/api/collaboration/${sessionId}/question`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            question,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return data.data.question;
        }
      } catch (error) {
        console.error('Error adding question:', error);
      }
    },
    [connected, sessionId, userId]
  );

  // Update survey question
  const updateQuestion = useCallback(
    async (questionId: number, updates: Partial<SurveyQuestion>) => {
      if (!connected || !sessionId) return;

      try {
        await fetch(`/api/collaboration/${sessionId}/question/${questionId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            updates,
          }),
        });
      } catch (error) {
        console.error('Error updating question:', error);
      }
    },
    [connected, sessionId, userId]
  );

  // Delete survey question
  const deleteQuestion = useCallback(
    async (questionId: number) => {
      if (!connected || !sessionId) return;

      try {
        await fetch(`/api/collaboration/${sessionId}/question/${questionId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
          }),
        });
      } catch (error) {
        console.error('Error deleting question:', error);
      }
    },
    [connected, sessionId, userId]
  );

  // Add question option
  const addQuestionOption = useCallback(
    async (questionId: number, option: Omit<SurveyQuestionOption, 'id'>) => {
      if (!connected || !sessionId) return;

      try {
        const response = await fetch(`/api/collaboration/${sessionId}/question/${questionId}/option`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            option,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return data.data.option;
        }
      } catch (error) {
        console.error('Error adding question option:', error);
      }
    },
    [connected, sessionId, userId]
  );

  // Update question option
  const updateQuestionOption = useCallback(
    async (questionId: number, optionId: number, updates: Partial<SurveyQuestionOption>) => {
      if (!connected || !sessionId) return;

      try {
        await fetch(`/api/collaboration/${sessionId}/question/${questionId}/option/${optionId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            updates,
          }),
        });
      } catch (error) {
        console.error('Error updating question option:', error);
      }
    },
    [connected, sessionId, userId]
  );

  // Delete question option
  const deleteQuestionOption = useCallback(
    async (questionId: number, optionId: number) => {
      if (!connected || !sessionId) return;

      try {
        await fetch(`/api/collaboration/${sessionId}/question/${questionId}/option/${optionId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
          }),
        });
      } catch (error) {
        console.error('Error deleting question option:', error);
      }
    },
    [connected, sessionId, userId]
  );

  // Lock an element for editing
  const lockElement = useCallback(
    async (elementType: string, elementId: number) => {
      if (!connected || !sessionId) return;

      try {
        const response = await fetch(`/api/collaboration/${sessionId}/lock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            username,
            elementType,
            elementId,
          }),
        });

        return response.ok;
      } catch (error) {
        console.error('Error locking element:', error);
        return false;
      }
    },
    [connected, sessionId, userId, username]
  );

  // Unlock an element
  const unlockElement = useCallback(
    async (elementType: string, elementId: number) => {
      if (!connected || !sessionId) return;

      try {
        await fetch(`/api/collaboration/${sessionId}/unlock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            elementType,
            elementId,
          }),
        });
      } catch (error) {
        console.error('Error unlocking element:', error);
      }
    },
    [connected, sessionId, userId]
  );

  // Create a new version
  const createVersion = useCallback(
    async (surveyId: number, name: string, notes?: string) => {
      if (!connected || !sessionId) return;

      try {
        const response = await fetch(`/api/collaboration/${sessionId}/version`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            surveyId,
            name,
            notes,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return data.data.version;
        }
      } catch (error) {
        console.error('Error creating version:', error);
      }
    },
    [connected, sessionId, userId]
  );

  // Switch to a different version
  const switchVersion = useCallback(
    async (surveyId: number, versionId: number) => {
      if (!connected || !sessionId) return;

      try {
        await fetch(`/api/collaboration/${sessionId}/version/${versionId}/switch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            surveyId,
          }),
        });
      } catch (error) {
        console.error('Error switching version:', error);
      }
    },
    [connected, sessionId, userId]
  );

  // Request a review
  const requestReview = useCallback(
    async (surveyId: number, notes?: string) => {
      if (!connected || !sessionId) return;

      try {
        await fetch(`/api/collaboration/${sessionId}/review/request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            surveyId,
            notes,
          }),
        });
      } catch (error) {
        console.error('Error requesting review:', error);
      }
    },
    [connected, sessionId, userId]
  );

  // Submit a review
  const submitReview = useCallback(
    async (surveyId: number, status: 'approved' | 'rejected', comments?: string) => {
      if (!connected || !sessionId) return;

      try {
        await fetch(`/api/collaboration/${sessionId}/review/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            surveyId,
            status,
            comments,
          }),
        });
      } catch (error) {
        console.error('Error submitting review:', error);
      }
    },
    [connected, sessionId, userId]
  );

  // Send a notification
  const sendNotification = useCallback(
    async (message: string, level: 'info' | 'warning' | 'error') => {
      if (!connected || !sessionId) return;

      try {
        await fetch(`/api/collaboration/${sessionId}/notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            message,
            level,
          }),
        });
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    },
    [connected, sessionId, userId]
  );

  return {
    connected,
    connectionId,
    participants,
    document,
    comments,
    currentParticipant,
    // Basic collaboration methods
    updateCursorPosition,
    updateStatus,
    sendChange,
    addComment,
    resolveComment,
    leaveSession,
    // Survey-specific methods
    addQuestion,
    updateQuestion,
    deleteQuestion,
    addQuestionOption,
    updateQuestionOption,
    deleteQuestionOption,
    lockElement,
    unlockElement,
    createVersion,
    switchVersion,
    requestReview,
    submitReview,
    sendNotification,
  };
}