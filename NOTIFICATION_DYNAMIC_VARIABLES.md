# Dynamic Variables in Notifications

This guide explains how to use dynamic variables in notification messages that get properly interpolated when notifications are retrieved.

## How It Works

When you send notifications with dynamic content (like user names, order IDs, amounts, etc.), you can use **template variables** that will be replaced with actual values when the notification is displayed.

### Variable Syntax

Use double curly braces for variables: `{{variableName}}`

Example:
- `Hello {{userName}}!` → `Hello John!`
- `Your order #{{orderId}} has been shipped` → `Your order #ORD-12345 has been shipped`
- `Payment of {{amount}} received` → `Payment of $50.00 received`

## Sending Notifications with Variables

### Example 1: Simple Notification with Variables

```typescript
import { notificationCenter } from "@/core/services/notificationCenter";

await notificationCenter.dispatch({
  title: "Welcome {{userName}}!",
  message: "Thank you for joining {{appName}}. Your account has been created successfully.",
  notifiableType: "user",
  notifiableId: userId,
  persist: true,
  metadata: {
    variables: {
      userName: "John Doe",
      appName: "MyApp"
    }
  }
});
```

**Result:**
- Title: `Welcome John Doe!`
- Message: `Thank you for joining MyApp. Your account has been created successfully.`

### Example 2: Order Notification with Multiple Variables

```typescript
await notificationCenter.dispatch({
  title: "Order Confirmed",
  message: "Your order #{{orderId}} for {{productName}} ({{quantity}} items) has been confirmed. Total: {{totalAmount}}",
  notifiableType: "user",
  notifiableId: userId,
  persist: true,
  metadata: {
    variables: {
      orderId: "ORD-12345",
      productName: "Premium Package",
      quantity: 3,
      totalAmount: "$149.99"
    }
  }
});
```

**Result:**
- Message: `Your order #ORD-12345 for Premium Package (3 items) has been confirmed. Total: $149.99`

### Example 3: Multilingual Notifications with Variables

```typescript
await notificationCenter.dispatch({
  title: "Order Update",
  message: "Placeholder message",
  defaultLocale: "en",
  localizedContent: {
    en: {
      title: "Order {{orderId}} Shipped",
      message: "Your order has been shipped and will arrive by {{deliveryDate}}.",
    },
    ar: {
      title: "تم شحن الطلب {{orderId}}",
      message: "تم شحن طلبك وسيصل بحلول {{deliveryDate}}.",
    },
    fr: {
      title: "Commande {{orderId}} Expédiée",
      message: "Votre commande a été expédiée et arrivera avant le {{deliveryDate}}.",
    },
    es: {
      title: "Pedido {{orderId}} Enviado",
      message: "Su pedido ha sido enviado y llegará antes del {{deliveryDate}}.",
    }
  },
  notifiableType: "user",
  notifiableId: userId,
  persist: true,
  metadata: {
    variables: {
      orderId: "ORD-12345",
      deliveryDate: "December 25, 2024"
    }
  }
});
```

**Result (English):**
- Title: `Order ORD-12345 Shipped`
- Message: `Your order has been shipped and will arrive by December 25, 2024.`

**Result (Arabic):**
- Title: `تم شحن الطلب ORD-12345`
- Message: `تم شحن طلبك وسيصل بحلول December 25, 2024.`

### Example 4: Payment Notification

```typescript
await notificationCenter.dispatch({
  title: "Payment Received",
  message: "We received your payment of {{amount}} for invoice #{{invoiceNumber}}. Payment method: {{paymentMethod}}",
  notifiableType: "user",
  notifiableId: userId,
  persist: true,
  metadata: {
    variables: {
      amount: "$250.00",
      invoiceNumber: "INV-2024-001",
      paymentMethod: "Credit Card"
    }
  }
});
```

### Example 5: User Action Notification

```typescript
await notificationCenter.dispatch({
  title: "{{actorName}} mentioned you",
  message: "{{actorName}} mentioned you in a comment: \"{{commentText}}\"",
  notifiableType: "user",
  notifiableId: userId,
  persist: true,
  metadata: {
    variables: {
      actorName: "Sarah Johnson",
      commentText: "Great work on this project!"
    }
  }
});
```

## Retrieving Notifications with Variables

When you retrieve notifications, the variables are **automatically interpolated**:

```typescript
import { notificationService } from "@/modules/app/notifications/notification.service";

// Get user's notifications in their preferred locale
const notifications = await notificationService.list(userId, "en");

notifications.forEach(notification => {
  console.log(notification.title);    // Variables already interpolated!
  console.log(notification.message);  // Variables already interpolated!
});
```

### Example Response

```json
{
  "id": "notif-123",
  "type": "order_shipped",
  "title": "Order ORD-12345 Shipped",
  "message": "Your order has been shipped and will arrive by December 25, 2024.",
  "read": false,
  "locale": "en",
  "translations": {
    "defaultLocale": "en",
    "titles": {
      "en": "Order ORD-12345 Shipped",
      "ar": "تم شحن الطلب ORD-12345",
      "fr": "Commande ORD-12345 Expédiée",
      "es": "Pedido ORD-12345 Enviado"
    },
    "messages": {
      "en": "Your order has been shipped and will arrive by December 25, 2024.",
      "ar": "تم شحن طلبك وسيصل بحلول December 25, 2024.",
      "fr": "Votre commande a été expédiée et arrivera avant le December 25, 2024.",
      "es": "Su pedido ha sido enviado y llegará antes del December 25, 2024."
    }
  },
  "metadata": {
    "variables": {
      "orderId": "ORD-12345",
      "deliveryDate": "December 25, 2024"
    }
  }
}
```

