# Notification System

## Quick Reference

### Send a Notification

```typescript
import { sendNotification, shipmentNotifications } from "@/core/notifications";

await sendNotification({
  userId: 123,
  data: shipmentNotifications.requested.build({ id: 795 }),
  sendPush: true,
  sendEmail: true,
});
```

### What Gets Stored

```json
{
  "type": "shipment_requested",
  "title": "messages.push_notification.shipment.new_request.title",
  "message": "messages.push_notification.shipment.new_request.message",
  "variables": {"id": 795}
}
```

### Available Notification Types

```typescript
// Shipment
shipmentNotifications.requested
shipmentNotifications.statusUpdated
shipmentNotifications.delivered
shipmentNotifications.cancelled

// Order
orderNotifications.placed
orderNotifications.confirmed
orderNotifications.shipped
orderNotifications.delivered
orderNotifications.cancelled
orderNotifications.paymentReceived

// Auth
authNotifications.welcome
authNotifications.passwordResetRequest
authNotifications.passwordChanged
authNotifications.newDeviceLogin
authNotifications.accountStatusChanged

// System
systemNotifications.maintenance
systemNotifications.appUpdate
systemNotifications.announcement
```

## Key Features

✅ **i18n Key-Based Storage** - Notifications stored with translation keys  
✅ **Dynamic Translation** - Translated on-the-fly based on user's locale  
✅ **Individual Type Files** - Each notification type has its own file  
✅ **Type Safety** - Full TypeScript support  
✅ **Multi-Channel** - Push notifications and email  
✅ **Queue Support** - Async delivery for better performance  

## Documentation

📖 **[Quick Start Guide](../../../NOTIFICATION_USAGE_GUIDE.md)** - Get started in 5 minutes  
📖 **[Full Documentation](../../../NOTIFICATION_SYSTEM.md)** - Complete API reference  
📖 **[Implementation Summary](../../../NOTIFICATION_IMPLEMENTATION_SUMMARY.md)** - What was built  

## Code Examples

See `examples.ts` for 13 practical examples including:
- Sending notifications
- Bulk notifications
- Multi-locale support
- Email with templates
- Queue usage
- And more...

## Creating Your Own Notification

1. Create file in `types/yourFeature.ts`
2. Extend `BaseNotification`
3. Add translations to `i18nHelper.ts`
4. Export from `types/index.ts`
5. Use it!

See documentation for detailed guide.

