import { Router } from "express";

import { 
  createNotification, 
  createNotificationForAllUsers, 
  createNotificationForUser, 
  getNotification, 
  listNotifications 
} from "./notification.controller";

export const adminNotificationRouter = Router();

adminNotificationRouter.get("/", listNotifications);
adminNotificationRouter.get("/:id", getNotification);
adminNotificationRouter.post("/create", createNotification);
adminNotificationRouter.post("/create/user", createNotificationForUser);
adminNotificationRouter.post("/create/all-users", createNotificationForAllUsers);
