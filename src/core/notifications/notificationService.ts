/**
 * Notification Service
 * 
 * This service handles sending notifications using the new i18n-key based format.
 * It integrates with the existing notificationCenter but stores notifications
 * with translation keys instead of resolved text.
 */

import { prisma } from "@/core/lib/prisma";
import { pushClient } from "@/core/lib/pushClient";
import { mailer } from "@/core/lib/mailer";
import { renderEmailTemplate } from "@/core/templates/email";
import { logger } from "@/core/utils/logger";
import { emailQueueService } from "@/core/services/emailQueue";
import { pushQueueService } from "@/core/services/pushQueue";
import { translate } from "./i18nHelper";
import type {
  NotificationData,
  SendNotificationOptions,
  SendNotificationResult,
} from "./types";

/**
 * Send a notification to a user
 * Stores notification with i18n keys and sends push/email in user's locale
 */
export async function sendNotification(
  options: SendNotificationOptions
): Promise<SendNotificationResult> {
  const result: SendNotificationResult = {
    errors: [],
  };

  try {
    // Fetch user information
    const user = await prisma.appUser.findUnique({
      where: { id: options.userId },
      select: {
        id: true,
        email: true,
        locale: true,
        deviceToken: true,
        notificationsEnabled: true,
      },
    });

    if (!user) {
      result.errors?.push(`User with ID ${options.userId} not found`);
      return result;
    }

    // Use provided locale or user's locale
    const targetLocale = options.locale || user.locale || "en";

    // Store notification in database with i18n keys
    const notification = await prisma.notification.create({
      data: {
        type: options.data.type,
        notifiableType: "user",
        notifiableId: BigInt(options.userId),
        data: JSON.stringify(options.data),
        readAt: options.markAsRead ? new Date() : null,
      },
    });

    result.notificationId = notification.id;

    // Translate messages for sending
    const translatedTitle = translate(
      options.data.title,
      targetLocale,
      options.data.variables
    );
    const translatedMessage = translate(
      options.data.message,
      targetLocale,
      options.data.variables
    );

    // Send push notification if enabled
    if (options.sendPush !== false && user.notificationsEnabled && user.deviceToken) {
      try {
        if (options.useQueue) {
          // Queue push notification
          const pushJob = await pushQueueService.addPushJob({
            payload: {
              tokens: user.deviceToken,
              title: translatedTitle,
              body: translatedMessage,
              data: {
                notificationId: notification.id,
                type: options.data.type,
                ...(options.data.actionUrl && { actionUrl: options.data.actionUrl }),
                ...(options.data.variables || {}),
              },
              ...(options.data.imageUrl && { imageUrl: options.data.imageUrl }),
            },
            metadata: {
              userId: user.id,
              notificationId: options.data.type,
              source: "notification_service",
            },
          });
          
          result.queuedJobs = {
            ...result.queuedJobs,
            pushJobId: String(pushJob.id),
          };
          result.pushSent = true;
        } else {
          // Send push notification immediately
          const pushResult = await pushClient.send({
            tokens: user.deviceToken,
            title: translatedTitle,
            body: translatedMessage,
            data: {
              notificationId: notification.id,
              type: options.data.type,
              ...(options.data.actionUrl && { actionUrl: options.data.actionUrl }),
              ...(options.data.variables || {}),
            },
            ...(options.data.imageUrl && { imageUrl: options.data.imageUrl }),
          });

          result.pushSent = pushResult.ok;
          
          if (!pushResult.ok) {
            result.errors?.push(pushResult.error ? String(pushResult.error) : "Push notification failed");
          }

          // Update notification with push result
          await prisma.notification.update({
            where: { id: notification.id },
            data: {
              data: JSON.stringify({
                ...options.data,
                channels: {
                  ...options.data.channels,
                  push: {
                    sent: pushResult.ok,
                    successCount: pushResult.successCount,
                    failureCount: pushResult.failureCount,
                    error: pushResult.error ? String(pushResult.error) : undefined,
                  },
                },
              }),
            },
          });
        }
      } catch (error) {
        logger.error("Failed to send push notification", error);
        result.errors?.push(`Push failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Send email notification if enabled
    if (options.sendEmail && mailer.isEnabled) {
      const emailTo = options.emailTo || user.email;
      
      try {
        const emailSubjectKey = options.data.metadata?.emailSubjectKey as string | undefined;
        const emailTemplateId = options.data.metadata?.emailTemplateId as string | undefined;
        
        const translatedSubject = emailSubjectKey
          ? translate(emailSubjectKey, targetLocale, options.data.variables)
          : translatedTitle;

        if (options.useQueue) {
          // Queue email
          const emailJob = await emailQueueService.addEmailJob({
            payload: {
              to: emailTo,
              subject: translatedSubject,
              text: translatedMessage,
            },
            template: emailTemplateId ? {
              id: emailTemplateId,
              locale: targetLocale,
              context: {
                ...options.data.variables,
                ...options.emailContext,
                title: translatedTitle,
                message: translatedMessage,
              },
            } : undefined,
            metadata: {
              userId: user.id,
              notificationId: options.data.type,
              source: "notification_service",
            },
          });
          
          result.queuedJobs = {
            ...result.queuedJobs,
            emailJobId: String(emailJob.id),
          };
          result.emailSent = true;
        } else {
          // Send email immediately
          let emailHtml: string | undefined;
          let emailText = translatedMessage;

          if (emailTemplateId) {
            const rendered = renderEmailTemplate({
              templateId: emailTemplateId,
              locale: targetLocale,
              context: {
                ...options.data.variables,
                ...options.emailContext,
                title: translatedTitle,
                message: translatedMessage,
              },
            });
            emailHtml = rendered.html;
            emailText = rendered.text || emailText;
          }

          const emailResult = await mailer.send({
            to: emailTo,
            subject: translatedSubject,
            text: emailText,
            html: emailHtml,
          });

          result.emailSent = true;

          // Update notification with email result
          await prisma.notification.update({
            where: { id: notification.id },
            data: {
              data: JSON.stringify({
                ...options.data,
                channels: {
                  ...options.data.channels,
                  email: {
                    sent: true,
                    messageId: (emailResult as any).messageId,
                  },
                },
              }),
            },
          });
        }
      } catch (error) {
        logger.error("Failed to send email notification", error);
        result.errors?.push(`Email failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return result;
  } catch (error) {
    logger.error("Failed to send notification", error);
    result.errors?.push(error instanceof Error ? error.message : String(error));
    return result;
  }
}

/**
 * Send a notification to multiple users
 */
export async function sendNotificationToMany(
  userIds: number[],
  notificationData: NotificationData,
  options?: Omit<SendNotificationOptions, "userId" | "data">
): Promise<SendNotificationResult[]> {
  return Promise.all(
    userIds.map((userId) =>
      sendNotification({
        userId,
        data: notificationData,
        ...options,
      })
    )
  );
}

/**
 * Get user notifications with optional filtering
 */
export async function getUserNotifications(
  userId: number,
  options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    type?: string;
  }
) {
  const where: any = {
    notifiableType: "user",
    notifiableId: BigInt(userId),
    deletedAt: null,
  };

  if (options?.unreadOnly) {
    where.readAt = null;
  }

  if (options?.type) {
    where.type = options.type;
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.limit,
    skip: options?.offset,
    select: {
      id: true,
      type: true,
      data: true,
      readAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return notifications.map((notification) => ({
    id: notification.id,
    type: notification.type,
    data: JSON.parse(notification.data) as NotificationData,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  }));
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: number) {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      notifiableType: "user",
      notifiableId: BigInt(userId),
      deletedAt: null,
    },
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });
}

/**
 * Mark all user notifications as read
 */
export async function markAllNotificationsAsRead(userId: number) {
  return prisma.notification.updateMany({
    where: {
      notifiableType: "user",
      notifiableId: BigInt(userId),
      readAt: null,
      deletedAt: null,
    },
    data: { readAt: new Date() },
  });
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string, userId: number) {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      notifiableType: "user",
      notifiableId: BigInt(userId),
      deletedAt: null,
    },
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { deletedAt: new Date() },
  });
}

