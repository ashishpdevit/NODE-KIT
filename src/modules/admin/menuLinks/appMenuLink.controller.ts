import type { Request, Response } from "express";

import { toError, toSuccess } from "@/core/utils/httpResponse";
import { handlePrismaError } from "@/core/utils/prismaError";
import { parseNumericParam } from "@/core/utils/requestHelpers";

import { appMenuLinkService } from "./appMenuLink.service";
import { appMenuLinkCreateSchema, appMenuLinkUpdateSchema } from "./appMenuLink.validation";

export const listAppMenuLinks = async (req: Request, res: Response) => {
  const audience = typeof req.query.for === "string" ? req.query.for : undefined;
  const type = typeof req.query.type === "string" ? req.query.type : undefined;

  const links = await appMenuLinkService.list({ audience, type });
  res.json(toSuccess("App menu links fetched", links));
};

export const getAppMenuLink = async (req: Request, res: Response) => {
  try {
    const id = parseNumericParam(req.params.id, "menu link id");
    const link = await appMenuLinkService.get(id);
    if (!link) {
      return res.status(404).json(toError("Menu link not found"));
    }
    res.json(toSuccess("App menu link fetched", link));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid")) {
      return res.status(400).json(toError(error.message));
    }
    return handlePrismaError(res, error);
  }
};

export const createAppMenuLink = async (req: Request, res: Response) => {
  const parsed = appMenuLinkCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  try {
    const created = await appMenuLinkService.create(parsed.data);
    res.status(201).json(toSuccess("Menu link created", created));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const updateAppMenuLink = async (req: Request, res: Response) => {
  const parsed = appMenuLinkUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  const updates = parsed.data;
  if (Object.keys(updates).length === 0) {
    return res.status(400).json(toError("No fields provided for update"));
  }

  try {
    const id = parseNumericParam(req.params.id, "menu link id");
    const updated = await appMenuLinkService.update(id, updates);
    res.json(toSuccess("Menu link updated", updated));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const deleteAppMenuLink = async (req: Request, res: Response) => {
  try {
    const id = parseNumericParam(req.params.id, "menu link id");
    const removed = await appMenuLinkService.delete(id);
    res.json(toSuccess("Menu link deleted", removed));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};