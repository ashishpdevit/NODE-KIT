import { BaseNotification } from "../base";
import type { NotificationData } from "../types";

/**
 * Shipment Request Notification
 * Sent when a new shipment request is created
 */
export class ShipmentRequestedNotification extends BaseNotification {
  readonly type = "shipment_requested";
  readonly titleKey = "messages.push_notification.shipment.new_request.title";
  readonly messageKey = "messages.push_notification.shipment.new_request.message";
  readonly emailSubjectKey = "messages.email.shipment.new_request.subject";
  readonly emailTemplateId = "shipment-requested";

  build(variables: { id: number; trackingNumber?: string }): NotificationData {
    return {
      ...super.build(variables),
      actionUrl: `/shipments/${variables.id}`,
    };
  }
}

/**
 * Shipment Status Updated Notification
 * Sent when shipment status changes
 */
export class ShipmentStatusUpdatedNotification extends BaseNotification {
  readonly type = "shipment_status_updated";
  readonly titleKey = "messages.push_notification.shipment.status_updated.title";
  readonly messageKey = "messages.push_notification.shipment.status_updated.message";
  readonly emailSubjectKey = "messages.email.shipment.status_updated.subject";
  readonly emailTemplateId = "shipment-status-updated";

  build(variables: { id: number; status: string; trackingNumber?: string }): NotificationData {
    return {
      ...super.build(variables),
      actionUrl: `/shipments/${variables.id}`,
      metadata: {
        status: variables.status,
      },
    };
  }
}

/**
 * Shipment Delivered Notification
 * Sent when shipment is delivered
 */
export class ShipmentDeliveredNotification extends BaseNotification {
  readonly type = "shipment_delivered";
  readonly titleKey = "messages.push_notification.shipment.delivered.title";
  readonly messageKey = "messages.push_notification.shipment.delivered.message";
  readonly emailSubjectKey = "messages.email.shipment.delivered.subject";
  readonly emailTemplateId = "shipment-delivered";

  build(variables: { id: number; trackingNumber?: string; deliveredAt?: string }): NotificationData {
    return {
      ...super.build(variables),
      actionUrl: `/shipments/${variables.id}`,
    };
  }
}

/**
 * Shipment Cancelled Notification
 * Sent when shipment is cancelled
 */
export class ShipmentCancelledNotification extends BaseNotification {
  readonly type = "shipment_cancelled";
  readonly titleKey = "messages.push_notification.shipment.cancelled.title";
  readonly messageKey = "messages.push_notification.shipment.cancelled.message";
  readonly emailSubjectKey = "messages.email.shipment.cancelled.subject";
  readonly emailTemplateId = "shipment-cancelled";

  build(variables: { id: number; reason?: string }): NotificationData {
    return {
      ...super.build(variables),
      actionUrl: `/shipments/${variables.id}`,
      metadata: {
        reason: variables.reason,
      },
    };
  }
}

// Export instances for easy usage
export const shipmentNotifications = {
  requested: new ShipmentRequestedNotification(),
  statusUpdated: new ShipmentStatusUpdatedNotification(),
  delivered: new ShipmentDeliveredNotification(),
  cancelled: new ShipmentCancelledNotification(),
};

