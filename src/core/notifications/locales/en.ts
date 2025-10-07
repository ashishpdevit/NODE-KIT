/**
 * English translations for notifications
 * Using nested structure for better maintainability
 */

/**
 * Flattens nested translation object into dot-notation keys
 * e.g., { messages: { email: { auth: { logout: { subject: "..." } } } } }
 *    => { "messages.email.auth.logout.subject": "..." }
 */
function flattenTranslations(
  obj: Record<string, any>,
  prefix = ""
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "string") {
      result[newKey] = value;
    } else if (typeof value === "object" && value !== null) {
      Object.assign(result, flattenTranslations(value, newKey));
    }
  }

  return result;
}

// Nested structure (easier to maintain)
const enNested = {
  messages: {
    email: {
      auth: {
        logout: {
          subject: "You've been logged out - {{userName}}",
        },
        welcome: {
          subject: "Welcome to Our App!",
        },
        password_reset: {
          subject: "Reset Your Password",
        },
        password_changed: {
          subject: "Your Password Has Been Changed",
        },
        new_device: {
          subject: "New Device Login Alert",
        },
        account_status: {
          subject: "Account Status Update",
        },
      },
      shipment: {
        new_request: {
          subject: "New Shipment Request #{{id}}",
        },
      },
      order: {
        placed: {
          subject: "Order Confirmation - Order #{{orderId}}",
        },
        confirmed: {
          subject: "Order #{{orderId}} Confirmed",
        },
        shipped: {
          subject: "Your Order #{{orderId}} Has Been Shipped",
        },
        delivered: {
          subject: "Your Order #{{orderId}} Has Been Delivered",
        },
        cancelled: {
          subject: "Order #{{orderId}} Cancelled",
        },
        payment_received: {
          subject: "Payment Confirmation - Order #{{orderId}}",
        },
      },
    },
    push_notification: {
      auth: {
        logout: {
          title: "Logged Out",
          message: "You have successfully logged out, {{userName}}. See you soon!",
        },
        welcome: {
          title: "Welcome!",
          message: "Welcome to our app, {{userName}}! We're excited to have you here.",
        },
        password_reset: {
          title: "Password Reset Requested",
          message: "Your password reset request has been received. Please check your email.",
        },
        password_changed: {
          title: "Password Changed",
          message: "Your password has been changed successfully",
        },
        new_device: {
          title: "New Device Login Detected",
          message: "A login from a new device was detected on your account",
        },
        account_status: {
          title: "Account Status Changed",
          message: "Your account status has been changed to {{status}}",
        },
      },
      shipment: {
        new_request: {
          title: "New Shipment Request",
          message: "Shipment #{{id}} has been requested",
        },
      },
      order: {
        placed: {
          title: "Order Placed Successfully",
          message: "Your order #{{orderId}} has been placed successfully",
        },
        confirmed: {
          title: "Order Confirmed",
          message: "Your order #{{orderId}} has been confirmed and is being processed",
        },
        shipped: {
          title: "Order Shipped",
          message: "Your order #{{orderId}} has been shipped",
        },
        delivered: {
          title: "Order Delivered",
          message: "Your order #{{orderId}} has been delivered successfully",
        },
        cancelled: {
          title: "Order Cancelled",
          message: "Your order #{{orderId}} has been cancelled",
        },
        payment_received: {
          title: "Payment Received",
          message: "Payment of ${{amount}} received for order #{{orderId}}",
        },
      },
      system: {
        maintenance: {
          title: "Scheduled Maintenance",
          message: "System maintenance is scheduled at {{startTime}}. Expected duration: {{duration}}",
        },
        app_update: {
          title: "Update Available",
          message: "Version {{version}} is now available for download",
        },
        announcement: {
          title: "Announcement",
          message: "{{announcementText}}",
        },
      },
    },
  },
  common: {
    hello: "Hello",
    thank_you: "Thank you",
    regards: "Best regards",
    team: "The Team",
    view_details: "View Details",
  },
};

// Export flattened version for the translation system
export const en = flattenTranslations(enNested);

export type TranslationKeys = keyof typeof en;

