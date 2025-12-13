import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  User, 
  Users, 
  MessagesSquare, 
  Clock, 
  Settings, 
  Lock, 
  History, 
  FileText, 
  ClipboardCheck 
} from 'lucide-react';

// Import our collaboration components
import { CollaborativeEditor } from '../components/collaboration/CollaborativeEditor';
import CollaborationSessions from '../components/collaboration/CollaborationSessions';
import QuestionManager, { SurveyQuestion, QuestionOption } from '../components/collaboration/QuestionManager';
import VersionControl, { Version } from '../components/collaboration/VersionControl';
import ReviewProcess, { ReviewRequest } from '../components/collaboration/ReviewProcess';
import NotificationSystem, { CollaborationNotification } from '../components/collaboration/NotificationSystem';
import ElementLocking, { LockedElement } from '../components/collaboration/ElementLocking';

// Mock user data (in a real app this would come from authentication)
const currentUser = {
  id: 4, // Using a real user ID from the database
  username: 'admin',
  role: 'platform_admin'
};

// Mock data for initial empty states
const initialQuestions: SurveyQuestion[] = [];
const initialVersions: Version[] = [];
const initialReviewRequests: ReviewRequest[] = [];
const initialNotifications: CollaborationNotification[] = [];
const initialLockedElements: LockedElement[] = [];

