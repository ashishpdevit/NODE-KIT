# SMS Service Usage Guide

This guide explains how to use the SMS service in your Node.js application. The SMS system follows the same architecture patterns as the email and push notification systems, providing both synchronous and queued sending capabilities.

## Table of Contents

1. [Overview](#overview)
2. [Supported Providers](#supported-providers)
3. [Configuration](#configuration)
4. [Basic Usage](#basic-usage)
5. [Queue-Based Sending (Recommended)](#queue-based-sending-recommended)
6. [Pre-Built SMS Templates](#pre-built-sms-templates)
7. [Advanced Usage](#advanced-usage)
8. [Testing & Development](#testing--development)
9. [Production Deployment](#production-deployment)
10. [Troubleshooting](#troubleshooting)

## Overview

The SMS service provides:
- **Multiple Provider Support**: Twilio, Vonage (Nexmo), and Stub mode
- **Queue System**: Asynchronous SMS sending with Bull queue
- **Retry Logic**: Automatic retries with exponential backoff
- **Pre-built Templates**: Common SMS scenarios (verification, password reset, orders, etc.)
- **Easy Configuration**: Environment variable based setup
- **Type Safety**: Full TypeScript support

## Supported Providers

### 1. Twilio
Most popular SMS provider with global coverage.

### 2. Vonage (Nexmo)
Reliable alternative with competitive pricing.

### 3. Stub Mode
For development and testing without sending real SMS messages.

## Configuration

### Step 1: Install Provider SDK (if needed)

For **Twilio**:
```bash
npm install twilio
```

For **Vonage**:
```bash
npm install @vonage/server-sdk
```

> Note: You only need to install the SDK for the provider you're using.

### Step 2: Configure Environment Variables

Add the following to your `.env` file:

#### Basic SMS Configuration
```env
# SMS Provider: twilio, vonage, or stub
SMS_PROVIDER=stub
SMS_FROM=+1234567890
```

#### For Twilio
```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

#### For Vonage (Nexmo)
```env
SMS_PROVIDER=vonage
VONAGE_API_KEY=your_api_key
VONAGE_API_SECRET=your_api_secret
VONAGE_FROM=YourBrand
```

#### SMS Queue Configuration (Optional)
```env
# Queue settings
SMS_QUEUE_CONCURRENCY=5
SMS_QUEUE_REMOVE_ON_COMPLETE=100
SMS_QUEUE_REMOVE_ON_FAIL=50
SMS_QUEUE_ATTEMPTS=3

# Redis configuration (required for production)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
# Or use Redis URL
REDIS_URL=redis://localhost:6379
```

## Basic Usage

### Import the SMS Client

```typescript
import { queuedSmsClient } from "@/core/lib/queuedSmsClient";
```

### Send a Simple SMS

```typescript
// Queue an SMS (recommended for production)
const result = await queuedSmsClient.sendQueued({
  to: "+1234567890",
  message: "Hello! This is a test message."
});

console.log("SMS queued:", result.success);
console.log("Job ID:", result.id);
```

### Send to Multiple Recipients

```typescript
await queuedSmsClient.sendQueued({
  to: ["+1234567890", "+0987654321"],
  message: "Bulk SMS message to multiple recipients."
});
```

### Send with Custom From Number

```typescript
await queuedSmsClient.sendQueued({
  to: "+1234567890",
  message: "SMS from custom number",
  from: "+1555123456"  // Optional: override default from number
});
```

## Queue-Based Sending (Recommended)

The queue-based approach is recommended for production as it provides:
- **Asynchronous processing**: Non-blocking operations
- **Automatic retries**: Failed SMS are retried automatically
- **Rate limiting**: Prevent hitting provider limits
- **Better performance**: Batch processing capabilities

### Queued Sending

```typescript
import { queuedSmsClient } from "@/core/lib/queuedSmsClient";

// Send with queue
const result = await queuedSmsClient.sendQueued(
  {
    to: "+1234567890",
    message: "Your verification code is 123456"
  },
  {
    // Optional metadata for tracking
    userId: 42,
    notificationId: "verification",
    source: "auth"
  }
);

if (result.success) {
  console.log("SMS queued successfully, Job ID:", result.id);
} else {
  console.error("Failed to queue SMS:", result.error);
}
```

### Synchronous Sending (Not Recommended)

```typescript
// Direct send (bypasses queue)
const result = await queuedSmsClient.send({
  to: "+1234567890",
  message: "Urgent message"
});

console.log("SMS sent:", result.ok);
console.log("Success count:", result.successCount);
```

## Pre-Built SMS Templates

The SMS service includes pre-built helper methods for common scenarios:

### 1. Verification Code

```typescript
await queuedSmsClient.sendVerificationCode(
  "+1234567890",
  "123456",
  userId
);
```

Sends:
> "Your YourApp verification code is: 123456. This code will expire in 10 minutes. Do not share this code with anyone."

### 2. Password Reset

```typescript
await queuedSmsClient.sendPasswordResetSms(
  "+1234567890",
  "RESET123",
  30,  // expires in 30 minutes
  userId
);
```

Sends:
> "Your YourApp password reset code is: RESET123. This code expires in 30 minutes. If you didn't request this, please ignore this message."

### 3. Welcome Message

```typescript
await queuedSmsClient.sendWelcomeSms(
  "+1234567890",
  "John",
  userId
);
```

Sends:
> "Hi John! Welcome to YourApp. Your account has been successfully created. We're excited to have you on board!"

### 4. Order Confirmation

```typescript
await queuedSmsClient.sendOrderConfirmationSms(
  "+1234567890",
  "ORD-12345",
  userId
);
```

Sends:
> "Thank you for your order! Your order #ORD-12345 has been confirmed. You'll receive updates as your order progresses."

### 5. Order Status Update

```typescript
await queuedSmsClient.sendOrderStatusSms(
  "+1234567890",
  "ORD-12345",
  "shipped",
  userId
);
```

Sends:
> "Order Update: Your order #ORD-12345 is now shipped. Track your order in the YourApp app."

### 6. Delivery Notification

```typescript
await queuedSmsClient.sendDeliveryNotificationSms(
  "+1234567890",
  "ORD-12345",
  "2-4 PM",
  userId
);
```

Sends:
> "Your order #ORD-12345 is out for delivery! Estimated delivery: 2-4 PM. Please ensure someone is available to receive it."

### 7. Promotional SMS

```typescript
await queuedSmsClient.sendPromotionalSms(
  "+1234567890",
  "🎉 Get 20% off your next purchase!",
  "SAVE20",
  userId
);
```

Sends:
> "🎉 Get 20% off your next purchase! Use code: SAVE20"

### 8. Generic Notification

```typescript
await queuedSmsClient.sendNotificationSms(
  "+1234567890",
  "Your appointment is confirmed for tomorrow at 3 PM.",
  userId
);
```

## Advanced Usage

### Custom SMS with Full Control

```typescript
await queuedSmsClient.sendCustomSms(
  "+1234567890",
  "Custom message with full control",
  "+1555123456",  // Custom from number
  {
    userId: 42,
    notificationId: "custom",
    source: "custom_module",
    userType: "premium"
  }
);
```

### Bulk SMS to Multiple Recipients

```typescript
const recipients = ["+1234567890", "+0987654321", "+1111222333"];

await queuedSmsClient.sendNotificationSms(
  recipients,
  "Important announcement for all users!",
  undefined  // No specific userId for bulk
);
```

### Delayed SMS (Send Later)

```typescript
import { smsQueueService } from "@/core/services/smsQueue";

// Send SMS after 1 hour (3600000 milliseconds)
await smsQueueService.addSmsJob(
  {
    payload: {
      to: "+1234567890",
      message: "This is a delayed message"
    },
    metadata: {
      userId: 42,
      source: "scheduled"
    }
  },
  {
    delay: 3600000  // 1 hour in milliseconds
  }
);
```

### Priority SMS

```typescript
// High priority SMS (processed first)
await smsQueueService.addSmsJob(
  {
    payload: {
      to: "+1234567890",
      message: "Urgent: Account security alert!"
    }
  },
  {
    priority: 1  // Higher priority (lower number = higher priority)
  }
);
```

### Integration in Your Services/Controllers

```typescript
// In your auth service
export class AuthService {
  async sendVerificationCode(phone: string, userId: number) {
    const code = this.generateCode();
    
    // Save code to database
    await this.saveVerificationCode(userId, code);
    
    // Send SMS
    await queuedSmsClient.sendVerificationCode(phone, code, userId);
    
    return { success: true };
  }
}
```

```typescript
// In your order service
export class OrderService {
  async confirmOrder(orderId: string, userId: number) {
    const order = await this.getOrder(orderId);
    const user = await this.getUser(userId);
    
    // Send confirmation SMS
    if (user.phone) {
      await queuedSmsClient.sendOrderConfirmationSms(
        user.phone,
        orderId,
        userId
      );
    }
    
    return order;
  }
}
```

## Testing & Development

### Stub Mode (Default)

In development, the service uses "stub" mode by default, which:
- Logs SMS to console instead of sending
- Doesn't require provider credentials
- Returns success responses for testing

```env
SMS_PROVIDER=stub
```

Output in console:
```
📱 SMS STUB MODE
════════════════════════════════════════
To: +1234567890
From: default
Message: Your verification code is 123456
════════════════════════════════════════
```

### Writing Tests

```typescript
import { queuedSmsClient } from "@/core/lib/queuedSmsClient";

describe("SMS Service", () => {
  it("should queue verification code SMS", async () => {
    const result = await queuedSmsClient.sendVerificationCode(
      "+1234567890",
      "123456",
      42
    );
    
    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
  });
  
  it("should handle invalid phone numbers", async () => {
    const result = await queuedSmsClient.sendQueued({
      to: "",  // Invalid
      message: "Test"
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

## Production Deployment

### Checklist

1. **Install Provider SDK**
   ```bash
   npm install twilio
   # or
   npm install @vonage/server-sdk
   ```

2. **Set Environment Variables**
   - Set `SMS_PROVIDER` to `twilio` or `vonage`
   - Configure provider credentials
   - Set up Redis for queue system

3. **Configure Redis**
   ```env
   REDIS_URL=redis://your-redis-server:6379
   ```

4. **Monitor Queue**
   - Check queue statistics regularly
   - Set up alerts for failed jobs

5. **Rate Limiting**
   - Adjust `SMS_QUEUE_CONCURRENCY` based on provider limits
   - Twilio: ~100 messages/second
   - Vonage: ~40 messages/second

### Get Queue Statistics

```typescript
import { queueWorker } from "@/core/services/queueWorker";

const stats = await queueWorker.getStats();
console.log("SMS Queue:", stats.sms);
// Output: { waiting: 5, active: 2, completed: 120, failed: 3 }
```

### Clear Queue (if needed)

```typescript
import { smsQueueService } from "@/core/services/smsQueue";

await smsQueueService.clear();
```

## Troubleshooting

### SMS Not Sending

1. **Check provider configuration**
   ```typescript
   import { smsClient } from "@/core/lib/smsClient";
   console.log("Provider:", smsClient.provider);
   console.log("Enabled:", smsClient.isEnabled);
   ```

2. **Check queue stats**
   ```typescript
   import { smsQueueService } from "@/core/services/smsQueue";
   const stats = await smsQueueService.getStats();
   console.log("Failed jobs:", stats.failed);
   ```

3. **Check logs**
   ```bash
   # Look for SMS-related errors
   grep "SMS" logs/app.log
   ```

### Phone Number Format Issues

- Always use E.164 format: `+[country code][number]`
- Example: `+14155552671` (US), `+442071234567` (UK)
- The service auto-normalizes numbers, but explicit formatting is recommended

### Provider Errors

**Twilio Error Codes**: https://www.twilio.com/docs/api/errors

**Vonage Error Codes**: https://developer.vonage.com/messaging/sms/guides/troubleshooting-sms

### Redis Connection Issues

```env
# Ensure Redis is running
redis-cli ping
# Should return: PONG

# Check Redis configuration
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Best Practices

1. **Always use queue-based sending** in production
2. **Validate phone numbers** before sending
3. **Keep messages concise** (160 characters = 1 SMS segment)
4. **Include opt-out instructions** for marketing messages
5. **Rate limit** user-triggered SMS to prevent abuse
6. **Monitor costs** - SMS can be expensive at scale
7. **Use templates** for consistency
8. **Test thoroughly** in stub mode before production
9. **Handle failures gracefully** - don't block user flows on SMS
10. **Comply with regulations** (TCPA, GDPR, etc.)

## Cost Optimization

1. **Use SMS only when necessary** - consider push notifications or email as alternatives
2. **Batch messages** when possible
3. **Optimize message length** - keep under 160 characters to avoid multi-part SMS
4. **Use local numbers** where possible (cheaper rates)
5. **Implement user preferences** - let users opt-out of non-critical SMS

## Support

- Check logs: `@/core/utils/logger`
- Queue statistics: `queueWorker.getStats()`
- Provider documentation:
  - Twilio: https://www.twilio.com/docs/sms
  - Vonage: https://developer.vonage.com/messaging/sms/overview

---

**Need help?** Check the queue system documentation: [QUEUE_SYSTEM.md](./QUEUE_SYSTEM.md)

