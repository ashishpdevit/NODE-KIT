/**
 * Examples demonstrating how to use the queued email and push notification system
 */

import { notificationCenter } from "@/core/services/notificationCenter";
import { queuedMailer } from "@/core/lib/queuedMailer";
import { queuedPushClient } from "@/core/lib/queuedPushClient";
import { logger } from "@/core/utils/logger";

const defaultDeviceToken = process.env.DEFAULT_DEVICE_TOKEN || "d7SS3nq_Wk0Lumw6EWpA_u:APA91bFWwtWmy3kVc6AN8YhAyeMPjccsWXwMLmaW4Nm7uawHyhcl52Bbe8tD5VwPwOxt-6Sn1OUwoqWKYmvm1AzSBAHpgpZb-iesahraiu1dWrhP933SUNw";
/**
 * Example 1: Using notificationCenter with queues
 */
export const sendQueuedNotification = async (userId: number) => {
  try {
    const result = await notificationCenter.notifyUserQueued(userId, {
      title: "Welcome to our app!",
      message: "Thank you for signing up. We're excited to have you on board!",
      notificationType: "welcome",
      notifiableType: "user",
      notifiableId: userId,
      
      // Email options
      email: {
        to: "user@example.com",
        subject: "Welcome!",
        template: {
          id: "welcome",
          locale: "en",
          context: {
            userName: "John Doe",
            appName: "My App",
          },
        },
      },
      
      // Push notification options
      push: {
        title: "Welcome!",
        body: "Thank you for joining us!",
        data: {
          type: "welcome",
          userId: userId.toString(),
        },
      },
      defaultPushTokens: defaultDeviceToken,
      
      // Queue options
      queueOptions: {
        priority: 1, // High priority
        delay: 0, // Send immediately
      },
      
      // Persist notification in database
      persist: true,
    });

    logger.info("Queued notification dispatched", {
      userId,
      emailJobId: result.queued?.emailJobId,
      pushJobId: result.queued?.pushJobId,
      persisted: !!result.persisted,
    });

    return result;
  } catch (error) {
    logger.error("Failed to send queued notification", error);
    throw error;
  }
};

/**
 * Example 2: Direct email queuing
 */
export const sendQueuedEmail = async (userId: number, email: string) => {
  try {
    const result = await queuedMailer.sendWelcomeEmail(email, "John Doe", userId);
    
    logger.info("Welcome email queued", {
      userId,
      email,
      jobId: result.id,
      success: result.success,
    });

    return result;
  } catch (error) {
    logger.error("Failed to queue welcome email", error);
    throw error;
  }
};

/**
 * Example 3: Direct push notification queuing
 */
export const sendQueuedPush = async (userId: number, deviceTokens: string[]) => {
  try {
    const result = await queuedPushClient.sendWelcomePush(deviceTokens, userId);
    
    logger.info("Welcome push notification queued", {
      userId,
      tokenCount: deviceTokens.length,
      jobId: result.id,
      success: result.success,
    });

    return result;
  } catch (error) {
    logger.error("Failed to queue welcome push", error);
    throw error;
  }
};

/**
 * Example 4: Bulk notifications with queues
 */
export const sendBulkQueuedNotifications = async (userIds: number[]) => {
  try {
    const results = await notificationCenter.notifyManyQueued(userIds, {
      title: "Important Update",
      message: "We have an important update for all users. Please check it out!",
      notificationType: "bulk_update",
      
      // Email options
      email: {
        subject: "Important Update - Action Required",
        template: {
          id: "bulk_update",
          locale: "en",
          context: {
            updateType: "feature",
            actionRequired: true,
          },
        },
      },
      
      // Push options
      push: {
        title: "Important Update",
        body: "Please check your app for an important update!",
        data: {
          type: "bulk_update",
          priority: "high",
        },
      },
      
      // Queue options for bulk processing
      queueOptions: {
        priority: 5, // Lower priority for bulk
        delay: 1000, // Small delay to avoid overwhelming the system
      },
      
      persist: true,
    });

    logger.info("Bulk notifications queued", {
      userCount: userIds.length,
      results: results.map(r => ({
        emailJobId: r.queued?.emailJobId,
        pushJobId: r.queued?.pushJobId,
        persisted: !!r.persisted,
      })),
    });

    return results;
  } catch (error) {
    logger.error("Failed to send bulk queued notifications", error);
    throw error;
  }
};

/**
 * Example 5: Scheduled notifications (delayed)
 */
export const sendScheduledNotification = async (userId: number, delayMinutes: number) => {
  try {
    const delayMs = delayMinutes * 60 * 1000;
    
    const result = await notificationCenter.notifyUserQueued(userId, {
      title: "Reminder",
      message: "Don't forget to complete your profile!",
      notificationType: "reminder",
      notifiableType: "user",
      notifiableId: userId,
      
      email: {
        to: "user@example.com",
        subject: "Profile Completion Reminder",
      },
      
      push: {
        title: "Reminder",
        body: "Complete your profile to get started!",
        data: {
          type: "reminder",
          action: "complete_profile",
        },
      },
      defaultPushTokens: defaultDeviceToken,
      
      // Schedule for later
      queueOptions: {
        delay: delayMs,
        priority: 3,
      },
      
      persist: true,
    });

    logger.info("Scheduled notification queued", {
      userId,
      delayMinutes,
      emailJobId: result.queued?.emailJobId,
      pushJobId: result.queued?.pushJobId,
    });

    return result;
  } catch (error) {
    logger.error("Failed to schedule notification", error);
    throw error;
  }
};

/**
 * Example 6: Localized notifications with queues
 */
export const sendLocalizedQueuedNotification = async (userId: number, locale: string) => {
  try {
    const result = await notificationCenter.notifyUserQueued(userId, {
      title: "Welcome!",
      message: "Thank you for joining us!",
      defaultLocale: "en",
      targetLocale: locale,
      
      // Localized content
      localizedContent: {
        en: {
          title: "Welcome!",
          message: "Thank you for joining us!",
          email: {
            subject: "Welcome to our platform!",
            template: {
              id: "welcome",
              locale: "en",
              context: { userName: "User" },
            },
          },
          push: {
            title: "Welcome!",
            body: "Thank you for joining us!",
          },
        },
        es: {
          title: "¡Bienvenido!",
          message: "¡Gracias por unirte a nosotros!",
          email: {
            subject: "¡Bienvenido a nuestra plataforma!",
            template: {
              id: "welcome",
              locale: "es",
              context: { userName: "Usuario" },
            },
          },
          push: {
            title: "¡Bienvenido!",
            body: "¡Gracias por unirte a nosotros!",
          },
        },
        fr: {
          title: "Bienvenue!",
          message: "Merci de nous rejoindre!",
          email: {
            subject: "Bienvenue sur notre plateforme!",
            template: {
              id: "welcome",
              locale: "fr",
              context: { userName: "Utilisateur" },
            },
          },
          push: {
            title: "Bienvenue!",
            body: "Merci de nous rejoindre!",
          },
        },
      },
      
      notificationType: "welcome",
      notifiableType: "user",
      notifiableId: userId,
      
      email: {
        to: "user@example.com",
      },
      
      push: {
        data: { type: "welcome" },
      },
      defaultPushTokens: defaultDeviceToken,
      
      queueOptions: {
        priority: 1,
      },
      
      persist: true,
    });

    logger.info("Localized notification queued", {
      userId,
      locale,
      emailJobId: result.queued?.emailJobId,
      pushJobId: result.queued?.pushJobId,
    });

    return result;
  } catch (error) {
    logger.error("Failed to send localized queued notification", error);
    throw error;
  }
};
