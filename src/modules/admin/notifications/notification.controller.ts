import type { Request, Response } from "express";

import { toError, toSuccess } from "@/core/utils/httpResponse";
import { handlePrismaError } from "@/core/utils/prismaError";
import { parseNumericParam } from "@/core/utils/requestHelpers";

import { adminNotificationService } from "./notification.service";
import { notificationCreateSchema } from "./notification.validation";

export const listNotifications = async (req: Request, res: Response) => {
  try {
    const user_type = typeof req.query.user_type === "string" ? req.query.user_type : undefined;
    const read = typeof req.query.read === "string" ? req.query.read === "true" : undefined;

    const notifications = await adminNotificationService.list({ user_type, read });
    res.json(toSuccess("Notifications fetched", notifications));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const getNotification = async (req: Request, res: Response) => {
  try {
    const id = parseNumericParam(req.params.id, "notification id");
    const notification = await adminNotificationService.get(id);
    if (!notification) {
      return res.status(404).json(toError("Notification not found"));
    }
    res.json(toSuccess("Notification fetched", notification));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid")) {
      return res.status(400).json(toError(error.message));
    }
    return handlePrismaError(res, error);
  }
};

export const createNotification = async (req: Request, res: Response) => {
  try {
    const parsed = notificationCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
    }

    const notification = await adminNotificationService.create(parsed.data);
    res.status(201).json(toSuccess("Notification created", notification));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const createNotificationForUser = async (req: Request, res: Response) => {
  try {
    const { user_id, title, message, user_type = "user" } = req.body;

    if (!user_id || !title || !message) {
      return res.status(400).json(toError("Missing required fields: user_id, title, message"));
    }

    const notification = await adminNotificationService.createForUser(
      parseInt(user_id),
      title,
      message,
      user_type
    );
    res.status(201).json(toSuccess("Notification created for user", notification));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const createNotificationForAllUsers = async (req: Request, res: Response) => {
  try {
    const { title, message, user_type = "user" } = req.body;

    if (!title || !message) {
      return res.status(400).json(toError("Missing required fields: title, message"));
    }

    const notifications = await adminNotificationService.createForAllUsers(title, message, user_type);
    res.status(201).json(toSuccess("Notifications created for all users", { 
      count: notifications.length,
      notifications 
    }));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};
