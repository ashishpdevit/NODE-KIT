import type { Request, Response } from "express";

import { toError, toSuccess } from "@/core/utils/httpResponse";
import { handlePrismaError } from "@/core/utils/prismaError";
import { parseNumericParam } from "@/core/utils/requestHelpers";

import { appSettingService } from "./appSetting.service";
import { appSettingCreateSchema, appSettingUpdateSchema } from "./appSetting.validation";

export const listAppSettings = async (_req: Request, res: Response) => {
  const settings = await appSettingService.list();
  res.json(toSuccess("Application settings fetched", settings));
};

export const getAppSetting = async (req: Request, res: Response) => {
  try {
    const id = parseNumericParam(req.params.id, "app setting id");
    const setting = await appSettingService.get(id);
    if (!setting) {
      return res.status(404).json(toError("Setting not found"));
    }
    res.json(toSuccess("Application setting fetched", setting));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid")) {
      return res.status(400).json(toError(error.message));
    }
    return handlePrismaError(res, error);
  }
};

export const createAppSetting = async (req: Request, res: Response) => {
  const parsed = appSettingCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  const payload = {
    ...parsed.data,
    forceUpdates: parsed.data.forceUpdates ?? 0,
    maintenance: parsed.data.maintenance ?? 0,
  };

  try {
    const created = await appSettingService.create(payload);
    res.status(201).json(toSuccess("Setting created", created));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const updateAppSetting = async (req: Request, res: Response) => {
  const parsed = appSettingUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  const updates = parsed.data;
  if (Object.keys(updates).length === 0) {
    return res.status(400).json(toError("No fields provided for update"));
  }

  try {
    const id = parseNumericParam(req.params.id, "app setting id");
    const updated = await appSettingService.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
    res.json(toSuccess("Setting updated", updated));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const deleteAppSetting = async (req: Request, res: Response) => {
  try {
    const id = parseNumericParam(req.params.id, "app setting id");
    const removed = await appSettingService.delete(id);
    res.json(toSuccess("Setting deleted", removed));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};
