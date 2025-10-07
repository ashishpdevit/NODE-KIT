# 📱 SMS Service - Quick Reference

## ⚡ Get Started in 30 Seconds

```typescript
import { queuedSmsClient } from "@/core/lib/queuedSmsClient";

// Send an SMS - that's it!
await queuedSmsClient.sendQueued({
  to: "+1234567890",
  message: "Hello from your app!"
});
```

No additional setup required! SMS is in **stub mode** by default - messages are logged to console.

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [SMS_QUICK_START.md](./SMS_QUICK_START.md) | Get started in 5 minutes |
| [SMS_USAGE_GUIDE.md](./SMS_USAGE_GUIDE.md) | Complete documentation |
| [SMS_IMPLEMENTATION_SUMMARY.md](./SMS_IMPLEMENTATION_SUMMARY.md) | What was implemented |
| [src/modules/shared/sms/sms.example.ts](./src/modules/shared/sms/sms.example.ts) | Code examples |

## 🎯 Common Use Cases

```typescript
// Verification Code
await queuedSmsClient.sendVerificationCode("+1234567890", "123456", userId);

// Password Reset
await queuedSmsClient.sendPasswordResetSms("+1234567890", "RESET123", 30, userId);

// Welcome Message
await queuedSmsClient.sendWelcomeSms("+1234567890", "John", userId);

// Order Confirmation
await queuedSmsClient.sendOrderConfirmationSms("+1234567890", "ORD-12345", userId);

// Order Status
await queuedSmsClient.sendOrderStatusSms("+1234567890", "ORD-12345", "shipped", userId);

// Custom Message
await queuedSmsClient.sendNotificationSms("+1234567890", "Your custom message", userId);

// Bulk SMS
await queuedSmsClient.sendNotificationSms(["+1234567890", "+0987654321"], "Bulk message");
```

## ⚙️ Configuration

### Development (Default - No Setup)
```env
SMS_PROVIDER=stub
```

### Production with Twilio
```bash
npm install twilio
```
```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Production with Vonage
```bash
npm install @vonage/server-sdk
```
```env
SMS_PROVIDER=vonage
VONAGE_API_KEY=your_api_key
VONAGE_API_SECRET=your_api_secret
VONAGE_FROM=YourBrand
```

## 🔍 Monitoring

```typescript
import { queueWorker } from "@/core/services/queueWorker";

// Check SMS queue statistics
const stats = await queueWorker.getStats();
console.log(stats.sms);
// Output: { waiting: 5, active: 2, completed: 120, failed: 3 }
```

## ✅ Features

- ✅ **Multiple Providers**: Twilio, Vonage, Stub mode
- ✅ **Queue-Based**: Async processing with retries
- ✅ **Pre-Built Templates**: Verification, welcome, orders, etc.
- ✅ **Bulk SMS**: Send to multiple recipients
- ✅ **Scheduled SMS**: Send messages later
- ✅ **TypeScript**: Full type safety
- ✅ **No Setup Required**: Works out of the box in stub mode

## 📝 Phone Number Format

Always use E.164 format:
- ✅ `+14155552671` (US)
- ✅ `+442071234567` (UK)  
- ✅ `+919876543210` (India)
- ❌ `(415) 555-2671`
- ❌ `4155552671`

## 🎓 Learn More

Start with [SMS_QUICK_START.md](./SMS_QUICK_START.md) for a 5-minute tutorial, then check [SMS_USAGE_GUIDE.md](./SMS_USAGE_GUIDE.md) for complete documentation.

---

**Ready to send SMS?** It's already configured and ready to use! 🚀

