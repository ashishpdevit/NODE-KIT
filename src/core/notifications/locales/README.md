# Translation Files

This directory contains translation files for the notification system.

## Current Languages

- ✅ **English** (`en.ts`) - Complete
- ✅ **Arabic** (`ar.ts`) - Complete

## File Structure

Each translation file exports a constant object with translation keys:

```typescript
export const en = {
  "messages.push_notification.shipment.new_request.title": "New Shipment Request",
  "messages.push_notification.shipment.new_request.message": "Shipment #{{id}} has been requested",
  // ... more translations
} as const;
```

## Adding a New Language

### Step 1: Create the Translation File

Create a new file `[locale].ts` (e.g., `de.ts` for German):

```typescript
/**
 * German translations for notifications
 * Deutsche Übersetzungen für Benachrichtigungen
 */

export const de = {
  // Shipment notifications
  "messages.push_notification.shipment.new_request.title": "Neue Versandanfrage",
  "messages.push_notification.shipment.new_request.message": "Versand #{{id}} wurde angefordert",
  "messages.email.shipment.new_request.subject": "Neue Versandanfrage #{{id}}",

  // Copy all keys from en.ts and translate them
  // ...
} as const;
```

### Step 2: Update the Index File

Add your new translation to `index.ts`:

```typescript
import { en } from "./en";
import { ar } from "./ar";
import { de } from "./de"; // Add this

export const translations = {
  en,
  ar,
  de, // Add this
} as const;
```

### Step 3: Test

The translation will be automatically available:

```typescript
import { translate } from "@/core/notifications/i18nHelper";

const german = translate(
  "messages.push_notification.shipment.new_request.title",
  "de"
);
// Returns: "Neue Versandanfrage"
```

## Translation Keys Reference

### Key Format

All keys follow this format:
```
messages.[channel].[category].[type].[field]
```

**Examples:**
- `messages.push_notification.shipment.new_request.title`
- `messages.email.order.placed.subject`
- `messages.push_notification.auth.welcome.message`

### Variable Interpolation

Use `{{variableName}}` for dynamic values:

```typescript
"messages.push_notification.order.placed.message": "Your order #{{orderId}} has been placed"
```

Variables are provided when building notifications:

```typescript
orderNotifications.placed.build({ orderId: "123" })
```

## Categories

### Shipment Notifications
```
messages.push_notification.shipment.*
messages.email.shipment.*
```

Types: `new_request`, `status_updated`, `delivered`, `cancelled`

### Order Notifications
```
messages.push_notification.order.*
messages.email.order.*
```

Types: `placed`, `confirmed`, `shipped`, `delivered`, `cancelled`, `payment_received`

### Auth Notifications
```
messages.push_notification.auth.*
messages.email.auth.*
```

Types: `welcome`, `password_reset`, `password_changed`, `new_device`, `account_status`

### System Notifications
```
messages.push_notification.system.*
messages.email.system.*
```

Types: `maintenance`, `app_update`, `announcement`

### Common Phrases
```
common.*
```

Examples: `hello`, `thank_you`, `regards`, `team`, etc.

## Best Practices

1. **Keep keys consistent** across all languages
2. **Test variables** - Ensure all `{{variables}}` work properly
3. **Use native speakers** - Get translations reviewed by native speakers
4. **Maintain tone** - Keep the same tone/formality level across languages
5. **RTL support** - For RTL languages (Arabic, Hebrew), test UI rendering
6. **Plural forms** - Consider plural forms if needed (might need additional logic)
7. **Date/time formats** - Be aware of locale-specific formatting needs

## Testing Translations

```typescript
import { translate } from "@/core/notifications/i18nHelper";

// Test English
console.log(translate("messages.push_notification.order.placed.title", "en"));
// Output: "Order Placed Successfully"

// Test Arabic
console.log(translate("messages.push_notification.order.placed.title", "ar"));
// Output: "تم تقديم الطلب بنجاح"

// Test with variables
console.log(translate(
  "messages.push_notification.order.placed.message",
  "en",
  { orderId: "123" }
));
// Output: "Your order #123 has been placed successfully"
```

## Dynamic Translation Loading

You can also load translations dynamically at runtime:

```typescript
import { addTranslations } from "@/core/notifications/i18nHelper";

// Load from API
const translations = await fetch("/api/translations/de").then(r => r.json());
addTranslations("de", translations);

// Or load from database
const dbTranslations = await prisma.translation.findMany({
  where: { locale: "de" }
});
const translationMap = Object.fromEntries(
  dbTranslations.map(t => [t.key, t.value])
);
addTranslations("de", translationMap);
```

## Exporting for Translation Services

To export keys for translation services (like Crowdin, Lokalise, etc.):

1. Extract all keys from `en.ts`
2. Convert to JSON format if needed
3. Send to translation service
4. Import translated keys back

## Missing Translations

If a translation key is missing:
1. The system falls back to the default locale (English)
2. If missing in English too, the key itself is returned
3. Check console for warnings about missing keys

## Contribution

When adding new notification types:
1. Add keys to `en.ts` first
2. Update all other language files
3. Update this README with new categories/types
4. Test all translations

