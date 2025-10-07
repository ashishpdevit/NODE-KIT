/**
 * Notification System
 * 
 * This module provides a modern notification system that stores notifications
 * with i18n keys instead of resolved text, allowing for dynamic translation
 * based on user locale.
 * 
 * @example
 * ```typescript
 * import { sendNotification, shipmentNotifications } from "@/core/notifications";
 * 
 * // Send a shipment requested notification
 * const result = await sendNotification({
 *   userId: 123,
 *   data: shipmentNotifications.requested.build({ id: 795 }),
 *   sendPush: true,
 *   sendEmail: true,
 *   useQueue: true,
 * });
 * ```
 */

export * from "./types";
export * from "./base";
export * from "./types/index";
export * from "./notificationService";

