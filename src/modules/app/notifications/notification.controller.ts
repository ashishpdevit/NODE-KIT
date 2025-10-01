import type { Request, Response } from "express";

import { toError, toSuccess } from "@/core/utils/httpResponse";
import { handlePrismaError } from "@/core/utils/prismaError";
import { parseNumericParam } from "@/core/utils/requestHelpers";

import type { AppUserSafe } from "@/modules/app/auth/auth.service";
import { notificationService } from "./notification.service";

export const listNotifications = async (req: Request, res: Response) => {
  try {
    const user = res.locals.appUser as AppUserSafe | undefined;
    if (!user) {
      return res.status(401).json(toError("User not authenticated"));
    }

    const notifications = await notificationService.list(user.id);
    res.json(toSuccess("Notifications fetched", notifications));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const getNotification = async (req: Request, res: Response) => {
  try {
    const user = res.locals.appUser as AppUserSafe | undefined;
    if (!user) {
      return res.status(401).json(toError("User not authenticated"));
    }

    const id = parseNumericParam(req.params.id, "notification id");
    const notification = await notificationService.get(id, user.id);
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

export const updateNotificationStatus = async (req: Request, res: Response) => {
  try {
    const user = res.locals.appUser as AppUserSafe | undefined;
    if (!user) {
      return res.status(401).json(toError("User not authenticated"));
    }

    const id = parseNumericParam(req.params.id, "notification id");
    const { read } = req.body;

    if (typeof read !== "boolean") {
      return res.status(400).json(toError("Invalid read status"));
    }

    const result = await notificationService.updateStatus(id, user.id, read);
    if (result.count === 0) {
      return res.status(404).json(toError("Notification not found"));
    }

    res.json(toSuccess("Notification status updated"));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid")) {
      return res.status(400).json(toError(error.message));
    }
    return handlePrismaError(res, error);
  }
};

export const clearAllNotifications = async (req: Request, res: Response) => {
  try {
    const user = res.locals.appUser as AppUserSafe | undefined;
    if (!user) {
      return res.status(401).json(toError("User not authenticated"));
    }

    const result = await notificationService.clearAll(user.id);
    res.json(toSuccess("All notifications cleared", { count: result.count }));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};
