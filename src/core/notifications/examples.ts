/**
 * Notification System Usage Examples
 * 
 * This file contains practical examples of how to use the notification system
 * in different scenarios.
 */

import {
  sendNotification,
  sendNotificationToMany,
  getUserNotifications,
  shipmentNotifications,
  orderNotifications,
  authNotifications,
  systemNotifications,
} from "@/core/notifications";

/**
 * Example 1: Send a shipment requested notification
 */
export async function exampleShipmentRequested() {
  const userId = 123;
  const shipmentId = 795;
  const trackingNumber = "TRK123456";

  const result = await sendNotification({
    userId,
    data: shipmentNotifications.requested.build({
      id: shipmentId,
      trackingNumber,
    }),
    sendPush: true,
    sendEmail: true,
    useQueue: true, // Use queue for async delivery
  });

  console.log("Notification sent:", result);
  return result;
}

/**
 * Example 2: Send order placed notification with email
 */
export async function exampleOrderPlaced() {
  const userId = 456;
  const orderId = "ORD-12345";
  const total = 99.99;

  const result = await sendNotification({
    userId,
    data: orderNotifications.placed.build({
      orderId,
      total,
    }),
    sendPush: true,
    sendEmail: true,
    emailContext: {
      // Additional context for email template
      customerName: "John Doe",
      orderItems: [
        { name: "Product 1", quantity: 2, price: 49.99 },
      ],
    },
  });

  return result;
}

/**
 * Example 3: Send welcome notification on registration
 */
export async function exampleWelcomeNotification(userId: number, userName: string) {
  const result = await sendNotification({
    userId,
    data: authNotifications.welcome.build({ userName }),
    sendPush: true,
    sendEmail: true,
  });

  return result;
}

/**
 * Example 4: Send password reset notification
 */
export async function examplePasswordReset(
  userId: number,
  resetToken: string,
  expiresAt: string
) {
  const result = await sendNotification({
    userId,
    data: authNotifications.passwordResetRequest.build({
      resetToken,
      expiresAt,
    }),
    sendEmail: true, // Only email, no push
    emailContext: {
      resetLink: `https://yourapp.com/reset-password?token=${resetToken}`,
    },
  });

  return result;
}

/**
 * Example 5: Send maintenance notification to all users
 */
export async function exampleMaintenanceNotification(
  allUserIds: number[],
  startTime: string,
  duration: string
) {
  const results = await sendNotificationToMany(
    allUserIds,
    systemNotifications.maintenance.build({
      startTime,
      duration,
    }),
    {
      sendPush: true,
      useQueue: true, // Important: use queue for bulk sends
    }
  );

  console.log(`Sent to ${results.length} users`);
  return results;
}

/**
 * Example 6: Send order status update with different locales
 */
export async function exampleMultiLocaleNotification(
  users: Array<{ id: number; locale: string }>
) {
  const orderId = "ORD-999";

  const results = await Promise.all(
    users.map((user) =>
      sendNotification({
        userId: user.id,
        data: orderNotifications.confirmed.build({ orderId }),
        locale: user.locale, // Each user gets notification in their locale
        sendPush: true,
      })
    )
  );

  return results;
}

/**
 * Example 7: Fetch and display user notifications
 */
export async function exampleFetchUserNotifications(userId: number) {
  // Get unread notifications only
  const unreadNotifications = await getUserNotifications(userId, {
    unreadOnly: true,
    limit: 20,
  });

  console.log(`User has ${unreadNotifications.length} unread notifications`);

  // Display notifications (in a real app, you'd translate these on the frontend)
  unreadNotifications.forEach((notification) => {
    console.log({
      id: notification.id,
      type: notification.type,
      titleKey: notification.data.title,
      messageKey: notification.data.message,
      variables: notification.data.variables,
      actionUrl: notification.data.actionUrl,
      createdAt: notification.createdAt,
    });
  });

  return unreadNotifications;
}

/**
 * Example 8: Silent notification (stored but not sent)
 */
export async function exampleSilentNotification(userId: number, orderId: string) {
  const result = await sendNotification({
    userId,
    data: orderNotifications.confirmed.build({ orderId }),
    sendPush: false, // Don't send push
    sendEmail: false, // Don't send email
    markAsRead: true, // Mark as read immediately (silent storage)
  });

  return result;
}

/**
 * Example 9: Order shipped with tracking number
 */
export async function exampleOrderShipped(
  userId: number,
  orderId: string,
  trackingNumber: string
) {
  const result = await sendNotification({
    userId,
    data: orderNotifications.shipped.build({
      orderId,
      trackingNumber,
    }),
    sendPush: true,
    sendEmail: true,
    emailContext: {
      trackingUrl: `https://tracking.example.com/${trackingNumber}`,
    },
  });

  return result;
}

/**
 * Example 10: Shipment status update notification
 */
export async function exampleShipmentStatusUpdate(
  userId: number,
  shipmentId: number,
  status: string
) {
  const result = await sendNotification({
    userId,
    data: shipmentNotifications.statusUpdated.build({
      id: shipmentId,
      status,
    }),
    sendPush: true,
  });

  return result;
}

/**
 * Example 11: In a controller - handling shipment request
 */
export async function exampleInController(userId: number, shipmentData: any) {
  try {
    // Create shipment in database
    // const shipment = await createShipment(shipmentData);

    // Send notification
    const notificationResult = await sendNotification({
      userId,
      data: shipmentNotifications.requested.build({
        id: 795, // shipment.id
        trackingNumber: "TRK123456", // shipment.trackingNumber
      }),
      sendPush: true,
      sendEmail: false,
      useQueue: true,
    });

    return {
      success: true,
      // shipment,
      notificationSent: notificationResult.pushSent,
    };
  } catch (error) {
    console.error("Failed to create shipment:", error);
    throw error;
  }
}

/**
 * Example 12: Bulk notification with filtering
 */
export async function exampleBulkNotificationFiltered(
  condition: (user: any) => boolean
) {
  // In a real scenario, fetch users from database with filtering
  // const users = await prisma.appUser.findMany({ where: { ... } });
  
  const users = [
    { id: 1, locale: "en", notificationsEnabled: true },
    { id: 2, locale: "ar", notificationsEnabled: true },
    { id: 3, locale: "en", notificationsEnabled: false },
  ];

  const filteredUsers = users.filter(condition);
  const userIds = filteredUsers.map((u) => u.id);

  const results = await sendNotificationToMany(
    userIds,
    systemNotifications.appUpdate.build({
      version: "2.0.0",
      isRequired: true,
    }),
    {
      sendPush: true,
      useQueue: true,
    }
  );

  return results;
}

/**
 * Example 13: Payment received notification
 */
export async function examplePaymentReceived(
  userId: number,
  orderId: string,
  amount: number,
  paymentMethod: string
) {
  const result = await sendNotification({
    userId,
    data: orderNotifications.paymentReceived.build({
      orderId,
      amount,
      paymentMethod,
    }),
    sendPush: true,
    sendEmail: true,
    emailContext: {
      receiptUrl: `https://yourapp.com/receipts/${orderId}`,
    },
  });

  return result;
}

