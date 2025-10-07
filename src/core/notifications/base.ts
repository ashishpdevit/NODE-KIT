import type { NotificationType, NotificationData } from "./types";

/**
 * Base class for notification types
 * Extend this class to create new notification types
 */
export abstract class BaseNotification implements NotificationType {
  abstract readonly type: string;
  abstract readonly titleKey: string;
  abstract readonly messageKey: string;
  
  emailSubjectKey?: string;
  emailTemplateId?: string;

  /**
   * Build notification data with variables
   */
  build(variables?: Record<string, unknown>): NotificationData {
    return {
      type: this.type,
      title: this.titleKey,
      message: this.messageKey,
      variables: variables || {},
      metadata: this.getMetadata(variables),
    };
  }

  /**
   * Override this method to add custom metadata
   */
  protected getMetadata(_variables?: Record<string, unknown>): Record<string, unknown> {
    return {};
  }
}

/**
 * Helper function to create a simple notification type
 */
export function createNotification(config: {
  type: string;
  titleKey: string;
  messageKey: string;
  emailSubjectKey?: string;
  emailTemplateId?: string;
}): NotificationType {
  return {
    type: config.type,
    titleKey: config.titleKey,
    messageKey: config.messageKey,
    emailSubjectKey: config.emailSubjectKey,
    emailTemplateId: config.emailTemplateId,
    build(variables?: Record<string, unknown>): NotificationData {
      return {
        type: config.type,
        title: config.titleKey,
        message: config.messageKey,
        variables: variables || {},
      };
    },
  };
}

