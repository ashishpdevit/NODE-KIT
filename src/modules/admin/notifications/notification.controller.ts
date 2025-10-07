import type { Request, Response } from "express";

import { toError, toSuccess } from "@/core/utils/httpResponse";
import { handlePrismaError } from "@/core/utils/prismaError";
import { adminNotificationService } from "./notification.service";
import {
  notificationCreateSchema,
  notificationForAllUsersSchema,
  notificationForUserSchema,
} from "./notification.validation";

const serializeSummary = adminNotificationService.formatSummary;

const parseReadQuery = (value: unknown) => {
  if (typeof value !== "string") {
    return undefined;
  }
  if (value.toLowerCase() === "true") {
    return true;
  }
  if (value.toLowerCase() === "false") {
    return false;
  }
  return undefined;
};

export const listNotifications = async (req: Request, res: Response) => {
  try {
    const userTypeQuery = typeof req.query.user_type === "string" ? req.query.user_type : undefined;
    const notifiable_type =
      typeof req.query.notifiable_type === "string"
        ? req.query.notifiable_type
        : userTypeQuery === "user"
        ? "user"
        : undefined;
    const notifiable_id = typeof req.query.notifiable_id === "string" ? req.query.notifiable_id : undefined;
    const read = parseReadQuery(req.query.read);

    const notifications = await adminNotificationService.list({ notifiable_type, notifiable_id, read });
    res.json(toSuccess("Notifications fetched", notifications));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const getNotification = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json(toError("Notification id is required"));
    }

    const notification = await adminNotificationService.get(id);
    if (!notification) {
      return res.status(404).json(toError("Notification not found"));
    }
    res.json(toSuccess("Notification fetched", notification));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const createNotification = async (req: Request, res: Response) => {
  try {
    const parsed = notificationCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
    }

    const summary = await adminNotificationService.create(parsed.data);
    res.status(201).json(toSuccess("Notification created", serializeSummary(summary)));
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return res.status(404).json(toError(error.message));
    }
    return handlePrismaError(res, error);
  }
};

export const createNotificationForUser = async (req: Request, res: Response) => {
  try {
    const parsed = notificationForUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
    }

    const summary = await adminNotificationService.createForUser(
      parsed.data.user_id,
      parsed.data.title,
      parsed.data.message,
      parsed.data.user_type,
      {
        email: parsed.data.email,
        push: parsed.data.push,
        default_locale: parsed.data.default_locale,
        localized_content: parsed.data.localized_content,
        metadata: parsed.data.metadata,
      },
    );
    res
      .status(201)
      .json(toSuccess("Notification created for user", serializeSummary(summary)));
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return res.status(404).json(toError(error.message));
    }
    return handlePrismaError(res, error);
  }
};

export const createNotificationForAllUsers = async (req: Request, res: Response) => {
  try {
    const parsed = notificationForAllUsersSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
    }

    const summaries = await adminNotificationService.createForAllUsers(parsed.data);
    res.status(201).json(
      toSuccess("Notifications created for all users", {
        total: summaries.length,
        delivered: summaries.filter((summary) => summary.persisted).length,
        notifications: summaries.map(serializeSummary),
      }),
    );
  } catch (error) {
    return handlePrismaError(res, error);
  }
};
