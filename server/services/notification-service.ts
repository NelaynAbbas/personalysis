import { db } from '../db';
import { notifications, users } from '../../shared/schema';
import { eq, and, isNull, lt, desc } from 'drizzle-orm';
import { WebSocketManager } from '../utils/websocketManager';
import { Logger } from '../utils/Logger';

const logger = new Logger('NotificationService');

export interface CreateAdminNotificationInput {
  category: 'user' | 'survey' | 'response' | 'ai' | 'system';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
  actionableUserId?: number;
}

export interface NotificationResult {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  metadata: any;
  isGlobal: boolean;
  category: string | null;
  priority: string | null;
  actionableUserId: number | null;
  createdAt: Date;
  updatedAt: Date | null;
  expiresAt: Date | null;
}

/**
 * NotificationService - Centralized service for managing admin notifications
 * All notifications are created with isGlobal=true and userId=1 (admin system user)
 */
export class NotificationService {
  private websocketManager: WebSocketManager;

  constructor(websocketManager: WebSocketManager) {
    this.websocketManager = websocketManager;
  }

  /**
   * Create a global admin notification
   * Notifications are stored with userId=1 (system admin) but visible to all admins
   */
  async createAdminNotification(
    input: CreateAdminNotificationInput
  ): Promise<NotificationResult> {
    try {
      // Insert notification with isGlobal=true
      const result = await db
        .insert(notifications)
        .values({
          userId: 1, // System admin user - visible to all admins
          type: input.priority === 'high' ? 'alert' : 'info',
          title: input.title,
          message: input.message,
          isRead: false,
          link: input.link || null,
          metadata: input.metadata || null,
          isGlobal: true,
          category: input.category,
          priority: input.priority,
          actionableUserId: input.actionableUserId || null,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        })
        .returning();

      const notification = result[0];

      logger.info(
        `[CREATE_NOTIFICATION] Created ${input.category}/${input.priority}: ${input.title}`
      );

      // Broadcast to all connected admins in real-time
      await this.broadcastNotification(notification);

      return notification;
    } catch (error) {
      logger.error('[CREATE_NOTIFICATION] Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get admin notifications with optional filtering
   */
  async getAdminNotifications(
    filters?: {
      isRead?: boolean;
      category?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<NotificationResult[]> {
    try {
      // Build where conditions
      const conditions = [eq(notifications.isGlobal, true)];

      if (filters?.isRead !== undefined) {
        conditions.push(eq(notifications.isRead, filters.isRead));
      }

      if (filters?.category) {
        conditions.push(eq(notifications.category, filters.category));
      }

      // Build query
      let query = db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt));

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.offset(filters.offset);
      }

      const results = await query;
      return results;
    } catch (error) {
      logger.error('[GET_NOTIFICATIONS] Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Get count of unread admin notifications
   */
  async getUnreadCount(): Promise<number> {
    try {
      const result = await db
        .select()
        .from(notifications)
        .where(and(eq(notifications.isGlobal, true), eq(notifications.isRead, false)));

      return result.length;
    } catch (error) {
      logger.error('[GET_UNREAD_COUNT] Error fetching unread count:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number): Promise<NotificationResult | null> {
    try {
      const result = await db
        .update(notifications)
        .set({
          isRead: true,
          updatedAt: new Date(),
        })
        .where(
          and(eq(notifications.id, notificationId), eq(notifications.isGlobal, true))
        )
        .returning();

      if (result.length > 0) {
        logger.info(`[MARK_READ] Marked notification ${notificationId} as read`);
        return result[0];
      }

      return null;
    } catch (error) {
      logger.error('[MARK_READ] Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<number> {
    try {
      const result = await db
        .update(notifications)
        .set({
          isRead: true,
          updatedAt: new Date(),
        })
        .where(and(eq(notifications.isGlobal, true), eq(notifications.isRead, false)))
        .returning();

      logger.info(`[MARK_ALL_READ] Marked ${result.length} notifications as read`);
      return result.length;
    } catch (error) {
      logger.error('[MARK_ALL_READ] Error marking all as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(notifications)
        .where(
          and(eq(notifications.id, notificationId), eq(notifications.isGlobal, true))
        )
        .returning();

      if (result.length > 0) {
        logger.info(`[DELETE_NOTIFICATION] Deleted notification ${notificationId}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('[DELETE_NOTIFICATION] Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Clean up old notifications (30+ days old)
   * Run daily via cron job
   */
  async cleanupOldNotifications(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const result = await db
        .delete(notifications)
        .where(
          and(
            eq(notifications.isGlobal, true),
            lt(notifications.createdAt, thirtyDaysAgo)
          )
        )
        .returning();

      logger.info(
        `[CLEANUP] Deleted ${result.length} notifications older than 30 days`
      );
      return result.length;
    } catch (error) {
      logger.error('[CLEANUP] Error cleaning up old notifications:', error);
      throw error;
    }
  }

  /**
   * Broadcast notification to all connected admins via WebSocket
   */
  async broadcastNotification(notification: NotificationResult): Promise<void> {
    try {
      this.websocketManager.broadcast({
        type: 'notificationUpdate',
        data: notification,
        timestamp: new Date().toISOString(),
      });

      logger.info(`[BROADCAST] Notification broadcasted: ${notification.id}`);
    } catch (error) {
      logger.error('[BROADCAST] Error broadcasting notification:', error);
      // Don't throw - broadcasting failure shouldn't prevent notification creation
    }
  }
}

// Export singleton instance
export let notificationService: NotificationService;

/**
 * Initialize the notification service with WebSocket manager
 */
export function initializeNotificationService(
  websocketManager: WebSocketManager
): NotificationService {
  notificationService = new NotificationService(websocketManager);
  logger.info('[INIT] NotificationService initialized');
  return notificationService;
}
