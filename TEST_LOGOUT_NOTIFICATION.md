# Test Logout Notification

## ✅ What Was Implemented

The logout endpoint now uses the **new notification system** with i18n keys to send a notification when users log out.

## 📍 Location

**File:** `src/modules/app/auth/auth.controller.ts`  
**Function:** `logoutAppUser()`

## 📝 What It Does

When a user logs out, the system:

1. ✅ **Stores notification in database** with i18n keys (not translated text)
2. ✅ **Sends push notification** in user's locale
3. ✅ **Logs success/failure** for debugging
4. ✅ **Doesn't block logout** if notification fails

## 🔍 The Code

```typescript
// Test the new notification system on logout
if (user.deviceToken && user.notificationsEnabled) {
  try {
    await sendNotification({
      userId: user.id,
      data: {
        type: "auth_logout",
        title: "messages.push_notification.auth.logout.title",
        message: "messages.push_notification.auth.logout.message",
        variables: {
          userName: user.name || "User",
          timestamp: new Date().toISOString(),
        },
        metadata: {
          action: "logout",
        },
      },
      locale: user.locale || "en",
      sendPush: true,
      sendEmail: false,
      markAsRead: false,
    });

    logger.info("Logout notification sent successfully", { userId: user.id });
  } catch (error) {
    logger.error("Failed to send logout notification", error);
  }
}
```

## 📊 What Gets Stored in Database

```json
{
  "type": "auth_logout",
  "title": "messages.push_notification.auth.logout.title",
  "message": "messages.push_notification.auth.logout.message",
  "variables": {
    "userName": "John Doe",
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "metadata": {
    "action": "logout"
  }
}
```

**Notice:** The title and message are **i18n keys**, not actual text!

## 📱 What Users Receive (Push Notification)

### English User
```
Title: "Logged Out"
Message: "You have successfully logged out, John Doe. See you soon!"
```

### Arabic User
```
Title: "تم تسجيل الخروج"
Message: "تم تسجيل خروجك بنجاح يا John Doe. نراك قريباً!"
```

### French User
```
Title: "Déconnecté"
Message: "Vous vous êtes déconnecté avec succès, John Doe. À bientôt !"
```

### Spanish User
```
Title: "Sesión cerrada"
Message: "Has cerrado sesión exitosamente, John Doe. ¡Hasta pronto!"
```

## 🧪 How to Test

### Step 1: Setup Test User

Make sure you have a test user with:
- ✅ Valid `deviceToken` (for push notifications)
- ✅ `notificationsEnabled: true`
- ✅ Locale set (`en`, `ar`, `fr`, or `es`)

### Step 2: Login

```bash
POST /api/app/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123",
  "deviceToken": "your-device-token-here",
  "locale": "en"
}
```

### Step 3: Logout (This triggers the notification)

```bash
POST /api/app/auth/logout
Authorization: Bearer <your-token>
```

### Step 4: Check Results

#### 1. Check Database

```sql
SELECT * FROM notifications 
WHERE notifiable_id = <user_id> 
  AND type = 'auth_logout'
ORDER BY created_at DESC 
LIMIT 1;
```

You should see:
```json
{
  "data": {
    "type": "auth_logout",
    "title": "messages.push_notification.auth.logout.title",
    "message": "messages.push_notification.auth.logout.message",
    "variables": {
      "userName": "Your Name",
      "timestamp": "..."
    }
  }
}
```

#### 2. Check Device

The user should receive a push notification in their language!

#### 3. Check Logs

```bash
# Should see this in logs
"Logout notification sent successfully" { userId: 123 }
```

## 🌍 Test Different Locales

### Test with English User

```bash
# Update user locale to English
PATCH /api/app/auth/profile
Authorization: Bearer <token>

{
  "locale": "en"
}

# Then logout
POST /api/app/auth/logout
```

**Expected Push:**
- Title: "Logged Out"
- Message: "You have successfully logged out, [Name]. See you soon!"

### Test with Arabic User

```bash
# Update user locale to Arabic
PATCH /api/app/auth/profile
Authorization: Bearer <token>

{
  "locale": "ar"
}

# Then logout
POST /api/app/auth/logout
```

