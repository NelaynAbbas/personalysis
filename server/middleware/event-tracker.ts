import { Logger } from '../utils/Logger';

const logger = new Logger('EventTracker');

// Global reference to notification service (set during server initialization)
let notificationServiceInstance: any = null;

// Set the notification service (called from server/index.ts during initialization)
export function setNotificationService(service: any) {
  notificationServiceInstance = service;
  logger.info('[EVENT_TRACKER] NotificationService initialized');
}

// Lazy access to avoid circular dependencies
function getNotificationService() {
  if (!notificationServiceInstance) {
    logger.warn('[TRACK_EVENT] NotificationService not yet initialized');
    return null;
  }
  return notificationServiceInstance;
}

/**
 * Event types and their notification configurations
 */
export const TRACKED_EVENTS = {
  USER_SIGNUP: {
    category: 'user' as const,
    priority: 'medium' as const,
    getTitleMessage: (data: any) => ({
      title: 'New User Signup',
      message: `${data.email || 'User'} just signed up for an account.`,
    }),
  },
  USER_PROFILE_UPDATED: {
    category: 'user' as const,
    priority: 'low' as const,
    getTitleMessage: (data: any) => ({
      title: 'User Profile Updated',
      message: `${data.email || 'User'} updated their profile information.`,
    }),
  },
  SURVEY_CREATED: {
    category: 'survey' as const,
    priority: 'medium' as const,
    getTitleMessage: (data: any) => ({
      title: 'Survey Created',
      message: `New survey "${data.name || 'Untitled'}" created by ${data.createdBy || 'unknown'}.`,
    }),
  },
  SURVEY_UPDATED: {
    category: 'survey' as const,
    priority: 'low' as const,
    getTitleMessage: (data: any) => ({
      title: 'Survey Updated',
      message: `Survey "${data.name || 'Untitled'}" was updated.`,
    }),
  },
  SURVEY_DELETED: {
    category: 'survey' as const,
    priority: 'high' as const,
    getTitleMessage: (data: any) => ({
      title: 'Survey Deleted',
      message: `Survey "${data.name || 'Untitled'}" was permanently deleted.`,
    }),
  },
  SURVEY_PUBLISHED: {
    category: 'survey' as const,
    priority: 'medium' as const,
    getTitleMessage: (data: any) => ({
      title: 'Survey Published',
      message: `Survey "${data.name || 'Untitled'}" is now live and collecting responses.`,
    }),
  },
  RESPONSE_SUBMITTED: {
    category: 'response' as const,
    priority: 'low' as const,
    getTitleMessage: (data: any) => ({
      title: 'New Survey Response',
      message: `New response submitted to survey "${data.surveyName || 'Untitled'}".`,
    }),
  },
  USER_PROFILE_DELETED: {
    category: 'user' as const,
    priority: 'high' as const,
    getTitleMessage: (data: any) => ({
      title: 'User Account Deleted',
      message: `User account "${data.email || 'unknown'}" was deleted.`,
    }),
  },
  AI_JOB_STARTED: {
    category: 'ai' as const,
    priority: 'low' as const,
    getTitleMessage: (data: any) => ({
      title: 'AI Analysis Started',
      message: `AI analysis job started for ${data.surveyCount || 0} surveys.`,
    }),
  },
  AI_JOB_COMPLETED: {
    category: 'ai' as const,
    priority: 'medium' as const,
    getTitleMessage: (data: any) => ({
      title: 'AI Analysis Complete',
      message: `AI analysis job completed successfully. ${data.processedCount || 0} items processed.`,
    }),
  },
  AI_JOB_FAILED: {
    category: 'ai' as const,
    priority: 'high' as const,
    getTitleMessage: (data: any) => ({
      title: 'AI Analysis Failed',
      message: `AI analysis job failed: ${data.error || 'Unknown error'}`,
    }),
  },
  SYSTEM_ERROR: {
    category: 'system' as const,
    priority: 'high' as const,
    getTitleMessage: (data: any) => ({
      title: 'System Error',
      message: `System error occurred: ${data.errorMessage || 'Unknown error'}`,
    }),
  },
  SYSTEM_WARNING: {
    category: 'system' as const,
    priority: 'medium' as const,
    getTitleMessage: (data: any) => ({
      title: 'System Warning',
      message: `${data.message || 'System warning detected'}`,
    }),
  },
} as const;

