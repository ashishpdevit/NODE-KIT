# SMS Quick Start Guide

Get started with SMS in 5 minutes!

## 🚀 Quick Setup

### 1. Choose Your Provider

#### Option A: Testing/Development (No setup required)
```env
SMS_PROVIDER=stub
```
✅ No credentials needed, messages logged to console

#### Option B: Twilio (Recommended for production)
```bash
npm install twilio
```

```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

#### Option C: Vonage (Alternative provider)
```bash
npm install @vonage/server-sdk
```

```env
SMS_PROVIDER=vonage
VONAGE_API_KEY=your_api_key
VONAGE_API_SECRET=your_api_secret
VONAGE_FROM=YourBrand
```

### 2. Send Your First SMS

```typescript
import { queuedSmsClient } from "@/core/lib/queuedSmsClient";

// Send a simple SMS
await queuedSmsClient.sendQueued({
  to: "+1234567890",
  message: "Hello! This is my first SMS."
});
```

That's it! 🎉

## 📱 Common Use Cases

### Verification Code
```typescript
await queuedSmsClient.sendVerificationCode("+1234567890", "123456", userId);
```

### Password Reset
```typescript
await queuedSmsClient.sendPasswordResetSms("+1234567890", "RESET123", 30, userId);
```

### Welcome Message
```typescript
await queuedSmsClient.sendWelcomeSms("+1234567890", "John", userId);
```

### Order Confirmation
```typescript
await queuedSmsClient.sendOrderConfirmationSms("+1234567890", "ORD-12345", userId);
```

### Order Status Update
```typescript
await queuedSmsClient.sendOrderStatusSms("+1234567890", "ORD-12345", "shipped", userId);
```

### Custom Message
```typescript
await queuedSmsClient.sendNotificationSms("+1234567890", "Your custom message here", userId);
```

### Bulk SMS
```typescript
const phones = ["+1234567890", "+0987654321"];
await queuedSmsClient.sendNotificationSms(phones, "Bulk message to all", userId);
```

## 🔧 Configuration Options

### Basic Configuration
```env
# Required
SMS_PROVIDER=stub|twilio|vonage
SMS_FROM=+1234567890

# Queue Settings (Optional)
SMS_QUEUE_CONCURRENCY=5
SMS_QUEUE_ATTEMPTS=3

# Redis (Optional, for production queues)
REDIS_URL=redis://localhost:6379
```

## 📊 Monitor Your SMS Queue

```typescript
import { queueWorker } from "@/core/services/queueWorker";

const stats = await queueWorker.getStats();
console.log(stats.sms);
// { waiting: 5, active: 2, completed: 120, failed: 3 }
```

## 🧪 Testing

In development, use stub mode to test without sending real SMS:

```env
SMS_PROVIDER=stub
```

Messages will be logged to console:
```
📱 SMS STUB MODE
════════════════════════════════════════
To: +1234567890
From: default
Message: Your verification code is 123456
════════════════════════════════════════
```

## 📖 Need More Help?

- **Full Documentation**: [SMS_USAGE_GUIDE.md](./SMS_USAGE_GUIDE.md)
- **Code Examples**: [src/modules/shared/sms/sms.example.ts](./src/modules/shared/sms/sms.example.ts)
- **Queue System**: [QUEUE_SYSTEM.md](./QUEUE_SYSTEM.md)

## 🔐 Phone Number Format

Always use E.164 format:
- ✅ `+14155552671` (US)
- ✅ `+442071234567` (UK)
- ✅ `+919876543210` (India)
- ❌ `(415) 555-2671`
- ❌ `4155552671`

## 💰 Cost Considerations

SMS costs vary by provider and destination:
- US: ~$0.0075 per SMS (Twilio)
- International: Varies widely
- **Tip**: Keep messages under 160 characters to avoid multi-part SMS

## ✅ Best Practices

1. ✅ Use queued sending in production
2. ✅ Validate phone numbers before sending
3. ✅ Keep messages concise (< 160 chars)
4. ✅ Include opt-out for marketing messages
5. ✅ Test in stub mode first
6. ✅ Monitor queue statistics
7. ✅ Handle errors gracefully
8. ✅ Respect user preferences

## 🚨 Troubleshooting

### SMS not sending?
```typescript
import { smsClient } from "@/core/lib/smsClient";
console.log("Provider:", smsClient.provider);
console.log("Enabled:", smsClient.isEnabled);
```

### Check failed jobs
```typescript
import { smsQueueService } from "@/core/services/smsQueue";
const stats = await smsQueueService.getStats();
console.log("Failed:", stats.failed);
```

### Clear stuck queue
```typescript
await smsQueueService.clear();
```

## 🎯 Production Checklist

- [ ] Provider SDK installed (`twilio` or `@vonage/server-sdk`)
- [ ] Environment variables configured
- [ ] Redis configured for queue
- [ ] SMS_PROVIDER set to `twilio` or `vonage`
- [ ] Phone number format validated (E.164)
- [ ] Rate limiting implemented (if needed)
- [ ] Queue monitoring set up
- [ ] Error handling implemented
- [ ] User opt-out mechanism (for marketing)
- [ ] Compliance with local regulations (TCPA, GDPR, etc.)

---

**Ready to send SMS?** Start with stub mode and follow the examples! 📱

