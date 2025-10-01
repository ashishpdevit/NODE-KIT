import type { Request, Response } from "express";

import { toError, toSuccess } from "@/core/utils/httpResponse";
import { handlePrismaError } from "@/core/utils/prismaError";
import { parseNumericParam } from "@/core/utils/requestHelpers";

import { contactRequestService } from "@/modules/app/contactRequests/contactRequest.service";
import { contactRequestCreateSchema } from "@/modules/app/contactRequests/contactRequest.validation";
import { contactRequestAdminUpdateSchema } from "./contactRequest.validation";

export const listContactRequests = async (req: Request, res: Response) => {
  const since = typeof req.query.since === "string" ? new Date(req.query.since) : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;

  const data = await contactRequestService.list(
    since && !Number.isNaN(since.getTime()) ? since : undefined,
    status
  );
  res.json(toSuccess("Contact requests fetched", data));
};

export const getContactRequest = async (req: Request, res: Response) => {
  try {
    const id = parseNumericParam(req.params.id, "contact request id");
    const request = await contactRequestService.get(id);
    if (!request) {
      return res.status(404).json(toError("Contact request not found"));
    }
    res.json(toSuccess("Contact request fetched", request));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid")) {
      return res.status(400).json(toError(error.message));
    }
    return handlePrismaError(res, error);
  }
};

export const createContactRequest = async (req: Request, res: Response) => {
  const parsed = contactRequestCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  const payload = {
    ...parsed.data,
    createdAt: parsed.data.createdAt ? new Date(parsed.data.createdAt) : new Date(),
  };

  try {
    const created = await contactRequestService.create(payload);
    res.status(201).json(toSuccess("Contact request created", created));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const updateContactRequest = async (req: Request, res: Response) => {
  const parsed = contactRequestAdminUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  const updates = parsed.data;
  if (Object.keys(updates).length === 0) {
    return res.status(400).json(toError("No fields provided for update"));
  }

  try {
    const id = parseNumericParam(req.params.id, "contact request id");
    const updated = await contactRequestService.update(id, {
      ...(updates.status ? { status: updates.status } : {}),
      ...(updates.adminReply ? { adminReply: updates.adminReply } : {}),
    });
    res.json(toSuccess("Contact request updated", updated));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const deleteContactRequest = async (req: Request, res: Response) => {
  try {
    const id = parseNumericParam(req.params.id, "contact request id");
    const removed = await contactRequestService.delete(id);
    res.json(toSuccess("Contact request deleted", removed));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};
