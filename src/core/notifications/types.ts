/**
 * Notification Type System
 * 
 * This module defines the structure for storing notifications with i18n keys
 * instead of resolved text. This allows notifications to be translated on-the-fly
 * based on the user's current locale.
 */

/**
 * Notification data stored in the database
 * This format uses i18n keys and variables for translation
 */
export type NotificationData = {
  /** Type identifier for the notification (e.g., "shipment_requested", "order_completed") */
  type: string;
  
  /** i18n key for the notification title */
  title: string;
  
  /** i18n key for the notification message */
  message: string;
  
  /** Variables to be interpolated in the translated strings */
  variables?: Record<string, unknown>;
  
  /** Additional metadata for the notification */
  metadata?: Record<string, unknown>;
  
  /** Optional image URL for rich notifications */
  imageUrl?: string;
  
  /** Deep link or action URL */
  actionUrl?: string;
  
  /** Channel-specific delivery results (for tracking) */
  channels?: {
    email?: {
      sent: boolean;
      messageId?: string;
      error?: string;
    };
    push?: {
      sent: boolean;
      successCount?: number;
      failureCount?: number;
      error?: string;
    };
  };
};

/**
 * Base notification type definition
 * Each notification type should implement this interface
 */
export interface NotificationType {
  /** Unique identifier for this notification type */
  type: string;
  
  /** i18n key for the title */
  titleKey: string;
  
  /** i18n key for the message */
  messageKey: string;
  
  /** Optional i18n key for email subject */
  emailSubjectKey?: string;
  
  /** Optional email template ID */
  emailTemplateId?: string;
  
  /** Function to build the notification data */
  build(variables?: Record<string, unknown>): NotificationData;
}

/**
 * Options for sending a notification
 */
export type SendNotificationOptions = {
  /** User ID to send the notification to */
  userId: number;
  
  /** Notification data (use NotificationType.build() to create) */
  data: NotificationData;
  
  /** User's locale for sending push/email (fetched from user if not provided) */
  locale?: string;
  
  /** Whether to send push notification */
  sendPush?: boolean;
  
  /** Whether to send email notification */
  sendEmail?: boolean;
  
  /** Email address (if different from user's primary email) */
  emailTo?: string;
  
  /** Whether to mark as read immediately */
  markAsRead?: boolean;
  
  /** Whether to use queue for async delivery */
  useQueue?: boolean;
  
  /** Additional email context for template rendering */
  emailContext?: Record<string, unknown>;
};

/**
 * Result of sending a notification
 */
export type SendNotificationResult = {
  /** ID of the persisted notification in database */
  notificationId?: string;
  
  /** Whether push notification was sent successfully */
  pushSent?: boolean;
  
  /** Whether email was sent successfully */
  emailSent?: boolean;
  
  /** IDs of queued jobs */
  queuedJobs?: {
    emailJobId?: string;
    pushJobId?: string;
  };
  
  /** Any errors that occurred */
  errors?: string[];
};

