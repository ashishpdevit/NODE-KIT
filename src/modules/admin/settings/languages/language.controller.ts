import type { Request, Response } from "express";

import { toError, toSuccess } from "@/core/utils/httpResponse";
import { handlePrismaError } from "@/core/utils/prismaError";

import { languageService } from "./language.service";
import { languageCreateSchema, languageUpdateSchema } from "./language.validation";

export const listLanguages = async (_req: Request, res: Response) => {
  const languages = await languageService.list();
  res.json(toSuccess("Languages fetched", languages));
};

export const getLanguage = async (req: Request, res: Response) => {
  const language = await languageService.get(req.params.code.toLowerCase());
  if (!language) {
    return res.status(404).json(toError("Language not found"));
  }
  res.json(toSuccess("Language fetched", language));
};

export const createLanguage = async (req: Request, res: Response) => {
  const parsed = languageCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  const payload = {
    code: parsed.data.code.toLowerCase(),
    label: parsed.data.label,
  };

  try {
    const created = await languageService.create(payload);
    res.status(201).json(toSuccess("Language created", created));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const updateLanguage = async (req: Request, res: Response) => {
  const parsed = languageUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  const updates = parsed.data;
  if (Object.keys(updates).length === 0) {
    return res.status(400).json(toError("No fields provided for update"));
  }

  try {
    const code = req.params.code.toLowerCase();
    const updated = await languageService.update(code, updates);
    res.json(toSuccess("Language updated", updated));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const deleteLanguage = async (req: Request, res: Response) => {
  try {
    const removed = await languageService.delete(req.params.code.toLowerCase());
    res.json(toSuccess("Language deleted", removed));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};