const SurveyCollaboration: React.FC = () => {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/collaboration/:id');
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('editor');
  
  // State for collaboration components
  const [questions, setQuestions] = useState<SurveyQuestion[]>(initialQuestions);
  const [versions, setVersions] = useState<Version[]>(initialVersions);
  const [reviewRequests, setReviewRequests] = useState<ReviewRequest[]>(initialReviewRequests);
  const [notifications, setNotifications] = useState<CollaborationNotification[]>(initialNotifications);
  const [lockedElements, setLockedElements] = useState<LockedElement[]>(initialLockedElements);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [sessionTitle, setSessionTitle] = useState('Loading...');
  const [participants, setParticipants] = useState<Array<{id: number, username: string, status: string}>>([]);
  
  // If we have a session ID, show the collaborative editor
  // Otherwise show the sessions list
  const sessionId = params?.id ? parseInt(params.id) : null;
  
  // Fetch session data when sessionId changes
  useEffect(() => {
    if (sessionId) {
      // Fetch session data, questions, versions, etc.
      fetchSessionData(sessionId);
    }
  }, [sessionId]);
  
  // Fetch session data, questions, etc.
  const fetchSessionData = async (sessionId: number) => {
    try {
      // In a real app, these would be separate API calls
      console.log('Fetching session data for ID:', sessionId);
      
      // Simulate an API call with mock data
      setSessionTitle(`Collaboration Session #${sessionId}`);
      setParticipants([
        { id: currentUser.id, username: currentUser.username, status: 'online' },
        { id: 2, username: 'jane_doe', status: 'offline' }
      ]);
      
      // Generate some initial questions
      setQuestions([
        {
          id: 'q1',
          title: 'What is your age range?',
          description: 'Please select the age range that applies to you.',
          type: 'multiple_choice',
          required: true,
          order: 1,
          options: [
            { id: 'o1', text: 'Under 18', value: '1' },
            { id: 'o2', text: '18-24', value: '2' },
            { id: 'o3', text: '25-34', value: '3' },
            { id: 'o4', text: '35-44', value: '4' },
            { id: 'o5', text: '45+', value: '5' }
          ]
        },
        {
          id: 'q2',
          title: 'How satisfied are you with our product?',
          description: 'Rate your satisfaction level from 1-5 stars.',
          type: 'rating',
          required: true,
          order: 2,
          options: [
            { id: 'o1', text: '1 Star', value: '1' },
            { id: 'o2', text: '2 Stars', value: '2' },
            { id: 'o3', text: '3 Stars', value: '3' },
            { id: 'o4', text: '4 Stars', value: '4' },
            { id: 'o5', text: '5 Stars', value: '5' }
          ]
        }
      ]);
      
      // Generate initial versions
      setVersions([
        {
          id: 'v1',
          name: 'Initial Draft',
          description: 'First version of the survey',
          createdAt: new Date(Date.now() - 3600000 * 24 * 2), // 2 days ago
          createdBy: {
            id: currentUser.id,
            username: currentUser.username
          },
          isCurrent: false
        },
        {
          id: 'v2',
          name: 'Version 1.0',
          description: 'Added demographic questions',
          createdAt: new Date(Date.now() - 3600000 * 24), // 1 day ago
          createdBy: {
            id: currentUser.id,
            username: currentUser.username
          },
          isCurrent: true
        }
      ]);
      
      // Set sample review requests
      setReviewRequests([
        {
          id: 'r1',
          title: 'Initial Survey Review',
          description: 'Please review the basic structure and questions',
          status: 'in_progress',
          createdAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
          updatedAt: new Date(Date.now() - 3600000), // 1 hour ago
          requestedBy: {
            id: currentUser.id,
            username: currentUser.username
          },
          reviewers: [
            {
              id: 2,
              username: 'jane_doe',
              status: 'approved'
            },
            {
              id: 3,
              username: 'john_smith',
              status: 'pending'
            }
          ],
          comments: [
            {
              id: 'c1',
              userId: 2,
              username: 'jane_doe',
              content: 'The questions look good, but we should add more demographic options.',
              createdAt: new Date(Date.now() - 1800000) // 30 minutes ago
            }
          ]
        }
      ]);
      
      // Set notifications
      setNotifications([
        {
          id: 'n1',
          type: 'user_joined',
          title: 'User Joined',
          message: 'Jane Doe joined the collaboration session',
          createdAt: new Date(Date.now() - 3600000), // 1 hour ago
          read: false,
          sessionId,
          sender: {
            id: 2,
            username: 'jane_doe'
          }
        },
        {
          id: 'n2',
          type: 'comment',
          title: 'New Comment',
          message: 'Jane Doe commented on a question: "We should add more options here."',
          createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
          read: false,
          elementId: 'q1',
          sessionId,
          sender: {
            id: 2,
            username: 'jane_doe'
          }
        }
      ]);
      
      // Set locked elements
      setLockedElements([
        {
          id: 'q1',
          type: 'question',
          name: 'What is your age range?',
          lockedBy: {
            id: currentUser.id,
            username: currentUser.username
          },
          lockedAt: new Date(Date.now() - 600000), // 10 minutes ago
          expiresAt: new Date(Date.now() + 1200000), // 20 minutes from now
          active: true
        }
      ]);
      
    } catch (error) {
      console.error('Error fetching session data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load collaboration session data',
        variant: 'destructive',
      });
    }
  };
  
  // Handle creating a new session
  const handleCreateSession = async (sessionData: { title: string; description: string }) => {
    try {
      console.log('Creating new collaboration session with data:', sessionData);
      
      // First, fetch available surveys to use one that exists
      console.log('Fetching available surveys...');
      const surveysResponse = await fetch('/api/surveys');
      if (!surveysResponse.ok) {
        console.error('Failed to fetch surveys:', surveysResponse.status);
        throw new Error('Failed to fetch surveys for collaboration');
      }
      
      const surveysData = await surveysResponse.json();
      console.log('Available surveys:', surveysData);
      
      // Use the first survey that exists or default to ID 1
      let targetSurveyId = 1;
      if (surveysData.data && Array.isArray(surveysData.data) && surveysData.data.length > 0) {
        targetSurveyId = surveysData.data[0].id;
        console.log(`Using survey ID ${targetSurveyId} for collaboration`);
      }
      
      // Call the API to create a session
      console.log('Sending session creation request...');
      const response = await fetch('/api/collaboration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: sessionData.title,
          description: sessionData.description,
          userId: currentUser.id,
          username: currentUser.username,
          surveyId: targetSurveyId
        }),
      });
      
      const responseText = await response.text();
      console.log('Raw server response:', responseText);
      
      if (!response.ok) {
        console.error('Server returned error status:', response.status);
        throw new Error(`Failed to create session: ${response.status} - ${responseText}`);
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse server response as JSON:', e);
        throw new Error('Invalid server response format');
      }
      
      console.log('Parsed server response:', data);
      
      if (data.status !== 'success') {
        console.error('Server returned error in response data:', data);
        throw new Error(`Server error: ${data.message || 'Unknown error'}`);
      }
      
      // The server returns data.data.session where session has the id
      if (!data.data || !data.data.session || !data.data.session.id) {
        throw new Error('Invalid response structure from server');
      }
      
      const newSessionId = data.data.session.id;
      
      toast({
        title: 'Session Created',
        description: `"${sessionData.title}" has been created successfully!`,
      });
      
      // Navigate to the new session
      setLocation(`/collaboration/${newSessionId}`);
      
      return newSessionId;
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: 'Error',
        description: 'Failed to create collaboration session',
        variant: 'destructive',
      });
      throw error;
    }
  };
  
  // Question management handlers
  const handleAddQuestion = (question: Omit<SurveyQuestion, 'id' | 'order'>) => {
    const newQuestion: SurveyQuestion = {
      ...question,
      id: `q${Date.now()}`,
      order: questions.length + 1,
      options: question.type === 'multiple_choice' || question.type === 'rating' || question.type === 'yes_no' 
        ? [] 
        : undefined
    };
    
    // In a real implementation, this would make an API call
    setQuestions([...questions, newQuestion]);
    
    // Create a notification for the new question
    const notification: CollaborationNotification = {
      id: `n${Date.now()}`,
      type: 'comment',
      title: 'Question Added',
      message: `${currentUser.username} added a new question: "${question.title}"`,
      createdAt: new Date(),
      read: false,
      sessionId: sessionId || 0,
      sender: {
        id: currentUser.id,
        username: currentUser.username
      }
    };
    
    setNotifications([notification, ...notifications]);
  };
  
  const handleUpdateQuestion = (questionId: string, updates: Partial<SurveyQuestion>) => {
    // In a real implementation, this would make an API call
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    ));
  };
  
  const handleDeleteQuestion = (questionId: string) => {
    // In a real implementation, this would make an API call
    setQuestions(questions.filter(q => q.id !== questionId));
    
    // Create a notification for the deleted question
    const questionToDelete = questions.find(q => q.id === questionId);
    if (questionToDelete) {
      const notification: CollaborationNotification = {
        id: `n${Date.now()}`,
        type: 'comment',
        title: 'Question Deleted',
        message: `${currentUser.username} deleted the question: "${questionToDelete.title}"`,
        createdAt: new Date(),
        read: false,
        sessionId: sessionId || 0,
        sender: {
          id: currentUser.id,
          username: currentUser.username
        }
      };
      
      setNotifications([notification, ...notifications]);
    }
  };
  
  const handleMoveQuestion = (questionId: string, direction: 'up' | 'down') => {
    const questionIndex = questions.findIndex(q => q.id === questionId);
    if (questionIndex === -1) return;
    
    const newQuestions = [...questions];
    const question = newQuestions[questionIndex];
    
    if (direction === 'up' && questionIndex > 0) {
      newQuestions[questionIndex] = newQuestions[questionIndex - 1];
      newQuestions[questionIndex - 1] = question;
    } else if (direction === 'down' && questionIndex < newQuestions.length - 1) {
      newQuestions[questionIndex] = newQuestions[questionIndex + 1];
      newQuestions[questionIndex + 1] = question;
    }
    
    // Update order property for all questions
    const orderedQuestions = newQuestions.map((q, i) => ({ ...q, order: i + 1 }));
    
    // In a real implementation, this would make an API call
    setQuestions(orderedQuestions);
  };
  
  const handleLockQuestion = (questionId: string, lock: boolean) => {
    // Find the question being locked/unlocked
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    // Update the question's lock status
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            isLocked: lock, 
            lockedBy: lock ? currentUser.id : undefined,
            lockedByUsername: lock ? currentUser.username : undefined 
          } 
        : q
    ));
    
    // Add or remove from locked elements
    if (lock) {
      // Add to locked elements
      const lockedElement: LockedElement = {
        id: questionId,
        type: 'question',
        name: question.title,
        lockedBy: {
          id: currentUser.id,
          username: currentUser.username
        },
        lockedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60000), // 30 minutes from now
        active: true
      };
      
      setLockedElements([...lockedElements, lockedElement]);
      
      // Create a notification
      const notification: CollaborationNotification = {
        id: `n${Date.now()}`,
        type: 'element_locked',
        title: 'Element Locked',
        message: `${currentUser.username} locked the question: "${question.title}"`,
        createdAt: new Date(),
        read: false,
        elementId: questionId,
        sessionId: sessionId || 0,
        sender: {
          id: currentUser.id,
          username: currentUser.username
        }
      };
      
      setNotifications([notification, ...notifications]);
    } else {
      // Remove from locked elements
      setLockedElements(lockedElements.filter(e => e.id !== questionId));
      
      // Create a notification
      const notification: CollaborationNotification = {
        id: `n${Date.now()}`,
        type: 'element_unlocked',
        title: 'Element Unlocked',
        message: `${currentUser.username} unlocked the question: "${question.title}"`,
        createdAt: new Date(),
        read: false,
        elementId: questionId,
        sessionId: sessionId || 0,
        sender: {
          id: currentUser.id,
          username: currentUser.username
        }
      };
      
      setNotifications([notification, ...notifications]);
    }
  };
  
  const handleAddOption = (questionId: string, option: Omit<QuestionOption, 'id'>) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: [
              ...(q.options || []), 
              { 
                id: `o${Date.now()}`, 
                ...option 
              }
            ] 
          } 
        : q
    ));
  };
  
  const handleUpdateOption = (questionId: string, optionId: string, updates: Partial<QuestionOption>) => {
    setQuestions(questions.map(q => 
      q.id === questionId && q.options 
        ? { 
            ...q, 
            options: q.options.map(o => 
              o.id === optionId 
                ? { ...o, ...updates } 
                : o
            ) 
          } 
        : q
    ));
  };
  
  const handleDeleteOption = (questionId: string, optionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId && q.options 
        ? { 
            ...q, 
            options: q.options.filter(o => o.id !== optionId) 
          } 
        : q
    ));
  };
  
  // Version control handlers
  const handleCreateVersion = (name: string, description: string) => {
    // Set all existing versions to not current
    const updatedVersions = versions.map(v => ({ ...v, isCurrent: false }));
    
    // Create new version
    const newVersion: Version = {
      id: `v${Date.now()}`,
      name,
      description,
      createdAt: new Date(),
      createdBy: {
        id: currentUser.id,
        username: currentUser.username
      },
      isCurrent: true
    };
    
    // Add to versions
    setVersions([...updatedVersions, newVersion]);
    
    // Create notification
    const notification: CollaborationNotification = {
      id: `n${Date.now()}`,
      type: 'version_created',
      title: 'Version Created',
      message: `${currentUser.username} created version "${name}"`,
      createdAt: new Date(),
      read: false,
      sessionId: sessionId || 0,
      sender: {
        id: currentUser.id,
        username: currentUser.username
      }
    };
    
    setNotifications([notification, ...notifications]);
    
    // Show toast
    toast({
      title: 'Version Created',
      description: `Version "${name}" has been created successfully`,
    });
  };
  
  const handleSwitchVersion = (versionId: string) => {
    // Set all versions to not current
    const updatedVersions = versions.map(v => ({ 
      ...v, 
      isCurrent: v.id === versionId 
    }));
    
    // Update versions
    setVersions(updatedVersions);
    
    // Get the version name
    const versionName = versions.find(v => v.id === versionId)?.name || 'Unknown version';
    
    // Show toast
    toast({
      title: 'Version Switched',
      description: `Switched to version "${versionName}"`,
    });
  };
  
  const handleCompareVersions = (versionId1: string, versionId2: string) => {
    // In a real implementation, this would fetch version data and display a diff view
    toast({
      title: 'Compare Versions',
      description: 'Version comparison would be displayed here',
    });
  };
  
  const handleRestoreVersion = (versionId: string) => {
    // In a real implementation, this would restore a previous version
    // For now, we'll just switch to it
    handleSwitchVersion(versionId);
    
    // Show toast
    toast({
      title: 'Version Restored',
      description: 'The selected version has been restored',
    });
  };
  
  // Review process handlers
  const handleCreateReviewRequest = (title: string, description: string, reviewerIds: number[]) => {
    // Create a new review request
    const newReview: ReviewRequest = {
      id: `r${Date.now()}`,
      title,
      description,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      requestedBy: {
        id: currentUser.id,
        username: currentUser.username
      },
      reviewers: reviewerIds.map(id => ({
        id,
        username: id === 2 ? 'jane_doe' : 'john_smith', // In a real app, this would be fetched from the server
        status: 'pending'
      })),
      comments: []
    };
    
    // Add to review requests
    setReviewRequests([...reviewRequests, newReview]);
    
    // Create notification for each reviewer
    reviewerIds.forEach(id => {
      const notification: CollaborationNotification = {
        id: `n${Date.now()}-${id}`,
        type: 'review_requested',
        title: 'Review Requested',
        message: `${currentUser.username} requested your review on "${title}"`,
        createdAt: new Date(),
        read: false,
        sessionId: sessionId || 0,
        sender: {
          id: currentUser.id,
          username: currentUser.username
        }
      };
      
      // In a real app, this would be sent to the specific user
      setNotifications([notification, ...notifications]);
    });
    
    // Show toast
    toast({
      title: 'Review Requested',
      description: 'Your review request has been sent',
    });
  };
  
  const handleUpdateReviewStatus = (reviewId: string, status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'changes_requested') => {
    // Update the review status
    setReviewRequests(reviewRequests.map(r => 
      r.id === reviewId 
        ? { ...r, status, updatedAt: new Date() } 
        : r
    ));
  };
  
  const handleAddReviewComment = (reviewId: string, content: string, elementId?: string) => {
    // Add a comment to the review
    setReviewRequests(reviewRequests.map(r => 
      r.id === reviewId 
        ? { 
            ...r, 
            comments: [
              ...r.comments,
              {
                id: `c${Date.now()}`,
                userId: currentUser.id,
                username: currentUser.username,
                content,
                createdAt: new Date(),
                elementId
              }
            ],
            updatedAt: new Date()
          } 
        : r
    ));
    
    // Create notification for the review creator
    const review = reviewRequests.find(r => r.id === reviewId);
    if (review && review.requestedBy.id !== currentUser.id) {
      const notification: CollaborationNotification = {
        id: `n${Date.now()}`,
        type: 'comment',
        title: 'New Review Comment',
        message: `${currentUser.username} commented on your review "${review.title}"`,
        createdAt: new Date(),
        read: false,
        sessionId: sessionId || 0,
        sender: {
          id: currentUser.id,
          username: currentUser.username
        }
      };
      
      // In a real app, this would be sent to the specific user
      setNotifications([notification, ...notifications]);
    }
  };
  
  const handleCompleteReview = (reviewId: string, approved: boolean, comment: string) => {
    // First add the comment
    handleAddReviewComment(reviewId, comment);
    
    // Update the review status
    handleUpdateReviewStatus(reviewId, approved ? 'approved' : 'changes_requested');
    
    // Update the reviewer's status
    setReviewRequests(reviewRequests.map(r => 
      r.id === reviewId 
        ? { 
            ...r, 
            reviewers: r.reviewers.map(reviewer => 
              reviewer.id === currentUser.id 
                ? { ...reviewer, status: approved ? 'approved' : 'changes_requested' } 
                : reviewer
            ) 
          } 
        : r
    ));
    
    // Create notification for the review creator
    const review = reviewRequests.find(r => r.id === reviewId);
    if (review) {
      const notification: CollaborationNotification = {
        id: `n${Date.now()}`,
        type: approved ? 'approved' : 'changes_requested',
        title: approved ? 'Review Approved' : 'Changes Requested',
        message: approved 
          ? `${currentUser.username} approved your review "${review.title}"` 
          : `${currentUser.username} requested changes on "${review.title}"`,
        createdAt: new Date(),
        read: false,
        sessionId: sessionId || 0,
        sender: {
          id: currentUser.id,
          username: currentUser.username
        }
      };
      
      // In a real app, this would be sent to the specific user
      setNotifications([notification, ...notifications]);
    }
  };
  
  // Notification handlers
  const handleToggleNotifications = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
  };
  
  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };
  
  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };
  
  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
  };
  
  const handleClickNotification = (notification: CollaborationNotification) => {
    // In a real app, this would navigate to the specific content
    toast({
      title: 'Notification Clicked',
      description: `Clicked on notification: ${notification.title}`,
    });
  };
  
  // Element locking handlers
  const handleLockElement = (elementId: string, elementType: 'question' | 'section' | 'page' | 'option' | 'logic' | 'setting', elementName: string) => {
    // Check if the element is already locked
    const existingLock = lockedElements.find(e => e.id === elementId && e.active);
    
    if (existingLock) {
      toast({
        title: 'Element Already Locked',
        description: `This element is already locked by ${existingLock.lockedBy.username}`,
        variant: 'destructive',
      });
      return;
    }
    
    // Create a new lock
    const newLock: LockedElement = {
      id: elementId,
      type: elementType,
      name: elementName,
      lockedBy: {
        id: currentUser.id,
        username: currentUser.username
      },
      lockedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60000), // 30 minutes from now
      active: true
    };
    
    // Add to locked elements
    setLockedElements([...lockedElements, newLock]);
    
    // Create notification
    const notification: CollaborationNotification = {
      id: `n${Date.now()}`,
      type: 'element_locked',
      title: 'Element Locked',
      message: `${currentUser.username} locked the ${elementType}: "${elementName}"`,
      createdAt: new Date(),
      read: false,
      elementId,
      sessionId: sessionId || 0,
      sender: {
        id: currentUser.id,
        username: currentUser.username
      }
    };
    
    setNotifications([notification, ...notifications]);
    
    // If this is a question, also update the question's lock status
    if (elementType === 'question') {
      handleLockQuestion(elementId, true);
    }
  };
  
  const handleUnlockElement = (elementId: string) => {
    // Find the element being unlocked
    const element = lockedElements.find(e => e.id === elementId && e.active);
    if (!element) return;
    
    // Update the element's lock status
    setLockedElements(lockedElements.map(e => 
      e.id === elementId && e.active ? { ...e, active: false } : e
    ));
    
    // Create notification
    const notification: CollaborationNotification = {
      id: `n${Date.now()}`,
      type: 'element_unlocked',
      title: 'Element Unlocked',
      message: `${currentUser.username} unlocked the ${element.type}: "${element.name}"`,
      createdAt: new Date(),
      read: false,
      elementId,
      sessionId: sessionId || 0,
      sender: {
        id: currentUser.id,
        username: currentUser.username
      }
    };
    
    setNotifications([notification, ...notifications]);
    
    // If this is a question, also update the question's lock status
    if (element.type === 'question') {
      handleLockQuestion(elementId, false);
    }
  };
  
  const handleRefreshLock = (elementId: string) => {
    // Update the lock expiration time
    setLockedElements(lockedElements.map(e => 
      e.id === elementId && e.active 
        ? { ...e, expiresAt: new Date(Date.now() + 30 * 60000) } // 30 minutes from now
        : e
    ));
    
    // Show toast
    toast({
      title: 'Lock Extended',
      description: 'Your lock has been extended for 30 minutes',
    });
  };
  
  const handleViewLockedElement = (elementId: string, elementType: 'question' | 'section' | 'page' | 'option' | 'logic' | 'setting') => {
    // In a real app, this would navigate to the specific content
    toast({
      title: 'View Locked Element',
      description: `Viewing ${elementType} with ID ${elementId}`,
    });
  };
  
  // If no session is selected, show the sessions list
  if (!sessionId) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setLocation('/dashboard')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        
        <CollaborationSessions
          userId={currentUser.id}
          username={currentUser.username}
          onCreateSession={handleCreateSession}
        />
      </div>
    );
  }
  
  // Get available reviewers (everyone except current user)
  const availableReviewers = participants.filter(p => p.id !== currentUser.id);
  
  // If a session is selected, show the collaborative editor and other components
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setLocation('/collaboration')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sessions
        </Button>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{currentUser.username}</span>
            </div>
            <div className="h-4 w-px bg-border"></div>
            <div className="text-sm font-medium">{sessionTitle}</div>
          </div>
          
          <NotificationSystem
            notifications={notifications}
            notificationsEnabled={notificationsEnabled}
            onToggleNotifications={handleToggleNotifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onDeleteNotification={handleDeleteNotification}
            onClickNotification={handleClickNotification}
          />
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="editor">
            <MessagesSquare className="mr-2 h-4 w-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="questions">
            <FileText className="mr-2 h-4 w-4" />
            Questions
          </TabsTrigger>
          <TabsTrigger value="version-control">
            <History className="mr-2 h-4 w-4" />
            Versions
          </TabsTrigger>
          <TabsTrigger value="review">
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Reviews
          </TabsTrigger>
          <TabsTrigger value="locks">
            <Lock className="mr-2 h-4 w-4" />
            Locks
          </TabsTrigger>
          <TabsTrigger value="participants">
            <Users className="mr-2 h-4 w-4" />
            Participants
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="editor" className="mt-6">
          <CollaborativeEditor
            sessionId={sessionId}
            userId={currentUser.id}
            username={currentUser.username}
            initialContent="# Survey Collaboration Document\n\nUse this space to collaboratively edit survey content and questions. Add comments and suggestions by selecting text and clicking the comment button."
          />
        </TabsContent>
        
        <TabsContent value="questions" className="mt-6">
          <QuestionManager
            sessionId={sessionId}
            questions={questions}
            userId={currentUser.id}
            username={currentUser.username}
            onAddQuestion={handleAddQuestion}
            onUpdateQuestion={handleUpdateQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onMoveQuestion={handleMoveQuestion}
            onLockQuestion={handleLockQuestion}
            onAddOption={handleAddOption}
            onUpdateOption={handleUpdateOption}
            onDeleteOption={handleDeleteOption}
          />
        </TabsContent>
        
        <TabsContent value="version-control" className="mt-6">
          <VersionControl
            versions={versions}
            sessionId={sessionId}
            userId={currentUser.id}
            username={currentUser.username}
            onCreateVersion={handleCreateVersion}
            onSwitchVersion={handleSwitchVersion}
            onCompareVersions={handleCompareVersions}
            onRestoreVersion={handleRestoreVersion}
          />
        </TabsContent>
        
        <TabsContent value="review" className="mt-6">
          <ReviewProcess
            sessionId={sessionId}
            userId={currentUser.id}
            username={currentUser.username}
            reviewRequests={reviewRequests}
            onCreateReviewRequest={handleCreateReviewRequest}
            onUpdateReviewStatus={handleUpdateReviewStatus}
            onAddReviewComment={handleAddReviewComment}
            onCompleteReview={handleCompleteReview}
            availableReviewers={availableReviewers}
          />
        </TabsContent>
        
        <TabsContent value="locks" className="mt-6">
          <ElementLocking
            sessionId={sessionId}
            userId={currentUser.id}
            username={currentUser.username}
            lockedElements={lockedElements}
            onLockElement={handleLockElement}
            onUnlockElement={handleUnlockElement}
            onRefreshLock={handleRefreshLock}
            onViewLockedElement={handleViewLockedElement}
          />
        </TabsContent>
        
        <TabsContent value="participants" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {participants.map(participant => (
                  <div 
                    key={participant.id}
                    className="flex items-center justify-between border-b pb-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${participant.status === 'online' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <div>
                        <div className="font-medium">{participant.username}</div>
                        <div className="text-sm text-muted-foreground">
                          {participant.status === 'online' ? 'Currently active' : 'Offline'}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Badge variant={participant.id === currentUser.id ? 'default' : 'outline'}>
                        {participant.id === currentUser.id ? 'You' : 'Collaborator'}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  <Users className="mr-2 h-4 w-4" />
                  Invite More Participants
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SurveyCollaboration;