**Expected Push:**
- Title: "تم تسجيل الخروج"
- Message: "تم تسجيل خروجك بنجاح يا [Name]. نراك قريباً!"

### Test with French User

```bash
# Update user locale to French
PATCH /api/app/auth/profile
Authorization: Bearer <token>

{
  "locale": "fr"
}

# Then logout
POST /api/app/auth/logout
```

**Expected Push:**
- Title: "Déconnecté"
- Message: "Vous vous êtes déconnecté avec succès, [Name]. À bientôt !"

### Test with Spanish User

```bash
# Update user locale to Spanish
PATCH /api/app/auth/profile
Authorization: Bearer <token>

{
  "locale": "es"
}

# Then logout
POST /api/app/auth/logout
```

**Expected Push:**
- Title: "Sesión cerrada"
- Message: "Has cerrado sesión exitosamente, [Name]. ¡Hasta pronto!"

## 🔧 Debugging

### If Notification Not Received

1. **Check user has deviceToken:**
```sql
SELECT device_token, notifications_enabled 
FROM users 
WHERE id = <user_id>;
```

2. **Check push service is enabled:**
```typescript
// In your .env
FCM_PROJECT_ID=your-project-id
FCM_CLIENT_EMAIL=your-email
FCM_PRIVATE_KEY=your-key
```

3. **Check logs:**
```bash
# Look for errors
grep "Failed to send logout notification" logs/app.log

# Or success
grep "Logout notification sent successfully" logs/app.log
```

### If Wrong Language

1. **Check user locale:**
```sql
SELECT locale FROM users WHERE id = <user_id>;
```

2. **Verify translation exists:**
```typescript
import { hasTranslation } from "@/core/notifications/i18nHelper";

console.log(hasTranslation("messages.push_notification.auth.logout.title", "ar"));
// Should return true
```

### If Not Stored in Database

1. **Check notification wasn't marked as persist: false**
2. **Check database connection**
3. **Look for errors in logs**

## 📋 Verification Checklist

- [ ] User has valid `deviceToken`
- [ ] User has `notificationsEnabled: true`
- [ ] User has valid `locale` (`en`, `ar`, `fr`, `es`)
- [ ] FCM/Push service is configured
- [ ] Database notification is created
- [ ] Push notification is sent to device
- [ ] Notification is in correct language
- [ ] Variables are interpolated correctly (`userName`)
- [ ] Logout still works even if notification fails

## 🎯 Expected Behavior

### Success Flow

1. User clicks "Logout" in app
2. API receives POST /auth/logout
3. System checks: device token exists & notifications enabled
4. Notification **stored in DB** with i18n keys
5. Notification **translated** to user's locale
6. Push notification **sent** to device
7. User **receives** notification in their language
8. Device token **cleared** from database
9. User **logged out** successfully

### Failure Flow (Notification fails)

1. User clicks "Logout"
2. System tries to send notification
3. ❌ Notification fails (network error, invalid token, etc.)
4. ✅ Error is logged
5. ✅ Logout still completes successfully
6. ✅ User is logged out (notification failure doesn't block logout)

## 🚀 Next Steps

After testing logout notification, you can apply the same pattern to other events:

- **Login:** Welcome back notification
- **Password changed:** Security alert
- **Order placed:** Order confirmation
- **Shipment update:** Status change notification

## 📖 Related Documentation

- **NOTIFICATION_USAGE_GUIDE.md** - How to use the system
- **NOTIFICATION_SYSTEM.md** - Complete technical docs
- **TRANSLATION_FILES_SUMMARY.md** - Translation files overview

## ✨ Benefits You Just Saw

✅ **i18n keys stored** - Database has keys, not text  
✅ **Dynamic translation** - Sent in user's current locale  
✅ **Easy to maintain** - Change translation without touching code  
✅ **Multi-language ready** - Works in 4 languages out of the box  
✅ **Type-safe** - Full TypeScript support  
✅ **Graceful failure** - Doesn't block logout if notification fails  

## 🎉 Success!

If you can logout and receive a notification in your language, the new notification system is working perfectly! 

The notification is stored with i18n keys and translated on-the-fly based on user's locale. If the user changes their language later, all old notifications will automatically display in the new language when fetched from the API.

