# Testing Notification Variables - Fix Verification

## Issue Found

The existing notifications in your database were created with an older version of the code that stored variables incorrectly. The new fix will work for **new notifications**, but old ones won't have the variables.

## What Was Fixed

1. **`notification.service.ts`**: Now handles variables at both root level and in metadata
2. Variables are properly interpolated when retrieving notifications
3. Backwards compatible with old notification format

## Testing the Fix

### Step 1: Clear Old Notifications (Optional)

You can clear old test notifications:

```typescript
// In your code or via API
await notificationService.clearAll(userId);
```

Or via database:
```sql
DELETE FROM Notification WHERE type = 'auth_logged_out';
```

### Step 2: Create a New Notification

Log out again to create a new notification with the fixed code. The notification will now store variables properly.

### Step 3: Fetch Notifications

```bash
GET /api/app/notifications
Headers: Authorization: Bearer <your-token>
```

### Expected Result (New Notifications)

```json
{
  "success": true,
  "data": [
    {
      "id": "new-notification-id",
      "type": "auth_logged_out",
      "title": "تم تسجيل الخروج",
      "message": "تم تسجيل خروجك بنجاح يا User. نراك قريباً!",
      "read": false,
      "locale": "ar",
      "translations": {
        "titles": {
          "en": "Logged Out",
          "ar": "تم تسجيل الخروج"
        },
        "messages": {
          "en": "You've been successfully logged out, User. See you soon!",
          "ar": "تم تسجيل خروجك بنجاح يا User. نراك قريباً!"
        }
      },
      "metadata": {
        "variables": {
          "userName": "User",
          "timestamp": "2025-10-07T..."
        }
      }
    }
  ]
}
```

Notice:
- ✅ `{{userName}}` is replaced with actual name
- ✅ All translations have interpolated variables
- ✅ metadata contains variables

### Old Notifications

Old notifications (created before the fix) will still show `{{userName}}` because they don't have variables stored in the database.

## Verification Steps

1. **Deploy the updated code** (already built successfully)
2. **Restart your server** to load the new code
3. **Log out** to trigger a new notification
4. **Fetch notifications** and verify the new one has variables interpolated

## Quick Test Script

You can test directly with a custom notification:

```typescript
import { notificationCenter } from "@/core/services/notificationCenter";

// Test with custom notification
await notificationCenter.dispatch({
  title: "Test {{userName}}",
  message: "Hello {{userName}}, you have {{count}} new messages!",
  defaultLocale: "en",
  localizedContent: {
    en: {
      title: "Test {{userName}}",
      message: "Hello {{userName}}, you have {{count}} new messages!"
    },
    ar: {
      title: "اختبار {{userName}}",
      message: "مرحباً {{userName}}، لديك {{count}} رسائل جديدة!"
    }
  },
  notifiableType: "user",
  notifiableId: userId,
  persist: true,
  metadata: {
    variables: {
      userName: "John Doe",
      count: 5
    }
  }
});

// Then fetch and check
const notifications = await notificationService.list(userId, "en");
console.log(notifications[0].title); // Should be: "Test John Doe"
console.log(notifications[0].message); // Should be: "Hello John Doe, you have 5 new messages!"
```

## Database Check

To see what's actually stored in the database:

```sql
SELECT id, type, data, createdAt 
FROM Notification 
WHERE type = 'auth_logged_out' 
ORDER BY createdAt DESC 
LIMIT 1;
```

Check if the `data` column contains variables:
```json
{
  "type": "auth_logged_out",
  "title": "messages.push_notification.auth.logout.title",
  "message": "messages.push_notification.auth.logout.message",
  "variables": {
    "userName": "User",
    "timestamp": "2025-10-07T..."
  },
  "metadata": {
    "emailSubjectKey": "messages.email.auth.logout.subject",
    "emailTemplateId": "logged-out"
  }
}
```

## Why Old Notifications Still Have {{userName}}

The old notifications were created when:
1. Variables were passed to `sendNotification()`
2. But they weren't stored in the database properly
3. So when you retrieve them, there are no variables to interpolate

## Solution Options

### Option 1: Clear Old Test Notifications
```typescript
await notificationService.clearAll(userId);
```

### Option 2: Keep Old Notifications
They'll show {{userName}} but new ones will work correctly.

### Option 3: Migration Script (if needed)
If you want to fix old notifications, you'd need to:
1. Query old notifications
2. Add default variables
3. Update the database

Example migration:
```typescript
async function migrateOldNotifications() {
  const oldNotifications = await prisma.notification.findMany({
    where: {
      type: 'auth_logged_out',
      // Add condition to find old format
    }
  });

  for (const notif of oldNotifications) {
    const data = JSON.parse(notif.data);
    if (!data.variables) {
      data.variables = {
        userName: "User", // Default value
        timestamp: notif.createdAt.toISOString()
      };
      await prisma.notification.update({
        where: { id: notif.id },
        data: { data: JSON.stringify(data) }
      });
    }
  }
}
```

## Summary

✅ **Code is fixed** - New notifications will work correctly  
✅ **Build successful** - Changes are compiled  
⚠️ **Old notifications** - Still have {{userName}} (no variables stored)  
✅ **Next step** - Create new notification by logging out again  

---

**Status: Fix Complete - Ready for Testing**

Test by logging out and checking the new notification!

