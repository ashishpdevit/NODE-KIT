import { BaseNotification } from "../base";
import type { NotificationData } from "../types";

/**
 * Welcome Notification
 * Sent when a new user registers
 */
export class WelcomeNotification extends BaseNotification {
  readonly type = "auth_welcome";
  readonly titleKey = "messages.push_notification.auth.welcome.title";
  readonly messageKey = "messages.push_notification.auth.welcome.message";
  readonly emailSubjectKey = "messages.email.auth.welcome.subject";
  readonly emailTemplateId = "welcome";

  build(variables: { userName?: string }): NotificationData {
    return {
      ...super.build(variables),
      actionUrl: "/profile",
    };
  }
}

/**
 * Password Reset Request Notification
 * Sent when user requests password reset
 */
export class PasswordResetRequestNotification extends BaseNotification {
  readonly type = "auth_password_reset_request";
  readonly titleKey = "messages.push_notification.auth.password_reset.title";
  readonly messageKey = "messages.push_notification.auth.password_reset.message";
  readonly emailSubjectKey = "messages.email.auth.password_reset.subject";
  readonly emailTemplateId = "password-reset";

  build(variables: { resetToken: string; expiresAt?: string }): NotificationData {
    return {
      ...super.build(variables),
      metadata: {
        resetToken: variables.resetToken,
        expiresAt: variables.expiresAt,
      },
    };
  }
}

/**
 * Password Changed Notification
 * Sent when user successfully changes password
 */
export class PasswordChangedNotification extends BaseNotification {
  readonly type = "auth_password_changed";
  readonly titleKey = "messages.push_notification.auth.password_changed.title";
  readonly messageKey = "messages.push_notification.auth.password_changed.message";
  readonly emailSubjectKey = "messages.email.auth.password_changed.subject";
  readonly emailTemplateId = "password-changed";

  build(variables?: { changedAt?: string }): NotificationData {
    return {
      ...super.build(variables),
      actionUrl: "/profile/security",
    };
  }
}

/**
 * Login from New Device Notification
 * Sent when user logs in from a new device
 */
export class NewDeviceLoginNotification extends BaseNotification {
  readonly type = "auth_new_device_login";
  readonly titleKey = "messages.push_notification.auth.new_device.title";
  readonly messageKey = "messages.push_notification.auth.new_device.message";
  readonly emailSubjectKey = "messages.email.auth.new_device.subject";
  readonly emailTemplateId = "new-device-login";

  build(variables: { deviceInfo?: string; location?: string; loginAt?: string }): NotificationData {
    return {
      ...super.build(variables),
      actionUrl: "/profile/security",
      metadata: {
        deviceInfo: variables.deviceInfo,
        location: variables.location,
        loginAt: variables.loginAt,
      },
    };
  }
}

/**
 * Account Status Changed Notification
 * Sent when account status is changed (suspended, activated, etc.)
 */
export class AccountStatusChangedNotification extends BaseNotification {
  readonly type = "auth_account_status_changed";
  readonly titleKey = "messages.push_notification.auth.account_status.title";
  readonly messageKey = "messages.push_notification.auth.account_status.message";
  readonly emailSubjectKey = "messages.email.auth.account_status.subject";
  readonly emailTemplateId = "account-status-changed";

  build(variables: { status: string; reason?: string }): NotificationData {
    return {
      ...super.build(variables),
      metadata: {
        status: variables.status,
        reason: variables.reason,
      },
    };
  }
}

/**
 * Logged Out Notification
 * Sent when user logs out
 */
export class LoggedOutNotification extends BaseNotification {

  readonly type = "auth_logged_out";
  readonly titleKey = "messages.push_notification.auth.logout.title";
  readonly messageKey = "messages.push_notification.auth.logout.message";
  readonly emailSubjectKey = "messages.email.auth.logout.subject";
  readonly emailTemplateId = "logged-out";

  build(variables?: Record<string, unknown>): NotificationData {
    const baseData = super.build(variables);
    return {
      ...baseData,
      metadata: {
        ...baseData.metadata,
        emailSubjectKey: this.emailSubjectKey,
        emailTemplateId: this.emailTemplateId,
      },
    };
  }
}

// Export instances for easy usage
export const authNotifications = {
  welcome: new WelcomeNotification(),
  passwordResetRequest: new PasswordResetRequestNotification(),
  passwordChanged: new PasswordChangedNotification(),
  newDeviceLogin: new NewDeviceLoginNotification(),
  accountStatusChanged: new AccountStatusChangedNotification(),
  logout: new LoggedOutNotification(),
};

