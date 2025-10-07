# Quick Start Guide: Using the New Notification System

## TL;DR

**Old way:**
```typescript
await notificationCenter.notifyUser(userId, {
  title: "Order Placed",
  message: "Your order #123 has been placed",
});
```

**New way:**
```typescript
import { sendNotification, orderNotifications } from "@/core/notifications";

await sendNotification({
  userId,
  data: orderNotifications.placed.build({ orderId: "123" }),
  sendPush: true,
  sendEmail: true,
});
```

## Why the New System?

### Problem with Old System
- ❌ Notifications stored with **resolved text** in user's locale at send time
- ❌ If user changes language, old notifications stay in old language
- ❌ Can't re-translate existing notifications
- ❌ Hard to maintain translations

### Solution: New System
- ✅ Notifications stored with **i18n keys** and variables
- ✅ Translated **on-the-fly** based on user's current locale
- ✅ User changes language → all notifications automatically in new language
- ✅ Easy to add new languages

## Database Storage Format

### What Gets Stored

```json
{
  "type": "shipment_requested",
  "title": "messages.push_notification.shipment.new_request.title",
  "message": "messages.push_notification.shipment.new_request.message",
  "variables": {"id": 795},
  "actionUrl": "/shipments/795"
}
```

**Key Points:**
- `title` and `message` are **i18n keys**, not actual text
- `variables` contains dynamic values (like IDs, names, amounts)
- When **sending** (push/email), it translates to user's locale
- When **fetching**, client translates based on current locale

## Step-by-Step Usage

### 1. Import What You Need

```typescript
import { sendNotification, shipmentNotifications } from "@/core/notifications";
```

### 2. Send a Notification

```typescript
const result = await sendNotification({
  userId: 123,
  data: shipmentNotifications.requested.build({ id: 795 }),
  sendPush: true,    // Send push notification
  sendEmail: false,  // Don't send email
});
```

### 3. Check the Result

```typescript
console.log(result.notificationId); // "uuid-1234"
console.log(result.pushSent);       // true
console.log(result.emailSent);      // false
```

## Common Scenarios

### Scenario 1: New Order

```typescript
import { sendNotification, orderNotifications } from "@/core/notifications";

// In your order controller
export async function createOrder(req, res) {
  const order = await orderService.create(req.body);
  
  // Send notification
  await sendNotification({
    userId: req.user.id,
    data: orderNotifications.placed.build({
      orderId: order.id,
      total: order.total,
    }),
    sendPush: true,
    sendEmail: true,
    useQueue: true, // Async delivery via queue
  });
  
  res.json({ success: true, order });
}
```

### Scenario 2: Shipment Status Update

```typescript
import { sendNotification, shipmentNotifications } from "@/core/notifications";

// When shipment status changes
export async function updateShipmentStatus(shipmentId: number, newStatus: string) {
  const shipment = await updateShipment(shipmentId, newStatus);
  
  await sendNotification({
    userId: shipment.userId,
    data: shipmentNotifications.statusUpdated.build({
      id: shipmentId,
      status: newStatus,
    }),
    sendPush: true,
  });
  
  return shipment;
}
```

### Scenario 3: Welcome Email on Registration

```typescript
import { sendNotification, authNotifications } from "@/core/notifications";

// In registration controller
export async function register(req, res) {
  const user = await createUser(req.body);
  
  // Send welcome notification
  await sendNotification({
    userId: user.id,
    data: authNotifications.welcome.build({
      userName: user.name,
    }),
    sendEmail: true,
    emailContext: {
      // Additional data for email template
      activationLink: `https://app.com/activate?token=${user.activationToken}`,
    },
  });
  
  res.json({ success: true, user });
}
```

### Scenario 4: Bulk Notification

```typescript
import { sendNotificationToMany, systemNotifications } from "@/core/notifications";

// Send to all active users
export async function notifyMaintenance() {
  const users = await prisma.appUser.findMany({
    where: { status: "active", notificationsEnabled: true },
    select: { id: true },
  });
  
  const userIds = users.map(u => u.id);
  
  await sendNotificationToMany(
    userIds,
    systemNotifications.maintenance.build({
      startTime: "2024-01-15 02:00 AM",
      duration: "2 hours",
    }),
    {
      sendPush: true,
      useQueue: true, // IMPORTANT for bulk sends
    }
  );
}
```

## Fetching Notifications (Client-Side)

### Get User's Notifications

```typescript
import { getUserNotifications } from "@/core/notifications";
import { translate } from "@/core/notifications/i18nHelper";

