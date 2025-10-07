# Notification System Documentation

## Overview

The notification system has been redesigned to store notifications with **i18n keys** instead of resolved/translated text. This allows notifications to be translated dynamically based on the user's current locale, supporting multi-language applications more effectively.

## Key Features

- ✅ **i18n Key-Based Storage**: Notifications are stored with translation keys, not actual text
- ✅ **Dynamic Translation**: Notifications are translated on-the-fly based on user locale when sent
- ✅ **Individual Notification Types**: Each notification type has its own file for easy management
- ✅ **Type Safety**: Full TypeScript support with proper type definitions
- ✅ **Queue Support**: Async delivery via Bull queues for better performance
- ✅ **Multi-Channel**: Support for push notifications and email
- ✅ **Variable Interpolation**: Dynamic values can be injected into notification messages

## Notification Data Format

Notifications are stored in the database with the following format:

```json
{
  "type": "shipment_requested",
  "title": "messages.push_notification.shipment.new_request.title",
  "message": "messages.push_notification.shipment.new_request.message",
  "variables": {
    "id": 795,
    "trackingNumber": "TRK123456"
  },
  "metadata": {},
  "actionUrl": "/shipments/795",
  "imageUrl": "https://...",
  "channels": {
    "email": {
      "sent": true,
      "messageId": "abc123"
    },
    "push": {
      "sent": true,
      "successCount": 1,
      "failureCount": 0
    }
  }
}
```

### Key Fields

- **type**: Unique identifier for the notification type (e.g., `"shipment_requested"`, `"order_placed"`)
- **title**: i18n key for the notification title (e.g., `"messages.push_notification.shipment.new_request.title"`)
- **message**: i18n key for the notification message
- **variables**: Object containing dynamic values to be interpolated (e.g., `{"id": 795}`)
- **metadata**: Additional data that doesn't need translation
- **actionUrl**: Deep link or URL for the notification action
- **imageUrl**: Optional image for rich notifications
- **channels**: Delivery status for each channel

## Directory Structure

```
src/core/notifications/
├── index.ts                    # Main export file
├── types.ts                    # TypeScript type definitions
├── base.ts                     # Base notification class
├── notificationService.ts      # Main service for sending notifications
├── i18nHelper.ts              # Translation helper functions
└── types/
    ├── index.ts               # Export all notification types
    ├── shipment.ts            # Shipment-related notifications
    ├── order.ts               # Order-related notifications
    ├── auth.ts                # Authentication notifications
    └── system.ts              # System announcements and updates
```

## Creating a New Notification Type

### Method 1: Using the Base Class

```typescript
// src/core/notifications/types/payment.ts
import { BaseNotification } from "../base";
import type { NotificationData } from "../types";

export class PaymentSuccessNotification extends BaseNotification {
  readonly type = "payment_success";
  readonly titleKey = "messages.push_notification.payment.success.title";
  readonly messageKey = "messages.push_notification.payment.success.message";
  readonly emailSubjectKey = "messages.email.payment.success.subject";
  readonly emailTemplateId = "payment-success";

  build(variables: { amount: number; orderId: string }): NotificationData {
    return {
      ...super.build(variables),
      actionUrl: `/orders/${variables.orderId}`,
      metadata: {
        amount: variables.amount,
      },
    };
  }
}

export const paymentNotifications = {
  success: new PaymentSuccessNotification(),
};
```

### Method 2: Using the Helper Function

```typescript
import { createNotification } from "../base";

export const simpleNotification = createNotification({
  type: "simple_alert",
  titleKey: "messages.push_notification.simple.title",
  messageKey: "messages.push_notification.simple.message",
});
```

## Usage Examples

### Basic Usage

```typescript
import { sendNotification, shipmentNotifications } from "@/core/notifications";

// Send a shipment requested notification
const result = await sendNotification({
  userId: 123,
  data: shipmentNotifications.requested.build({ 
    id: 795,
    trackingNumber: "TRK123456"
  }),
  sendPush: true,
  sendEmail: true,
});

console.log(`Notification ID: ${result.notificationId}`);
console.log(`Push sent: ${result.pushSent}`);
console.log(`Email sent: ${result.emailSent}`);
```

### With Queue (Async)

```typescript
import { sendNotification, orderNotifications } from "@/core/notifications";

const result = await sendNotification({
  userId: 456,
  data: orderNotifications.placed.build({ 
    orderId: "ORD-12345",
    total: 99.99
  }),
  sendPush: true,
  sendEmail: true,
  useQueue: true, // Send via queue for better performance
});

console.log(`Queued jobs:`, result.queuedJobs);
```

### Send to Multiple Users

