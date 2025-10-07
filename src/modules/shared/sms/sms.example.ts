/**
 * SMS Service Usage Examples
 * 
 * This file demonstrates how to use the SMS service in your application.
 * You can import and use these patterns in your controllers and services.
 */

import { queuedSmsClient } from "@/core/lib/queuedSmsClient";
import { smsQueueService } from "@/core/services/smsQueue";

/**
 * Example 1: Send Verification Code
 * Use this when a user signs up or needs to verify their phone number
 */
export async function sendVerificationCodeExample(phone: string, userId: number) {
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit code
  
  // Save code to database first
  // await saveVerificationCodeToDB(userId, code);
  
  // Send SMS
  const result = await queuedSmsClient.sendVerificationCode(phone, code, userId);
  
  if (result.success) {
    console.log(`Verification code sent to ${phone}, Job ID: ${result.id}`);
  } else {
    console.error(`Failed to send verification code: ${result.error}`);
  }
  
  return result;
}

/**
 * Example 2: Send Password Reset
 * Use this when a user requests a password reset via SMS
 */
export async function sendPasswordResetExample(phone: string, userId: number) {
  const resetCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // Save reset code to database
  // await savePasswordResetToken(userId, resetCode);
  
  // Send SMS with 30 minute expiry
  const result = await queuedSmsClient.sendPasswordResetSms(phone, resetCode, 30, userId);
  
  return result;
}

/**
 * Example 3: Send Welcome Message
 * Use this after successful user registration
 */
export async function sendWelcomeExample(phone: string, userName: string, userId: number) {
  const result = await queuedSmsClient.sendWelcomeSms(phone, userName, userId);
  return result;
}

/**
 * Example 4: Send Order Confirmation
 * Use this after an order is placed
 */
export async function sendOrderConfirmationExample(phone: string, orderId: string, userId: number) {
  const result = await queuedSmsClient.sendOrderConfirmationSms(phone, orderId, userId);
  return result;
}

/**
 * Example 5: Send Order Status Update
 * Use this when order status changes
 */
export async function sendOrderStatusUpdateExample(
  phone: string,
  orderId: string,
  status: string,
  userId: number
) {
  const result = await queuedSmsClient.sendOrderStatusSms(phone, orderId, status, userId);
  return result;
}

/**
 * Example 6: Send Custom SMS
 * Use this for any custom message
 */
export async function sendCustomSmsExample(phone: string, message: string, userId?: number) {
  const result = await queuedSmsClient.sendQueued(
    {
      to: phone,
      message: message,
    },
    {
      userId,
      notificationId: "custom",
      source: "app",
    }
  );
  
  return result;
}

/**
 * Example 7: Send Bulk SMS
 * Use this to send the same message to multiple users
 */
export async function sendBulkSmsExample(phones: string[], message: string) {
  const result = await queuedSmsClient.sendNotificationSms(phones, message);
  return result;
}

/**
 * Example 8: Send Delayed SMS (Schedule)
 * Use this to send SMS at a later time
 */
export async function sendDelayedSmsExample(phone: string, message: string, delayMs: number) {
  const result = await smsQueueService.addSmsJob(
    {
      payload: {
        to: phone,
        message: message,
      },
      metadata: {
        source: "scheduled",
      },
    },
    {
      delay: delayMs, // Delay in milliseconds
    }
  );
  
  return result;
}

/**
 * Example 9: Send High Priority SMS
 * Use this for urgent/important messages that should be processed first
 */
export async function sendPrioritySmsExample(phone: string, message: string, userId: number) {
  const result = await smsQueueService.addSmsJob(
    {
      payload: {
        to: phone,
        message: message,
      },
      metadata: {
        userId,
        notificationId: "urgent",
        source: "security",
      },
    },
    {
      priority: 1, // Lower number = higher priority
    }
  );
  
  return result;
}

/**
 * Example 10: Send Promotional SMS with Promo Code
 * Use this for marketing campaigns
 */
export async function sendPromotionalSmsExample(
  phones: string[],
  message: string,
  promoCode: string
) {
  const result = await queuedSmsClient.sendPromotionalSms(
    phones,
    message,
    promoCode
  );
  
  return result;
}

/**
 * Example 11: Integration in Express Route
 * 
 * Usage in your route file:
 */
export const exampleRouteHandler = async (req: any, res: any) => {
  try {
    const { phone, userId } = req.body;
    
    // Validate phone number
    if (!phone || !phone.match(/^\+\d{10,15}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid phone number. Use E.164 format (+1234567890)",
      });
    }
    
    // Send verification code
    const result = await sendVerificationCodeExample(phone, userId);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: "Verification code sent successfully",
        jobId: result.id,
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || "Failed to send SMS",
      });
    }
  } catch (error) {
    console.error("Error in SMS route:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

/**
 * Example 12: Get Queue Statistics
 * Use this to monitor your SMS queue
 */
export async function getQueueStatsExample() {
  const { queueWorker } = await import("@/core/services/queueWorker");
  const stats = await queueWorker.getStats();
  
  console.log("SMS Queue Statistics:");
  console.log("- Waiting:", stats.sms.waiting);
  console.log("- Active:", stats.sms.active);
  console.log("- Completed:", stats.sms.completed);
  console.log("- Failed:", stats.sms.failed);
  
  return stats.sms;
}

/**
 * Example 13: Check if SMS is Enabled
 * Use this to conditionally send SMS based on configuration
 */
export function checkSmsEnabledExample() {
  const isEnabled = queuedSmsClient.isEnabled;
  const provider = queuedSmsClient.provider;
  
  console.log(`SMS Service: ${isEnabled ? "Enabled" : "Disabled (Stub Mode)"}`);
  console.log(`Provider: ${provider}`);
  
  return { isEnabled, provider };
}

