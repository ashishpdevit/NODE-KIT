import type { MulticastMessage } from "firebase-admin/messaging";

import { getFirebaseMessaging, isFirebaseConfigured } from "@/core/lib/firebase";
import { logger } from "@/core/utils/logger";
import { pushQueueService, type PushJobData } from "@/core/services/pushQueue";

type PushTokens = string | string[];

type PushPayload = {
  tokens?: PushTokens;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  imageUrl?: string;
};

type PushDispatchResult = {
  ok: boolean;
  skipped?: boolean;
  successCount?: number;
  failureCount?: number;
  responses?: Array<{
    messageId?: string | null;
    error?: string;
  }>;
  error?: unknown;
};

export const queuedPushClient = {
  get isConfigured() {
    return isFirebaseConfigured();
  },

  /**
   * Send push notification immediately (synchronous)
   */
  async send(payload: PushPayload): Promise<PushDispatchResult> {
    // This method is kept for backward compatibility
    // In production, consider using sendQueued instead
    logger.warn("Using synchronous push send. Consider using sendQueued for better performance.");
    
    const { pushClient } = await import("./pushClient");
    return pushClient.send(payload);
  },

  /**
   * Queue a push notification for sending (asynchronous)
   */
  async sendQueued(payload: PushPayload, metadata?: PushJobData["metadata"]) {
    if (!this.isConfigured) {
      logger.debug("Push notifications not configured, skipping queue");
      return { id: "not_configured", success: false };
    }

    try {
      const pushJobData: PushJobData = {
        payload,
        metadata,
      };

      const job = await pushQueueService.addPushJob(pushJobData);
      
      logger.debug("Push notification queued for sending", {
        jobId: job.id,
        tokens: Array.isArray(payload.tokens) ? payload.tokens.length : 1,
        title: payload.title,
        userId: metadata?.userId,
      });

      return { id: job.id, success: true };
    } catch (error) {
      logger.error("Failed to queue push notification", error);
      return { id: "error", success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  /**
   * Queue a notification push
   */
  async sendNotificationPush(tokens: PushTokens, title: string, body: string, data?: Record<string, unknown>, userId?: number) {
    return this.sendQueued({
      tokens,
      title,
      body,
      data,
    }, {
      userId,
      notificationId: "notification",
      source: "notification_center",
    });
  },

  /**
   * Queue a welcome push notification
   */
  async sendWelcomePush(tokens: PushTokens, userId?: number) {
    return this.sendQueued({
      tokens,
      title: "Welcome!",
      body: "Thank you for joining us!",
      data: {
        type: "welcome",
        userId: userId?.toString(),
      },
    }, {
      userId,
      notificationId: "welcome",
      source: "auth",
    });
  },

  /**
   * Queue an order update push notification
   */
  async sendOrderUpdatePush(tokens: PushTokens, orderId: string, status: string, userId?: number) {
    return this.sendQueued({
      tokens,
      title: "Order Update",
      body: `Your order #${orderId} status has been updated to ${status}`,
      data: {
        type: "order_update",
        orderId,
        status,
        userId: userId?.toString(),
      },
    }, {
      userId,
      notificationId: "order_update",
      source: "orders",
    });
  },

  /**
   * Queue a promotional push notification
   */
  async sendPromotionalPush(tokens: PushTokens, title: string, body: string, promoData?: Record<string, unknown>, userId?: number) {
    return this.sendQueued({
      tokens,
      title,
      body,
      data: {
        type: "promotional",
        ...promoData,
        userId: userId?.toString(),
      },
    }, {
      userId,
      notificationId: "promotional",
      source: "marketing",
    });
  },
};

export type { PushPayload, PushDispatchResult };