```typescript
import { sendNotificationToMany, systemNotifications } from "@/core/notifications";

const userIds = [123, 456, 789];

const results = await sendNotificationToMany(
  userIds,
  systemNotifications.maintenance.build({
    startTime: "2024-01-15 02:00 AM",
    duration: "2 hours"
  }),
  {
    sendPush: true,
    useQueue: true,
  }
);

console.log(`Sent to ${results.length} users`);
```

### Custom Locale

```typescript
import { sendNotification, authNotifications } from "@/core/notifications";

// Send in Arabic regardless of user's stored locale
await sendNotification({
  userId: 123,
  data: authNotifications.welcome.build({ userName: "أحمد" }),
  locale: "ar", // Override locale
  sendPush: true,
});
```

### Mark as Read Immediately

```typescript
import { sendNotification, orderNotifications } from "@/core/notifications";

// Send notification but mark as read (silent notification)
await sendNotification({
  userId: 123,
  data: orderNotifications.confirmed.build({ orderId: "ORD-999" }),
  sendPush: true,
  markAsRead: true, // Store as already read
});
```

## Fetching User Notifications

### Get User's Notifications

```typescript
import { getUserNotifications } from "@/core/notifications";

// Get all notifications
const notifications = await getUserNotifications(userId);

// Get unread only
const unreadNotifications = await getUserNotifications(userId, {
  unreadOnly: true,
});

// Get with pagination
const paginatedNotifications = await getUserNotifications(userId, {
  limit: 20,
  offset: 0,
});

// Filter by type
const shipmentNotifications = await getUserNotifications(userId, {
  type: "shipment_requested",
});
```

### Response Format

```typescript
[
  {
    id: "uuid-1234",
    type: "shipment_requested",
    data: {
      type: "shipment_requested",
      title: "messages.push_notification.shipment.new_request.title",
      message: "messages.push_notification.shipment.new_request.message",
      variables: { id: 795 }
    },
    readAt: null,
    createdAt: "2024-01-10T10:00:00Z",
    updatedAt: "2024-01-10T10:00:00Z"
  }
]
```

### Translating Notifications on the Client

When fetching notifications, you need to translate them on the client side:

```typescript
import { getUserNotifications } from "@/core/notifications";
import { translate } from "@/core/notifications/i18nHelper";

const notifications = await getUserNotifications(userId);

const translatedNotifications = notifications.map(notification => ({
  ...notification,
  translatedTitle: translate(
    notification.data.title,
    userLocale, // Current user locale
    notification.data.variables
  ),
  translatedMessage: translate(
    notification.data.message,
    userLocale,
    notification.data.variables
  ),
}));
```

## Managing Notifications

### Mark as Read

```typescript
import { markNotificationAsRead } from "@/core/notifications";

await markNotificationAsRead(notificationId, userId);
```

### Mark All as Read

```typescript
import { markAllNotificationsAsRead } from "@/core/notifications";

await markAllNotificationsAsRead(userId);
```

### Delete Notification

```typescript
import { deleteNotification } from "@/core/notifications";

await deleteNotification(notificationId, userId);
```

## Translation System

### Default Translations

The system includes a built-in translation helper with default English and Arabic translations. You can extend this:

```typescript
import { addTranslations } from "@/core/notifications/i18nHelper";

// Add French translations
addTranslations("fr", {
  "messages.push_notification.shipment.new_request.title": "Nouvelle demande d'expédition",
  "messages.push_notification.shipment.new_request.message": "L'expédition #{{id}} a été demandée",
});
```

### Custom Translation Function

For advanced use cases, you can register a custom translation function:

```typescript
import { registerTranslationFunction } from "@/core/notifications/i18nHelper";
import i18next from "i18next"; // or your i18n library

registerTranslationFunction("en", (key, variables) => {
  return i18next.t(key, variables);
});

registerTranslationFunction("ar", (key, variables) => {
  return i18next.t(key, { ...variables, lng: "ar" });
});
```

### Variable Interpolation

Variables are interpolated using `{{variableName}}` syntax:

**Translation Key:**
```
"messages.push_notification.shipment.new_request.message": "Shipment #{{id}} with tracking {{trackingNumber}} has been requested"
```

**Variables:**
```typescript
{ id: 795, trackingNumber: "TRK123456" }
```

**Result:**
```
"Shipment #795 with tracking TRK123456 has been requested"
```

## Available Notification Types

### Shipment Notifications

```typescript
import { shipmentNotifications } from "@/core/notifications/types";

// shipmentNotifications.requested
// shipmentNotifications.statusUpdated
// shipmentNotifications.delivered
// shipmentNotifications.cancelled
```

### Order Notifications

```typescript
import { orderNotifications } from "@/core/notifications/types";

// orderNotifications.placed
// orderNotifications.confirmed
// orderNotifications.shipped
// orderNotifications.delivered
// orderNotifications.cancelled
// orderNotifications.paymentReceived
```

