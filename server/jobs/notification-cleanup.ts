import cron from 'node-cron';
import { notificationService } from '../services/notification-service';
import { Logger } from '../utils/Logger';

const logger = new Logger('NotificationCleanup');

/**
 * Initialize scheduled notification cleanup job
 * Runs daily at 2:00 AM to remove notifications older than 30 days
 */
export function initializeNotificationCleanup(): void {
  // Schedule cleanup for 2:00 AM every day
  // Format: minute hour day month dayOfWeek
  cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('[CLEANUP_JOB] Starting scheduled notification cleanup...');
      const deletedCount = await notificationService.cleanupOldNotifications();
      logger.info(`[CLEANUP_JOB] Cleanup completed. Deleted ${deletedCount} old notifications.`);
    } catch (error) {
      logger.error('[CLEANUP_JOB] Error during notification cleanup:', error);
    }
  });

  logger.info('[CLEANUP_JOB] Notification cleanup job scheduled for daily at 2:00 AM');
}

/**
 * Manual trigger for notification cleanup (for testing/admin purposes)
 */
export async function triggerNotificationCleanup(): Promise<number> {
  try {
    logger.info('[MANUAL_CLEANUP] Triggering manual notification cleanup...');
    const deletedCount = await notificationService.cleanupOldNotifications();
    logger.info(`[MANUAL_CLEANUP] Manual cleanup completed. Deleted ${deletedCount} old notifications.`);
    return deletedCount;
  } catch (error) {
    logger.error('[MANUAL_CLEANUP] Error during manual notification cleanup:', error);
    throw error;
  }
}