// In your notifications endpoint
export async function getMyNotifications(req, res) {
  const userId = req.user.id;
  const userLocale = req.user.locale || "en";
  
  const notifications = await getUserNotifications(userId, {
    limit: 20,
    unreadOnly: false,
  });
  
  // Translate on the fly
  const translated = notifications.map(n => ({
    id: n.id,
    type: n.type,
    title: translate(n.data.title, userLocale, n.data.variables),
    message: translate(n.data.message, userLocale, n.data.variables),
    actionUrl: n.data.actionUrl,
    readAt: n.readAt,
    createdAt: n.createdAt,
  }));
  
  res.json({ notifications: translated });
}
```

### Mark as Read

```typescript
import { markNotificationAsRead } from "@/core/notifications";

export async function markAsRead(req, res) {
  const { notificationId } = req.params;
  const userId = req.user.id;
  
  await markNotificationAsRead(notificationId, userId);
  
  res.json({ success: true });
}
```

## Available Notification Types

### Shipment
```typescript
shipmentNotifications.requested
shipmentNotifications.statusUpdated
shipmentNotifications.delivered
shipmentNotifications.cancelled
```

### Order
```typescript
orderNotifications.placed
orderNotifications.confirmed
orderNotifications.shipped
orderNotifications.delivered
orderNotifications.cancelled
orderNotifications.paymentReceived
```

### Auth
```typescript
authNotifications.welcome
authNotifications.passwordResetRequest
authNotifications.passwordChanged
authNotifications.newDeviceLogin
authNotifications.accountStatusChanged
```

### System
```typescript
systemNotifications.maintenance
systemNotifications.appUpdate
systemNotifications.announcement
```

## Creating Your Own Notification Type

### Step 1: Create the File

Create `src/core/notifications/types/yourFeature.ts`:

```typescript
import { BaseNotification } from "../base";
import type { NotificationData } from "../types";

export class YourNotification extends BaseNotification {
  readonly type = "your_feature_action";
  readonly titleKey = "messages.push_notification.your_feature.action.title";
  readonly messageKey = "messages.push_notification.your_feature.action.message";
  readonly emailSubjectKey = "messages.email.your_feature.action.subject";
  readonly emailTemplateId = "your-feature-action";

  build(variables: { id: number; name: string }): NotificationData {
    return {
      ...super.build(variables),
      actionUrl: `/your-feature/${variables.id}`,
    };
  }
}

export const yourFeatureNotifications = {
  action: new YourNotification(),
};
```

### Step 2: Add Translations

In `src/core/notifications/i18nHelper.ts`, add your keys:

```typescript
const defaultTranslations: Record<string, Record<string, string>> = {
  en: {
    // ... existing translations
    "messages.push_notification.your_feature.action.title": "Action Completed",
    "messages.push_notification.your_feature.action.message": "{{name}} (ID: {{id}}) has been processed",
  },
  ar: {
    "messages.push_notification.your_feature.action.title": "تم إكمال الإجراء",
    "messages.push_notification.your_feature.action.message": "تمت معالجة {{name}} (المعرف: {{id}})",
  },
};
```

### Step 3: Export and Use

In `src/core/notifications/types/index.ts`:

```typescript
export * from "./yourFeature";
```

Use it:

```typescript
import { sendNotification, yourFeatureNotifications } from "@/core/notifications";

await sendNotification({
  userId: 123,
  data: yourFeatureNotifications.action.build({
    id: 456,
    name: "Test Item",
  }),
  sendPush: true,
});
```

## Migration Checklist

- [ ] Identify all places where notifications are sent
- [ ] Check if notification type exists (shipment, order, auth, system)
- [ ] If not, create new notification type
- [ ] Replace `notificationCenter.notifyUser()` with `sendNotification()`
- [ ] Test push notifications
- [ ] Test email notifications
- [ ] Verify translations in all supported locales
- [ ] Update frontend to fetch and translate notifications

## Best Practices

1. ✅ **Always use `.build()`** - Don't manually create notification data
2. ✅ **Use queues for bulk sends** - Set `useQueue: true`
3. ✅ **Provide all variables** - Make sure all `{{variables}}` in translation keys have values
4. ✅ **Test all locales** - Ensure translations exist for all supported languages
5. ✅ **Use actionUrl** - Provide deep links for better UX
6. ❌ **Don't hardcode text** - Always use i18n keys
7. ❌ **Don't fetch too many** - Use pagination (limit/offset)

## Troubleshooting

### Issue: Notification not sending

**Check:**
- User has `deviceToken` set?
- User has `notificationsEnabled: true`?
- Push service configured?
- Mailer configured for emails?

### Issue: Wrong translation

**Check:**
- Translation key exists in `i18nHelper.ts`?
- Correct locale being used?
- Variables provided in `.build()`?

### Issue: Variables not interpolating

**Check:**
- Variable names match `{{variableName}}` in translation?
- Variables passed to `.build()`?
- Variable values are not `undefined`?

## Support

For detailed documentation, see `NOTIFICATION_SYSTEM.md`

For code examples, see `src/core/notifications/examples.ts`