### Auth Notifications

```typescript
import { authNotifications } from "@/core/notifications/types";

// authNotifications.welcome
// authNotifications.passwordResetRequest
// authNotifications.passwordChanged
// authNotifications.newDeviceLogin
// authNotifications.accountStatusChanged
```

### System Notifications

```typescript
import { systemNotifications } from "@/core/notifications/types";

// systemNotifications.maintenance
// systemNotifications.appUpdate
// systemNotifications.announcement
```

## Integration with Existing Code

The new system is designed to coexist with the existing `notificationCenter` service. You can gradually migrate to the new system:

### Old Way (Still Supported)

```typescript
import { notificationCenter } from "@/core/services/notificationCenter";

await notificationCenter.notifyUser(userId, {
  title: "Order Placed",
  message: "Your order has been placed",
  // ... other options
});
```

### New Way (Recommended)

```typescript
import { sendNotification, orderNotifications } from "@/core/notifications";

await sendNotification({
  userId,
  data: orderNotifications.placed.build({ orderId: "123" }),
  sendPush: true,
  sendEmail: true,
});
```

## Best Practices

1. **Always use notification type builders** - Don't manually create notification data
2. **Provide all required variables** - Ensure all variables referenced in translation keys are provided
3. **Use queues for bulk notifications** - Set `useQueue: true` when sending to many users
4. **Keep variable names consistent** - Use the same variable names across different locales
5. **Test translations** - Ensure all translation keys exist for all supported locales
6. **Use actionUrl for deep linking** - Provide navigation targets for notifications
7. **Store minimal data in variables** - Only include data needed for translation and display

## Migration Guide

To migrate existing notification code:

1. **Identify the notification type** - Determine what category it falls under
2. **Create or use existing notification type** - Use predefined types or create new ones
3. **Replace manual creation with builders** - Use `.build()` method with variables
4. **Update notification fetching** - Use new service methods
5. **Add translation keys** - Ensure i18n keys exist in your translation files

### Example Migration

**Before:**
```typescript
await notificationCenter.notifyUser(userId, {
  title: "Order Placed",
  message: `Your order #${orderId} has been placed`,
  notificationType: "order",
  push: { tokens: deviceToken },
});
```

**After:**
```typescript
import { sendNotification, orderNotifications } from "@/core/notifications";

await sendNotification({
  userId,
  data: orderNotifications.placed.build({ orderId }),
  sendPush: true,
});
```

## API Reference

### `sendNotification(options)`

Send a notification to a user.

**Parameters:**
- `userId` (number): User ID to send to
- `data` (NotificationData): Notification data from builder
- `locale?` (string): Override user's locale
- `sendPush?` (boolean): Send push notification (default: false)
- `sendEmail?` (boolean): Send email notification (default: false)
- `emailTo?` (string): Override email address
- `markAsRead?` (boolean): Mark as read immediately (default: false)
- `useQueue?` (boolean): Use async queue (default: false)
- `emailContext?` (object): Additional email template context

**Returns:** `Promise<SendNotificationResult>`

### `sendNotificationToMany(userIds, data, options)`

Send the same notification to multiple users.

**Parameters:**
- `userIds` (number[]): Array of user IDs
- `data` (NotificationData): Notification data
- `options?` (object): Same as sendNotification options (excluding userId and data)

**Returns:** `Promise<SendNotificationResult[]>`

### `getUserNotifications(userId, options)`

Fetch user's notifications.

**Parameters:**
- `userId` (number): User ID
- `options?` (object):
  - `limit?` (number): Max results
  - `offset?` (number): Pagination offset
  - `unreadOnly?` (boolean): Only unread notifications
  - `type?` (string): Filter by notification type

**Returns:** `Promise<Notification[]>`

### `markNotificationAsRead(notificationId, userId)`

Mark a notification as read.

**Returns:** `Promise<Notification>`

### `markAllNotificationsAsRead(userId)`

Mark all user's notifications as read.

**Returns:** `Promise<{ count: number }>`

### `deleteNotification(notificationId, userId)`

Soft delete a notification.

**Returns:** `Promise<Notification>`

## Troubleshooting

### Notifications not translating

- Ensure translation keys exist in `i18nHelper.ts`
- Check that variables are provided with correct names
- Verify locale is valid and supported

### Push notifications not sending

- Check user has `deviceToken` set
- Verify user has `notificationsEnabled: true`
- Check push service configuration

### Email not sending

- Ensure mailer is configured and enabled
- Check email address is valid
- Verify email template exists if using templates

## Future Enhancements

- [ ] Admin UI for managing notification templates
- [ ] Notification preferences per user
- [ ] Notification scheduling
- [ ] Rich media support (images, videos)
- [ ] In-app notification center widget
- [ ] Notification analytics and tracking

