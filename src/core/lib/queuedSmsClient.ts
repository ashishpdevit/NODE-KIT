import { appConfig } from "@/core/config";
import { logger } from "@/core/utils/logger";
import { smsQueueService, type SmsJobData } from "@/core/services/smsQueue";
import type { SmsPayload, SmsDispatchResult } from "./smsClient";

export const queuedSmsClient = {
  get isEnabled() {
    const { smsClient } = require("./smsClient");
    return smsClient.isEnabled;
  },

  get provider() {
    const { smsClient } = require("./smsClient");
    return smsClient.provider;
  },

  /**
   * Send SMS immediately (synchronous)
   */
  async send(payload: SmsPayload): Promise<SmsDispatchResult> {
    // This method is kept for backward compatibility
    // In production, consider using sendQueued instead
    logger.warn("Using synchronous SMS send. Consider using sendQueued for better performance.");
    
    const { smsClient } = await import("./smsClient");
    return smsClient.send(payload);
  },

  /**
   * Queue an SMS for sending (asynchronous)
   */
  async sendQueued(payload: SmsPayload, metadata?: SmsJobData["metadata"]) {
    if (!this.isEnabled) {
      logger.debug("SMS sending is disabled (using stub mode), skipping queue");
      // Still queue it in stub mode for testing purposes
    }

    try {
      // Validate options
      if (!payload || !payload.to || !payload.message) {
        const error = "SMS payload is missing or invalid - 'to' and 'message' fields are required";
        logger.error("Invalid SMS payload", { payload, error });
        return { id: "error", success: false, error };
      }

      const smsJobData: SmsJobData = {
        payload,
        metadata,
      };

      logger.debug("Creating SMS job", {
        to: payload.to,
        messageLength: payload.message.length,
        userId: metadata?.userId,
      });

      const job = await smsQueueService.addSmsJob(smsJobData);
      
      logger.debug("SMS queued for sending", {
        jobId: job.id,
        to: payload.to,
        userId: metadata?.userId,
      });

      return { id: job.id, success: true };
    } catch (error) {
      logger.error("Failed to queue SMS", error);
      return { id: "error", success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  /**
   * Queue a verification code SMS
   */
  async sendVerificationCode(phone: string, code: string, userId?: number) {
    return this.sendQueued({
      to: phone,
      message: `Your ${appConfig.name} verification code is: ${code}. This code will expire in 10 minutes. Do not share this code with anyone.`,
    }, {
      userId,
      notificationId: "verification_code",
      source: "auth",
    });
  },

  /**
   * Queue a password reset SMS
   */
  async sendPasswordResetSms(phone: string, code: string, expiresInMinutes: number = 30, userId?: number) {
    return this.sendQueued({
      to: phone,
      message: `Your ${appConfig.name} password reset code is: ${code}. This code expires in ${expiresInMinutes} minutes. If you didn't request this, please ignore this message.`,
    }, {
      userId,
      notificationId: "password_reset",
      source: "auth",
    });
  },

  /**
   * Queue a welcome SMS
   */
  async sendWelcomeSms(phone: string, name?: string, userId?: number) {
    const greeting = name ? `Hi ${name}` : "Hello";
    return this.sendQueued({
      to: phone,
      message: `${greeting}! Welcome to ${appConfig.name}. Your account has been successfully created. We're excited to have you on board!`,
    }, {
      userId,
      notificationId: "welcome",
      source: "auth",
    });
  },

  /**
   * Queue an order confirmation SMS
   */
  async sendOrderConfirmationSms(phone: string, orderId: string, userId?: number) {
    return this.sendQueued({
      to: phone,
      message: `Thank you for your order! Your order #${orderId} has been confirmed. You'll receive updates as your order progresses.`,
    }, {
      userId,
      notificationId: "order_confirmation",
      source: "orders",
    });
  },

  /**
   * Queue an order status update SMS
   */
  async sendOrderStatusSms(phone: string, orderId: string, status: string, userId?: number) {
    return this.sendQueued({
      to: phone,
      message: `Order Update: Your order #${orderId} is now ${status}. Track your order in the ${appConfig.name} app.`,
    }, {
      userId,
      notificationId: "order_status_update",
      source: "orders",
    });
  },

  /**
   * Queue a delivery notification SMS
   */
  async sendDeliveryNotificationSms(phone: string, orderId: string, estimatedTime?: string, userId?: number) {
    const timeInfo = estimatedTime ? ` Estimated delivery: ${estimatedTime}.` : "";
    return this.sendQueued({
      to: phone,
      message: `Your order #${orderId} is out for delivery!${timeInfo} Please ensure someone is available to receive it.`,
    }, {
      userId,
      notificationId: "delivery_notification",
      source: "orders",
    });
  },

  /**
   * Queue a promotional SMS
   */
  async sendPromotionalSms(phone: string | string[], message: string, promoCode?: string, userId?: number) {
    const finalMessage = promoCode 
      ? `${message} Use code: ${promoCode}`
      : message;
    
    return this.sendQueued({
      to: phone,
      message: finalMessage,
    }, {
      userId,
      notificationId: "promotional",
      source: "marketing",
    });
  },

  /**
   * Queue a notification SMS
   */
  async sendNotificationSms(phone: string | string[], message: string, userId?: number) {
    return this.sendQueued({
      to: phone,
      message,
    }, {
      userId,
      notificationId: "notification",
      source: "notification_center",
    });
  },

  /**
   * Queue a custom SMS with full control
   */
  async sendCustomSms(phone: string | string[], message: string, from?: string, metadata?: SmsJobData["metadata"]) {
    return this.sendQueued({
      to: phone,
      message,
      from,
    }, metadata);
  },
};

export type { SmsPayload, SmsDispatchResult };

