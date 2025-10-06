# Queue System for Email and Push Notifications

This document explains how to use the queue system for email and push notifications in the Node Starter Kit.

## Overview

The queue system provides asynchronous processing for email and push notifications, improving API response times and providing better reliability through retry mechanisms.

## Features

- **Asynchronous Processing**: Emails and push notifications are processed in the background
- **Retry Logic**: Failed jobs are automatically retried with exponential backoff
- **Redis Support**: Uses Redis for production queue storage with Bull
- **In-Memory Fallback**: Uses in-memory queues for development/testing
- **Priority Support**: Jobs can be assigned different priority levels
- **Delayed Jobs**: Support for scheduling jobs to run in the future
- **Monitoring**: Queue statistics and health check endpoints

## Configuration

### Environment Variables

```bash
# Redis Configuration (optional - falls back to in-memory if not set)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0

# Queue Concurrency Settings
EMAIL_QUEUE_CONCURRENCY=5
PUSH_QUEUE_CONCURRENCY=10

# Queue Retention Settings
EMAIL_QUEUE_REMOVE_ON_COMPLETE=100
EMAIL_QUEUE_REMOVE_ON_FAIL=50
PUSH_QUEUE_REMOVE_ON_COMPLETE=100
PUSH_QUEUE_REMOVE_ON_FAIL=50

# Retry Settings
EMAIL_QUEUE_ATTEMPTS=3
PUSH_QUEUE_ATTEMPTS=3
```

## Usage Examples

### 1. Using NotificationCenter with Queues

```typescript
import { notificationCenter } from "@/core/services/notificationCenter";

// Queue a notification
const result = await notificationCenter.notifyUserQueued(userId, {
  title: "Welcome!",
  message: "Thank you for signing up!",
  notificationType: "welcome",
  
  // Email options
  email: {
    to: "user@example.com",
    subject: "Welcome to our app!",
    template: {
      id: "welcome",
      locale: "en",
      context: { userName: "John" },
    },
  },
  
  // Push notification options
  push: {
    title: "Welcome!",
    body: "Thank you for joining us!",
    data: { type: "welcome" },
  },
  defaultPushTokens: ["device_token_1", "device_token_2"],
  
  // Queue options
  queueOptions: {
    priority: 1, // High priority
    delay: 0, // Send immediately
  },
  
  persist: true, // Save to database
});

console.log("Email Job ID:", result.queued?.emailJobId);
console.log("Push Job ID:", result.queued?.pushJobId);
```

### 2. Direct Email Queuing

```typescript
import { queuedMailer } from "@/core/lib/queuedMailer";

// Queue a welcome email
const result = await queuedMailer.sendWelcomeEmail(
  "user@example.com",
  "John Doe",
  123
);

// Queue a password reset email
const result = await queuedMailer.sendPasswordResetEmail(
  "user@example.com",
  "reset_token_123",
  new Date(Date.now() + 3600000), // 1 hour from now
  123
);

// Queue a custom email
const result = await queuedMailer.sendQueued({
  to: "user@example.com",
  subject: "Custom Subject",
  text: "Plain text content",
  html: "<p>HTML content</p>",
}, {
  id: "custom_template",
  locale: "en",
  context: { customData: "value" },
}, {
  userId: 123,
  notificationId: "custom",
  source: "custom_module",
});
```

### 3. Direct Push Notification Queuing

```typescript
import { queuedPushClient } from "@/core/lib/queuedPushClient";

// Queue a welcome push notification
const result = await queuedPushClient.sendWelcomePush(
  ["device_token_1", "device_token_2"],
  123
);

// Queue an order update notification
const result = await queuedPushClient.sendOrderUpdatePush(
  ["device_token_1"],
  "order_123",
  "shipped",
  123
);

// Queue a custom push notification
const result = await queuedPushClient.sendQueued({
  tokens: ["device_token_1", "device_token_2"],
  title: "Custom Title",
  body: "Custom message",
  data: {
    type: "custom",
    action: "view_details",
  },
}, {
  userId: 123,
  notificationId: "custom",
  source: "custom_module",
});
```

### 4. Bulk Notifications

```typescript
import { notificationCenter } from "@/core/services/notificationCenter";

// Queue notifications for multiple users
const userIds = [1, 2, 3, 4, 5];
const results = await notificationCenter.notifyManyQueued(userIds, {
  title: "Important Update",
  message: "We have an important update for all users!",
  notificationType: "bulk_update",
  
  email: {
    subject: "Important Update - Action Required",
    template: {
      id: "bulk_update",
      locale: "en",
    },
  },
  
  push: {
    title: "Important Update",
    body: "Please check your app!",
    data: { type: "bulk_update" },
  },
  
  queueOptions: {
    priority: 5, // Lower priority for bulk
    delay: 1000, // Small delay between jobs
  },
  
  persist: true,
});
```

