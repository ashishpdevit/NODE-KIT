# 📧 Email Template System Guide

## Overview

The notification system automatically sends emails using **Handlebars templates** that are rendered with translated content and custom context.

---

## 🎯 How Email Templates Are Considered

### 1. **Define Email Template in Notification Class**

When creating a notification type, specify:
- `emailSubjectKey`: The i18n key for email subject
- `emailTemplateId`: The template file name (without `.hbs`)

```typescript
export class LoggedOutNotification extends BaseNotification {
  readonly type = "auth_logged_out";
  readonly titleKey = "messages.push_notification.auth.logout.title";
  readonly messageKey = "messages.push_notification.auth.logout.message";
  readonly emailSubjectKey = "messages.email.auth.logout.subject";  // 📧 Email subject
  readonly emailTemplateId = "logged-out";                          // 📄 Template file

  // ⚠️ IMPORTANT: Override build() to include metadata
  build(variables?: Record<string, unknown>): NotificationData {
    const baseData = super.build(variables);
    return {
      ...baseData,
      metadata: {
        ...baseData.metadata,
        emailSubjectKey: this.emailSubjectKey,
        emailTemplateId: this.emailTemplateId,
      },
    };
  }
}
```

### 2. **System Extracts Template Info from Metadata**

The `sendNotification` function reads these values from the notification data's metadata:

```typescript:156-162:src/core/notifications/notificationService.ts
const emailSubjectKey = options.data.metadata?.emailSubjectKey as string | undefined;
const emailTemplateId = options.data.metadata?.emailTemplateId as string | undefined;
```

### 3. **Template is Rendered with Context**

The system renders the template using:
- **Locale**: User's language preference
- **Variables**: Data passed to notification
- **Context**: Additional email-specific context

---

## 📁 File Structure

```
src/core/
├── notifications/
│   ├── types/
│   │   └── auth.ts          # Notification definitions
│   ├── locales/
│   │   ├── en.ts            # English translations
│   │   ├── ar.ts            # Arabic translations
│   │   ├── es.ts            # Spanish translations
│   │   └── fr.ts            # French translations
│   └── notificationService.ts
└── templates/
    └── email/
        ├── layouts/
        │   ├── welcome.hbs         # Welcome email template
        │   ├── password-reset.hbs  # Password reset template
        │   └── logged-out.hbs      # Logout email template ✅ NEW
        └── partials/
            ├── header.hbs          # Reusable header
            └── footer.hbs          # Reusable footer
```

---

## 🛠️ Step-by-Step: Creating a New Email Template

### **Step 1: Add Translation Keys**

Add keys for email subject in all locale files:

**`src/core/notifications/locales/en.ts`:**
```typescript
const enNested = {
  messages: {
    email: {
      auth: {
        logout: {
          subject: "You've been logged out - {{userName}}",
        },
      },
    },
  },
};
```

**`src/core/notifications/locales/ar.ts`:**
```typescript
"messages.email.auth.logout.subject": "تم تسجيل خروجك - {{userName}}",
```

### **Step 2: Create the Notification Class**

**`src/core/notifications/types/auth.ts`:**
```typescript
export class LoggedOutNotification extends BaseNotification {
  readonly type = "auth_logged_out";
  readonly titleKey = "messages.push_notification.auth.logout.title";
  readonly messageKey = "messages.push_notification.auth.logout.message";
  readonly emailSubjectKey = "messages.email.auth.logout.subject";
  readonly emailTemplateId = "logged-out";  // 👈 Template name

  // ⚠️ MUST override build() to include metadata
  build(variables?: Record<string, unknown>): NotificationData {
    const baseData = super.build(variables);
    return {
      ...baseData,
      metadata: {
        ...baseData.metadata,
        emailSubjectKey: this.emailSubjectKey,
        emailTemplateId: this.emailTemplateId,
      },
    };
  }
}

// Export instance
export const authNotifications = {
  logout: new LoggedOutNotification(),
  // ... other notifications
};
```

### **Step 3: Create the Handlebars Template**

**`src/core/templates/email/layouts/logged-out.hbs`:**
```handlebars
<!doctype html>
<html lang="{{locale}}">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{{subject}}</title>
  </head>
  <body style="background-color:#f3f4f6;margin:0;padding:24px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;">
      {{> header}}
      <tr>
        <td style="padding:32px;">
          <h2 style="margin:0 0 24px 0;font-size:24px;text-align:center;">
            👋 See You Soon!
          </h2>
          
          {{#if greeting}}
            <p>{{greeting}}</p>
          {{/if}}
          
          <div style="background:#f0f9ff;border-radius:8px;padding:20px;margin:24px 0;text-align:center;">
            <p style="font-weight:600;">✅ You have successfully logged out</p>
            {{#if timestamp}}
              <p style="font-family:monospace;">{{timestamp}}</p>
            {{/if}}
          </div>
          
          {{#each intro}}
            <p>{{this}}</p>
          {{/each}}
          
          {{#each ctas}}
            <p style="text-align:center;">
              <a href="{{url}}" style="background:#2563eb;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;">
                {{label}}
              </a>
            </p>
          {{/each}}
          
          {{#each outro}}
            <p>{{this}}</p>
          {{/each}}
          
          <div style="background:#fef3c7;padding:20px;border-left:4px solid #f59e0b;">
            <p style="font-weight:600;">🔒 Security Tip</p>
            <p>If you didn't initiate this logout, please secure your account immediately.</p>
          </div>
        </td>
      </tr>
      {{> footer}}
    </table>
  </body>
</html>
```

### **Step 4: Use in Your Code**