export type EventType = keyof typeof TRACKED_EVENTS;

/**
 * Track an event and create an admin notification
 * @param eventType - Type of event that occurred
 * @param data - Event-specific data
 * @param userId - ID of user who triggered the event
 * @param link - Optional link to the related resource
 */
export async function trackEvent(
  eventType: EventType,
  data: any,
  userId?: number,
  link?: string
): Promise<void> {
  try {
    const eventConfig = TRACKED_EVENTS[eventType];

    if (!eventConfig) {
      logger.warn(`[TRACK_EVENT] Unknown event type: ${eventType}`);
      return;
    }

    const { title, message } = eventConfig.getTitleMessage(data);

    // Get notification service (lazy loaded to avoid timing issues)
    const notificationService = getNotificationService();
    if (!notificationService) {
      logger.error(`[TRACK_EVENT] NotificationService not available for event ${eventType}`);
      return;
    }

    // Create admin notification
    await notificationService.createAdminNotification({
      category: eventConfig.category,
      priority: eventConfig.priority,
      title,
      message,
      link,
      metadata: {
        eventType,
        ...data,
      },
      actionableUserId: userId,
    });

    logger.info(`[TRACK_EVENT] Event tracked: ${eventType}`);
  } catch (error) {
    logger.error(`[TRACK_EVENT] Error tracking event ${eventType}:`, error);
    // Don't throw - event tracking failure shouldn't break the request
  }
}

/**
 * Convenience function to track user signup
 */
export async function trackUserSignup(
  email: string,
  userId: number
): Promise<void> {
  await trackEvent('USER_SIGNUP', { email }, userId);
}

/**
 * Convenience function to track survey creation
 */
export async function trackSurveyCreated(
  surveyId: number,
  surveyName: string,
  createdBy: string,
  userId: number
): Promise<void> {
  await trackEvent(
    'SURVEY_CREATED',
    { name: surveyName, createdBy },
    userId,
    `/surveys/${surveyId}`
  );
}

/**
 * Convenience function to track survey update
 */
export async function trackSurveyUpdated(
  surveyId: number,
  surveyName: string,
  userId: number
): Promise<void> {
  await trackEvent(
    'SURVEY_UPDATED',
    { name: surveyName },
    userId,
    `/surveys/${surveyId}`
  );
}

/**
 * Convenience function to track survey deletion
 */
export async function trackSurveyDeleted(
  surveyName: string,
  userId: number
): Promise<void> {
  await trackEvent('SURVEY_DELETED', { name: surveyName }, userId);
}

/**
 * Convenience function to track survey publication
 */
export async function trackSurveyPublished(
  surveyId: number,
  surveyName: string,
  userId: number
): Promise<void> {
  await trackEvent(
    'SURVEY_PUBLISHED',
    { name: surveyName },
    userId,
    `/surveys/${surveyId}`
  );
}

/**
 * Convenience function to track response submission
 */
export async function trackResponseSubmitted(
  surveyId: number,
  surveyName: string
): Promise<void> {
  await trackEvent(
    'RESPONSE_SUBMITTED',
    { surveyName },
    undefined,
    `/surveys/${surveyId}/responses`
  );
}

/**
 * Convenience function to track AI job completion
 */
export async function trackAIJobCompleted(
  jobId: number,
  processedCount: number
): Promise<void> {
  await trackEvent(
    'AI_JOB_COMPLETED',
    { processedCount },
    undefined,
    `/ai-jobs/${jobId}`
  );
}

/**
 * Convenience function to track AI job failure
 */
export async function trackAIJobFailed(
  jobId: number,
  error: string
): Promise<void> {
  await trackEvent(
    'AI_JOB_FAILED',
    { error },
    undefined,
    `/ai-jobs/${jobId}`
  );
}

/**
 * Convenience function to track system error
 */
export async function trackSystemError(
  errorMessage: string,
  errorDetails?: any
): Promise<void> {
  await trackEvent('SYSTEM_ERROR', {
    errorMessage,
    details: errorDetails,
  });
}

/**
 * Convenience function to track system warning
 */
export async function trackSystemWarning(
  message: string,
  details?: any
): Promise<void> {
  await trackEvent('SYSTEM_WARNING', { message, details });
}
