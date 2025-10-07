import { BaseNotification } from "../base";
import type { NotificationData } from "../types";

/**
 * Order Placed Notification
 * Sent when a new order is created
 */
export class OrderPlacedNotification extends BaseNotification {
  readonly type = "order_placed";
  readonly titleKey = "messages.push_notification.order.placed.title";
  readonly messageKey = "messages.push_notification.order.placed.message";
  readonly emailSubjectKey = "messages.email.order.placed.subject";
  readonly emailTemplateId = "order-placed";

  build(variables: { orderId: string | number; total?: number }): NotificationData {
    return {
      ...super.build(variables),
      actionUrl: `/orders/${variables.orderId}`,
    };
  }
}

/**
 * Order Confirmed Notification
 * Sent when order is confirmed by admin/system
 */
export class OrderConfirmedNotification extends BaseNotification {
  readonly type = "order_confirmed";
  readonly titleKey = "messages.push_notification.order.confirmed.title";
  readonly messageKey = "messages.push_notification.order.confirmed.message";
  readonly emailSubjectKey = "messages.email.order.confirmed.subject";
  readonly emailTemplateId = "order-confirmed";

  build(variables: { orderId: string | number }): NotificationData {
    return {
      ...super.build(variables),
      actionUrl: `/orders/${variables.orderId}`,
    };
  }
}

/**
 * Order Shipped Notification
 * Sent when order is shipped
 */
export class OrderShippedNotification extends BaseNotification {
  readonly type = "order_shipped";
  readonly titleKey = "messages.push_notification.order.shipped.title";
  readonly messageKey = "messages.push_notification.order.shipped.message";
  readonly emailSubjectKey = "messages.email.order.shipped.subject";
  readonly emailTemplateId = "order-shipped";

  build(variables: { orderId: string | number; trackingNumber?: string }): NotificationData {
    return {
      ...super.build(variables),
      actionUrl: `/orders/${variables.orderId}`,
      metadata: {
        trackingNumber: variables.trackingNumber,
      },
    };
  }
}

/**
 * Order Delivered Notification
 * Sent when order is delivered
 */
export class OrderDeliveredNotification extends BaseNotification {
  readonly type = "order_delivered";
  readonly titleKey = "messages.push_notification.order.delivered.title";
  readonly messageKey = "messages.push_notification.order.delivered.message";
  readonly emailSubjectKey = "messages.email.order.delivered.subject";
  readonly emailTemplateId = "order-delivered";

  build(variables: { orderId: string | number }): NotificationData {
    return {
      ...super.build(variables),
      actionUrl: `/orders/${variables.orderId}`,
    };
  }
}

/**
 * Order Cancelled Notification
 * Sent when order is cancelled
 */
export class OrderCancelledNotification extends BaseNotification {
  readonly type = "order_cancelled";
  readonly titleKey = "messages.push_notification.order.cancelled.title";
  readonly messageKey = "messages.push_notification.order.cancelled.message";
  readonly emailSubjectKey = "messages.email.order.cancelled.subject";
  readonly emailTemplateId = "order-cancelled";

  build(variables: { orderId: string | number; reason?: string }): NotificationData {
    return {
      ...super.build(variables),
      actionUrl: `/orders/${variables.orderId}`,
      metadata: {
        reason: variables.reason,
      },
    };
  }
}

/**
 * Payment Received Notification
 * Sent when payment is confirmed
 */
export class PaymentReceivedNotification extends BaseNotification {
  readonly type = "payment_received";
  readonly titleKey = "messages.push_notification.order.payment_received.title";
  readonly messageKey = "messages.push_notification.order.payment_received.message";
  readonly emailSubjectKey = "messages.email.order.payment_received.subject";
  readonly emailTemplateId = "payment-received";

  build(variables: { orderId: string | number; amount: number; paymentMethod?: string }): NotificationData {
    return {
      ...super.build(variables),
      actionUrl: `/orders/${variables.orderId}`,
      metadata: {
        amount: variables.amount,
        paymentMethod: variables.paymentMethod,
      },
    };
  }
}

// Export instances for easy usage
export const orderNotifications = {
  placed: new OrderPlacedNotification(),
  confirmed: new OrderConfirmedNotification(),
  shipped: new OrderShippedNotification(),
  delivered: new OrderDeliveredNotification(),
  cancelled: new OrderCancelledNotification(),
  paymentReceived: new PaymentReceivedNotification(),
};