### 5. Scheduled/Delayed Notifications

```typescript
import { notificationCenter } from "@/core/services/notificationCenter";

// Schedule a notification for 1 hour from now
const delayMs = 60 * 60 * 1000; // 1 hour

const result = await notificationCenter.notifyUserQueued(userId, {
  title: "Reminder",
  message: "Don't forget to complete your profile!",
  notificationType: "reminder",
  
  email: {
    to: "user@example.com",
    subject: "Profile Completion Reminder",
  },
  
  push: {
    title: "Reminder",
    body: "Complete your profile!",
    data: { action: "complete_profile" },
  },
  defaultPushTokens: "device_token",
  
  queueOptions: {
    delay: delayMs,
    priority: 3,
  },
  
  persist: true,
});
```

### 6. Localized Notifications

```typescript
import { notificationCenter } from "@/core/services/notificationCenter";

// Send localized notifications
const result = await notificationCenter.notifyUserQueued(userId, {
  title: "Welcome!",
  message: "Thank you for joining us!",
  defaultLocale: "en",
  targetLocale: "es", // Will use Spanish content
  
  localizedContent: {
    en: {
      title: "Welcome!",
      message: "Thank you for joining us!",
      email: {
        subject: "Welcome to our platform!",
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
      },
      push: {
        title: "¡Bienvenido!",
        body: "¡Gracias por unirte a nosotros!",
      },
    },
  },
  
  notificationType: "welcome",
  persist: true,
});
```

## Monitoring

### Health Check Endpoint

Check queue status at `/api/health/queues`:

```bash
curl http://localhost:3000/api/health/queues
```

Response:
```json
{
  "success": true,
  "message": "Queue status retrieved",
  "data": {
    "queues": {
      "email": {
        "waiting": 5,
        "active": 2,
        "completed": 150,
        "failed": 3
      },
      "push": {
        "waiting": 10,
        "active": 5,
        "completed": 300,
        "failed": 8
      }
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Queue Statistics

```typescript
import { queueWorker } from "@/core/services/queueWorker";

// Get queue statistics
const stats = await queueWorker.getStats();
console.log("Email Queue:", stats.email);
console.log("Push Queue:", stats.push);
```

## Migration from Synchronous to Queued

### Before (Synchronous)
```typescript
// Old way - synchronous
await mailer.send({
  to: "user@example.com",
  subject: "Welcome!",
  text: "Welcome to our app!",
});
```

### After (Queued)
```typescript
// New way - queued
await queuedMailer.sendQueued({
  to: "user@example.com",
  subject: "Welcome!",
  text: "Welcome to our app!",
});
```

### Using NotificationCenter
```typescript
// Old way - synchronous
await notificationCenter.notifyUser(userId, {
  title: "Welcome!",
  message: "Thank you for joining!",
  email: { to: "user@example.com" },
  push: { tokens: ["device_token"] },
});

// New way - queued
await notificationCenter.notifyUserQueued(userId, {
  title: "Welcome!",
  message: "Thank you for joining!",
  email: { to: "user@example.com" },
  push: { tokens: ["device_token"] },
});
```

## Benefits

1. **Faster API Responses**: Notifications are queued and processed asynchronously
2. **Better Reliability**: Failed jobs are retried automatically
3. **Scalability**: Multiple workers can process jobs concurrently
4. **Monitoring**: Queue statistics and health checks
5. **Flexibility**: Priority levels, delays, and bulk operations
6. **Backward Compatibility**: Original synchronous methods still work

## Production Considerations

1. **Redis Setup**: Use Redis in production for better performance and persistence
2. **Monitoring**: Monitor queue health and failed jobs
3. **Scaling**: Increase concurrency based on your needs
4. **Error Handling**: Implement proper error handling for failed jobs
5. **Cleanup**: Configure appropriate job retention policies

## Troubleshooting

### Common Issues

1. **Jobs not processing**: Check if queue workers are initialized
2. **Redis connection errors**: Verify Redis configuration
3. **High memory usage**: Check job retention settings
4. **Failed jobs**: Review error logs and retry logic

### Debug Logging

Enable debug logging to see queue operations:

```bash
LOG_LEVEL=debug npm run dev
```

This will show detailed logs of job queuing, processing, and completion.
