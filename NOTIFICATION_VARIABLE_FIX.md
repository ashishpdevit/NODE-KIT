# Notification Dynamic Variables - Fix Summary

## Issue

When retrieving notifications from the database, dynamic variables in notification titles and messages (like `{{userName}}`, `{{orderId}}`, etc.) were not being properly interpolated with their actual values.

## Root Cause

The notification service was calling the `translate()` function on already-translated strings that contained variable placeholders. The function was treating these strings as translation keys instead of templates that needed variable interpolation.

## Solution

Updated `src/modules/app/notifications/notification.service.ts` to:

1. **Added Variable Interpolation Function**
   - Created `interpolateVariables()` to replace `{{variableName}}` with actual values
   - Handles missing variables gracefully (leaves placeholder if variable not provided)

2. **Smart String Detection**
   - Detects if a string is a translation key (contains dots, no spaces) or an already-translated string
   - Translation keys: Uses `translate()` function
   - Translated strings: Uses direct variable interpolation

3. **Interpolates All Translation Maps**
   - Variables are now interpolated in all locale translations
   - Ensures consistency across all language versions
   - Client can switch languages and still see proper values

## What Changed

### Before
```typescript
// Variables were not interpolated properly
const title = translate(title.value, locale, variables);
const message = translate(message.value, locale, variables);
```

### After
```typescript
// Smart detection and interpolation
const titleIsKey = title.value.includes(".") && !title.value.includes(" ");
const finalTitle = titleIsKey
  ? translate(title.value, locale, variables)
  : interpolateVariables(title.value, variables);

// Also interpolate all translation maps
const interpolatedTitles = interpolateTitleMap(title.map);
const interpolatedMessages = interpolateMessageMap(message.map);
```

## How It Works Now

### 1. Sending Notification with Variables
```typescript
await notificationCenter.dispatch({
  title: "Order {{orderId}} Confirmed",
  message: "Your order for {{productName}} has been confirmed. Total: {{amount}}",
  notifiableId: userId,
  persist: true,
  metadata: {
    variables: {
      orderId: "ORD-12345",
      productName: "Premium Package",
      amount: "$149.99"
    }
  }
});
```

### 2. Stored in Database
```json
{
  "title": "Order {{orderId}} Confirmed",
  "message": "Your order for {{productName}} has been confirmed. Total: {{amount}}",
  "metadata": {
    "variables": {
      "orderId": "ORD-12345",
      "productName": "Premium Package",
      "amount": "$149.99"
    }
  }
}
```

### 3. Retrieved and Interpolated
```typescript
const notifications = await notificationService.list(userId, "en");

// Result:
{
  "title": "Order ORD-12345 Confirmed",
  "message": "Your order for Premium Package has been confirmed. Total: $149.99",
  "translations": {
    "titles": {
      "en": "Order ORD-12345 Confirmed",
      "ar": "تم تأكيد الطلب ORD-12345",
      // All locales have interpolated variables!
    }
  }
}
```

## Variable Syntax

Use double curly braces: `{{variableName}}`

### Examples
- `{{userName}}` → `John Doe`
- `{{orderId}}` → `ORD-12345`
- `{{amount}}` → `$50.00`
- `{{count}}` → `5`

## Testing

### Test Case 1: Simple Variables
```typescript
await notificationCenter.dispatch({
  title: "Welcome {{userName}}!",
  message: "Hello {{userName}}, your account is ready.",
  metadata: {
    variables: { userName: "John Doe" }
  }
});

// Expected output:
// Title: "Welcome John Doe!"
// Message: "Hello John Doe, your account is ready."
```

### Test Case 2: Multiple Variables
```typescript
await notificationCenter.dispatch({
  title: "Order {{orderId}} shipped",
  message: "Your order of {{quantity}} items will arrive by {{date}}",
  metadata: {
    variables: {
      orderId: "ORD-123",
      quantity: 3,
      date: "Dec 25"
    }
  }
});

// Expected output:
// Title: "Order ORD-123 shipped"
// Message: "Your order of 3 items will arrive by Dec 25"
```

### Test Case 3: Multilingual with Variables
```typescript
await notificationCenter.dispatch({
  defaultLocale: "en",
  localizedContent: {
    en: {
      title: "{{count}} new messages",
      message: "You have {{count}} unread messages"
    },
    ar: {
      title: "{{count}} رسائل جديدة",
      message: "لديك {{count}} رسائل غير مقروءة"
    }
  },
  metadata: {
    variables: { count: 5 }
  }
});

// Expected output (English):
// Title: "5 new messages"
// Message: "You have 5 unread messages"

// Expected output (Arabic):
// Title: "5 رسائل جديدة"
// Message: "لديك 5 رسائل غير مقروءة"
```

## Files Modified

1. **`src/modules/app/notifications/notification.service.ts`**
   - Added `interpolateVariables()` function
   - Updated `formatNotificationForLocale()` function
   - Added smart detection for translation keys vs translated strings
   - Added interpolation for all translation maps

## Backward Compatibility

✅ **Fully backward compatible**
- Existing notifications without variables: Work as before
- Translation keys: Still processed through translate()
- Translated strings: Now properly interpolate variables
- Missing variables: Left as placeholders (e.g., `{{userName}}`)

## Documentation

Created comprehensive documentation:
- **`NOTIFICATION_DYNAMIC_VARIABLES.md`** - Complete guide with examples
- **`NOTIFICATION_VARIABLE_FIX.md`** - This document

## Build Status

✅ **All checks passed:**
- TypeScript compilation: Success
- Linter: No errors
- Build: Success

## Usage Example

```typescript
// In your controller or service
import { notificationCenter } from "@/core/services/notificationCenter";

async function notifyOrderShipped(userId: number, order: Order) {
  await notificationCenter.dispatch({
    title: "Order {{orderId}} Shipped",
    message: "Your order has been shipped! Tracking: {{trackingNumber}}. Estimated delivery: {{deliveryDate}}",
    notifiableType: "user",
    notifiableId: userId,
    persist: true,
    metadata: {
      variables: {
        orderId: order.id,
        trackingNumber: order.trackingNumber,
        deliveryDate: order.estimatedDelivery.toLocaleDateString()
      }
    }
  });
}

// When user retrieves notifications:
const notifications = await notificationService.list(userId, "en");
// All variables are automatically interpolated!
```

## Next Steps

1. ✅ Fix implemented and tested
2. ✅ Documentation created
3. ✅ Build passes
4. 📝 Update your notification sending code to include variables in metadata
5. 📝 Test with your existing notifications

## Support

For more information:
- Complete guide: [NOTIFICATION_DYNAMIC_VARIABLES.md](./NOTIFICATION_DYNAMIC_VARIABLES.md)
- Usage guide: [NOTIFICATION_USAGE_GUIDE.md](./NOTIFICATION_USAGE_GUIDE.md)
- System overview: [NOTIFICATION_SYSTEM.md](./NOTIFICATION_SYSTEM.md)

---

**Fix Status: ✅ Complete and Ready to Use**

