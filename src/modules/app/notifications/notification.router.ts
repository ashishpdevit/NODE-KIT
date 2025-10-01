import { Router } from "express";

import { appAuth } from "@/core/middlewares/appAuth";

import { clearAllNotifications, getNotification, listNotifications, updateNotificationStatus } from "./notification.controller";

export const notificationRouter = Router();

notificationRouter.use(appAuth);

notificationRouter.get("/", listNotifications);
notificationRouter.get("/:id", getNotification);
notificationRouter.patch("/status/change/:id", updateNotificationStatus);
notificationRouter.delete("/clear-all", clearAllNotifications);
