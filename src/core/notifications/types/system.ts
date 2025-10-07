import { BaseNotification } from "../base";
import type { NotificationData } from "../types";

/**
 * Maintenance Mode Notification
 * Sent when app is going into maintenance mode
 */
export class MaintenanceModeNotification extends BaseNotification {
  readonly type = "system_maintenance";
  readonly titleKey = "messages.push_notification.system.maintenance.title";
  readonly messageKey = "messages.push_notification.system.maintenance.message";
  readonly emailSubjectKey = "messages.email.system.maintenance.subject";

  build(variables: { startTime: string; duration?: string }): NotificationData {
    return {
      ...super.build(variables),
    };
  }
}

/**
 * App Update Available Notification
 * Sent when a new app version is available
 */
export class AppUpdateAvailableNotification extends BaseNotification {
  readonly type = "system_app_update";
  readonly titleKey = "messages.push_notification.system.app_update.title";
  readonly messageKey = "messages.push_notification.system.app_update.message";

  build(variables: { version: string; isRequired: boolean }): NotificationData {
    return {
      ...super.build(variables),
      metadata: {
        version: variables.version,
        isRequired: variables.isRequired,
      },
    };
  }
}

/**
 * Announcement Notification
 * Sent for general announcements from admin
 */
export class AnnouncementNotification extends BaseNotification {
  readonly type = "system_announcement";
  readonly titleKey = "messages.push_notification.system.announcement.title";
  readonly messageKey = "messages.push_notification.system.announcement.message";
  readonly emailSubjectKey = "messages.email.system.announcement.subject";

  build(variables: { announcementText?: string; announcementTitle?: string }): NotificationData {
    return {
      ...super.build(variables),
    };
  }
}

// Export instances for easy usage
export const systemNotifications = {
  maintenance: new MaintenanceModeNotification(),
  appUpdate: new AppUpdateAvailableNotification(),
  announcement: new AnnouncementNotification(),
};

