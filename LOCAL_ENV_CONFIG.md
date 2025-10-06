# Local Environment Configuration

This document explains how to configure the environment variables for local development, including the new queue system settings.

## Environment Variables

Create a `.env` file in your project root with the following variables:

```bash
# Node Environment
NODE_ENV=development
PORT=3000
APP_NAME=Node Starter Kit
LOG_LEVEL=info

# API Configuration
APP_API_KEY=local-dev-app-api-key
APP_JWT_SECRET=change-me-app-jwt-secret-change-me
APP_JWT_EXPIRES_IN=15m
ADMIN_JWT_SECRET=change-me-admin-jwt-secret-change-me
ADMIN_JWT_EXPIRES_IN=30m
APP_PASSWORD_RESET_TOKEN_TTL_MINUTES=30

# Mail Configuration
MAIL_TRANSPORT=json
MAIL_FROM=no-reply@node-kit.local

# SMTP Configuration (optional - only needed if MAIL_TRANSPORT=smtp)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@gmail.com
# SMTP_PASSWORD=your-app-password

# Firebase Configuration (optional - only needed for push notifications)
# FIREBASE_PROJECT_ID=your-project-id
# FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Admin Panel Configuration (optional - for admin password reset links)
# ADMIN_PANEL_URL=https://admin.yourdomain.com

# Queue Configuration (optional - uses in-memory queues if not configured)
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=your-redis-password
# REDIS_DB=0
# REDIS_URL=redis://localhost:6379

# Queue Performance Tuning (optional)
# EMAIL_QUEUE_CONCURRENCY=5
# PUSH_QUEUE_CONCURRENCY=10

# Queue Retention Settings (optional)
# EMAIL_QUEUE_REMOVE_ON_COMPLETE=100
# EMAIL_QUEUE_REMOVE_ON_FAIL=50
# PUSH_QUEUE_REMOVE_ON_COMPLETE=100
# PUSH_QUEUE_REMOVE_ON_FAIL=50

# Queue Retry Settings (optional)
# EMAIL_QUEUE_ATTEMPTS=3
# PUSH_QUEUE_ATTEMPTS=3
```

## Queue Configuration Explained

### Redis Configuration (Optional)
If you want to use Redis for queue storage in development:

```bash
# Redis connection settings
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password  # Optional
REDIS_DB=0                          # Optional, defaults to 0
REDIS_URL=redis://localhost:6379    # Alternative to individual settings
```

**Note**: If Redis is not configured, the system will automatically use in-memory queues, which is perfect for local development.

### Queue Performance Tuning

```bash
# Number of concurrent jobs to process
EMAIL_QUEUE_CONCURRENCY=5    # Default: 5
PUSH_QUEUE_CONCURRENCY=10    # Default: 10
```

### Queue Retention Settings

```bash
# How many completed jobs to keep in memory
EMAIL_QUEUE_REMOVE_ON_COMPLETE=100
PUSH_QUEUE_REMOVE_ON_COMPLETE=100

# How many failed jobs to keep in memory
EMAIL_QUEUE_REMOVE_ON_FAIL=50
PUSH_QUEUE_REMOVE_ON_FAIL=50
```

### Queue Retry Settings

```bash
# How many times to retry failed jobs
EMAIL_QUEUE_ATTEMPTS=3
PUSH_QUEUE_ATTEMPTS=3
```

### Admin Panel Configuration

```bash
# Admin panel URL for password reset links
ADMIN_PANEL_URL=https://admin.yourdomain.com
```

**Note**: If `ADMIN_PANEL_URL` is not set, it defaults to `http://localhost:3000`. This URL is used to generate clickable reset links in admin password reset emails.

## Local Development Setup

### Option 1: Use In-Memory Queues (Recommended for Development)

Simply don't set any Redis environment variables. The system will automatically use in-memory queues:

```bash
# No Redis configuration needed
# Queues will work in-memory automatically
```

### Option 2: Use Redis for Development

If you want to test with Redis locally:

1. Install Redis:
   ```bash
   # Windows (using Chocolatey)
   choco install redis
   
   # macOS (using Homebrew)
   brew install redis
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install redis-server
   ```

2. Start Redis:
   ```bash
   redis-server
   ```

3. Add to your `.env`:
   ```bash
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

## Testing the Queue System

### 1. Check Queue Health

Visit: `http://localhost:3000/api/health/queues`

This will show you:
- Number of waiting jobs
- Number of active jobs
- Number of completed jobs
- Number of failed jobs

### 2. Test Email Queuing

```typescript
import { queuedMailer } from "@/core/lib/queuedMailer";

// This will queue an email
await queuedMailer.sendWelcomeEmail("test@example.com", "Test User", 123);
```

### 3. Test Push Notification Queuing

```typescript
import { queuedPushClient } from "@/core/lib/queuedPushClient";

// This will queue a push notification
await queuedPushClient.sendWelcomePush(["test_device_token"], 123);
```

### 4. Test Notification Center Queuing

```typescript
import { notificationCenter } from "@/core/services/notificationCenter";

// This will queue both email and push notification
await notificationCenter.notifyUserQueued(123, {
  title: "Test Notification",
  message: "This is a test notification",
  email: { to: "test@example.com" },
  push: { tokens: ["test_device_token"] },
});
```

## Default Behavior

- **No Redis configured**: Uses in-memory queues (perfect for development)
- **Redis configured**: Uses Redis for queue storage
- **Email transport**: Uses `json` transport by default (emails logged to console)
- **Push notifications**: Disabled by default (requires Firebase configuration)

## Environment Variable Priority

1. `.env` file in project root
2. System environment variables
3. Default values (defined in code)

## Troubleshooting

### Queue Workers Not Starting
- Check the server logs for queue initialization errors
- Ensure Redis is running if you're using Redis configuration

### Jobs Not Processing
- Check if queue workers are initialized in server logs
- Verify queue health at `/api/health/queues`

### Redis Connection Issues
- Ensure Redis is running: `redis-cli ping`
- Check Redis connection settings
- Remove Redis config to fall back to in-memory queues

### High Memory Usage
- Reduce `*_QUEUE_REMOVE_ON_COMPLETE` and `*_QUEUE_REMOVE_ON_FAIL` values
- Increase queue concurrency if you have many jobs

## Production vs Development

| Setting | Development | Production |
|---------|-------------|------------|
| Queue Storage | In-memory or Redis | Redis (recommended) |
| Email Transport | `json` (console logs) | `smtp` |
| Log Level | `debug` or `info` | `warn` or `error` |
| Queue Concurrency | Lower (5-10) | Higher (20-50) |
| Job Retention | Lower (50-100) | Higher (1000+) |
