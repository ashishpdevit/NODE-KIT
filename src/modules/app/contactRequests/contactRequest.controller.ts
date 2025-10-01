import type { Request, Response } from "express";

import { toError, toSuccess } from "@/core/utils/httpResponse";
import { handlePrismaError } from "@/core/utils/prismaError";
import { parseNumericParam } from "@/core/utils/requestHelpers";

import { contactRequestService } from "./contactRequest.service";
import { contactRequestCreateSchema } from "./contactRequest.validation";

export const listContactRequests = async (req: Request, res: Response) => {
  const since = typeof req.query.since === "string" ? new Date(req.query.since) : undefined;
  const data = await contactRequestService.list(
    since && !Number.isNaN(since.getTime()) ? since : undefined
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
    res.status(201).json(toSuccess("Contact request submitted", created));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};