## Variable Types

You can use any variable type that can be converted to a string:

### Strings
```typescript
metadata: {
  variables: {
    userName: "John Doe",
    productName: "Premium Plan"
  }
}
```

### Numbers
```typescript
metadata: {
  variables: {
    quantity: 5,
    price: 99.99,
    discount: 10
  }
}
```

### Dates (convert to string first)
```typescript
const deliveryDate = new Date('2024-12-25');

metadata: {
  variables: {
    deliveryDate: deliveryDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}
```

### Custom Objects (convert to string)
```typescript
metadata: {
  variables: {
    userInfo: JSON.stringify({ name: "John", email: "john@example.com" })
  }
}
```

## Best Practices

### 1. Always Provide Variables
If your message has placeholders, always include the variables:

```typescript
// ❌ BAD - Variables missing
await notificationCenter.dispatch({
  title: "Welcome {{userName}}!",
  message: "Your account is ready.",
  // Missing metadata with variables!
});

// ✅ GOOD
await notificationCenter.dispatch({
  title: "Welcome {{userName}}!",
  message: "Your account is ready.",
  metadata: {
    variables: {
      userName: "John Doe"
    }
  }
});
```

### 2. Use Consistent Variable Names
```typescript
// ✅ GOOD - Consistent naming
metadata: {
  variables: {
    orderId: "ORD-123",
    orderTotal: "$50.00",
    orderStatus: "shipped"
  }
}
```

### 3. Format Values Before Passing
```typescript
// ✅ GOOD - Pre-formatted values
metadata: {
  variables: {
    amount: `$${amount.toFixed(2)}`,
    date: date.toLocaleDateString(),
    percentage: `${(value * 100).toFixed(1)}%`
  }
}
```

### 4. Handle Missing Variables Gracefully
If a variable is missing, it will remain as `{{variableName}}` in the output:

```typescript
// Message: "Hello {{userName}}!" (userName not provided)
await notificationCenter.dispatch({
  title: "Hello {{userName}}!",
  message: "Welcome",
  metadata: {
    variables: {} // userName missing!
  }
});
```

### 5. Use Variables in All Locales
```typescript
await notificationCenter.dispatch({
  defaultLocale: "en",
  localizedContent: {
    en: {
      title: "{{count}} new messages",
      message: "You have {{count}} unread messages from {{senderName}}."
    },
    ar: {
      title: "{{count}} رسائل جديدة",
      message: "لديك {{count}} رسائل غير مقروءة من {{senderName}}."
    }
  },
  metadata: {
    variables: {
      count: 5,
      senderName: "Sarah"
    }
  }
});
```

## Common Use Cases

### User Mentions
```typescript
metadata: {
  variables: {
    mentionedBy: "John Doe",
    contentType: "comment",
    contentPreview: "Great work on..."
  }
}
```

### Order Updates
```typescript
metadata: {
  variables: {
    orderId: "ORD-12345",
    orderStatus: "shipped",
    trackingNumber: "TRK-98765",
    estimatedDelivery: "Dec 25, 2024"
  }
}
```

### Account Activity
```typescript
metadata: {
  variables: {
    activityType: "login",
    ipAddress: "192.168.1.1",
    location: "New York, USA",
    timestamp: "2024-12-20 10:30 AM"
  }
}
```

### Financial Transactions
```typescript
metadata: {
  variables: {
    transactionId: "TXN-98765",
    amount: "$150.00",
    currency: "USD",
    description: "Subscription Renewal",
    balanceAfter: "$850.00"
  }
}
```

## Testing

Test your notifications with different variable combinations:

```typescript
// Test with all variables
const testNotification1 = {
  title: "Order {{orderId}} {{status}}",
  metadata: {
    variables: {
      orderId: "ORD-123",
      status: "confirmed"
    }
  }
};

// Test with missing variables
const testNotification2 = {
  title: "Order {{orderId}} {{status}}",
  metadata: {
    variables: {
      orderId: "ORD-123"
      // status is missing - will show as {{status}}
    }
  }
};

// Test with special characters
const testNotification3 = {
  title: "{{userName}} sent you {{amount}}",
  metadata: {
    variables: {
      userName: "John O'Brien",
      amount: "$1,234.56"
    }
  }
};
```

## Troubleshooting

### Variables Not Interpolating?

1. **Check variable syntax**: Use `{{variableName}}`, not `{variableName}` or `$variableName`
2. **Check metadata structure**: Variables should be in `metadata.variables`
3. **Check variable names**: They should match exactly (case-sensitive)
4. **Check variable values**: Make sure they're defined and not `undefined`

### Variables Showing as Text?

If you see `{{userName}}` instead of the actual name:
1. The variable wasn't provided in `metadata.variables`
2. The variable name doesn't match (check spelling and case)
3. The variable value is `undefined` or `null`

## Summary

✅ Use `{{variableName}}` syntax for dynamic content  
✅ Always provide variables in `metadata.variables`  
✅ Variables work in all locales automatically  
✅ Variables are interpolated when notifications are retrieved  
✅ Format values before passing them as variables  
✅ Test with different variable combinations  

---

**Need more help?** Check [NOTIFICATION_USAGE_GUIDE.md](./NOTIFICATION_USAGE_GUIDE.md) for complete notification documentation.