```typescript
import { sendNotification } from "@/core/notifications/notificationService";
import { authNotifications } from "@/core/notifications/types/auth";

await sendNotification({
  userId: user.id,
  data: authNotifications.logout.build({ 
    userName: user.name || "User", 
    timestamp: new Date().toISOString()
  }),
  sendPush: true,    // ✅ Sends push notification
  sendEmail: true,   // ✅ Sends email using template
  useQueue: true,    // ✅ Async delivery via queue
  
  // Optional: Additional context for email template
  emailContext: {
    greeting: `Hi ${user.name}!`,
    intro: ["You have been logged out from your account."],
    outro: ["We hope to see you again soon!"],
    ctas: [
      {
        label: "Log Back In",
        url: "https://yourapp.com/login"
      }
    ],
    footerNote: "This is an automated message.",
  }
});
```

---

## 📦 Available Template Variables

All Handlebars templates have access to these variables:

### **Built-in Variables**
| Variable | Description |
|----------|-------------|
| `{{locale}}` | User's locale (e.g., "en", "ar") |
| `{{brand}}` / `{{app.name}}` | App name from config |
| `{{subject}}` | Email subject (translated) |
| `{{title}}` | Notification title (translated) |
| `{{message}}` | Notification message (translated) |
| `{{year}}` | Current year |

### **Custom Context Variables**
| Variable | Type | Description |
|----------|------|-------------|
| `{{greeting}}` | String | Custom greeting |
| `{{intro}}` | Array | Intro paragraphs |
| `{{outro}}` | Array | Outro paragraphs |
| `{{ctas}}` | Array | Call-to-action buttons |
| `{{footerNote}}` | String | Footer note |
| `{{previewText}}` | String | Preview text for email clients |

### **Your Custom Variables**
Any variable you pass in `variables` or `emailContext`:
```typescript
// In notification build
authNotifications.logout.build({ 
  userName: "John Doe",      // → {{userName}}
  timestamp: "2024-01-15"    // → {{timestamp}}
})

// In emailContext
emailContext: {
  resetLink: "https://...",  // → {{resetLink}}
  expiresAt: "1 hour"       // → {{expiresAt}}
}
```

---

## 🎨 Template Helpers

### **Conditionals**
```handlebars
{{#if greeting}}
  <p>{{greeting}}</p>
{{/if}}
```

### **Loops**
```handlebars
{{#each intro}}
  <p>{{this}}</p>
{{/each}}
```

### **Partials**
```handlebars
{{> header}}  <!-- Includes header.hbs -->
{{> footer}}  <!-- Includes footer.hbs -->
```

---

## 🌍 Multi-language Support

The system automatically:
1. ✅ Translates subject using `emailSubjectKey`
2. ✅ Translates title and message using notification keys
3. ✅ Renders template with user's locale
4. ✅ Interpolates variables in translated strings

**Example:**

**English User:**
- Subject: "You've been logged out - John Doe"
- Template rendered with `locale="en"`

**Arabic User:**
- Subject: "تم تسجيل خروجك - John Doe"
- Template rendered with `locale="ar"`

---

## 🔍 How It All Works Together

1. **You call `sendNotification()`** with notification data
2. **System extracts** `emailTemplateId` and `emailSubjectKey` from metadata
3. **System translates** subject, title, and message to user's locale
4. **System loads** Handlebars template from `layouts/{{emailTemplateId}}.hbs`
5. **System renders** template with translated content + custom context
6. **System sends** email via mailer (immediately or via queue)
7. **System updates** notification record with delivery status

---

## 📝 Example: Complete Flow

```typescript
// 1. Define notification class
export class LoggedOutNotification extends BaseNotification {
  readonly emailTemplateId = "logged-out";
  readonly emailSubjectKey = "messages.email.auth.logout.subject";
  // ...
}

// 2. Add translations
// en.ts: "messages.email.auth.logout.subject": "You've been logged out - {{userName}}"
// ar.ts: "messages.email.auth.logout.subject": "تم تسجيل خروجك - {{userName}}"

// 3. Create template
// logged-out.hbs with {{userName}}, {{timestamp}}, etc.

// 4. Send notification
await sendNotification({
  userId: 123,
  data: authNotifications.logout.build({ 
    userName: "John", 
    timestamp: "2024-01-15" 
  }),
  sendEmail: true,
  emailContext: {
    greeting: "Hi John!",
    ctas: [{ label: "Log Back In", url: "https://..." }]
  }
});

// ✅ Result:
// - Email sent to user in their locale
// - Subject: "You've been logged out - John" (or Arabic equivalent)
// - Beautiful HTML email rendered from template
// - Push notification also sent
// - Record saved in database
```

---

## ⚠️ Important Notes

1. **Always override `build()` method** to include metadata with `emailSubjectKey` and `emailTemplateId`
2. **Template filename** must match `emailTemplateId` (without `.hbs`)
3. **Translation keys** must exist in ALL locale files
4. **Use inline styles** in templates (email clients don't support `<style>` tags well)
5. **Test templates** in multiple email clients (Gmail, Outlook, etc.)

---

## 🚀 Quick Checklist

When creating a new notification with email template:

- [ ] Add `emailSubjectKey` and `emailTemplateId` to notification class
- [ ] Override `build()` method to include metadata
- [ ] Add email subject translations to ALL locale files (en, ar, es, fr)
- [ ] Create Handlebars template in `layouts/` folder
- [ ] Export notification instance in `authNotifications` (or similar)
- [ ] Test with `sendNotification()` using `sendEmail: true`

---

## 🎉 You're All Set!

Your email template system is now configured and ready to use. The logout notification example is fully implemented and can be tested immediately.

Happy coding! 🚀

