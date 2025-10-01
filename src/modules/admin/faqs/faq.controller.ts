import type { Request, Response } from "express";

import { toError, toSuccess } from "@/core/utils/httpResponse";
import { handlePrismaError } from "@/core/utils/prismaError";
import { parseNumericParam } from "@/core/utils/requestHelpers";

import { faqService } from "@/modules/app/faqs/faq.service";
import { faqCreateSchema, faqUpdateSchema } from "@/modules/app/faqs/faq.validation";

export const listFaqs = async (req: Request, res: Response) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const type = typeof req.query.type === "string" ? req.query.type : undefined;

  const faqs = await faqService.list({ status, type });
  res.json(toSuccess("FAQs fetched", faqs));
};

export const getFaq = async (req: Request, res: Response) => {
  try {
    const id = parseNumericParam(req.params.id, "faq id");
    const faq = await faqService.get(id);
    if (!faq) {
      return res.status(404).json(toError("FAQ not found"));
    }
    res.json(toSuccess("FAQ fetched", faq));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid")) {
      return res.status(400).json(toError(error.message));
    }
    return handlePrismaError(res, error);
  }
};

export const createFaq = async (req: Request, res: Response) => {
  const parsed = faqCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  try {
    const created = await faqService.create(parsed.data as any);
    res.status(201).json(toSuccess("FAQ created", created));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const updateFaq = async (req: Request, res: Response) => {
  const parsed = faqUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  const updates = parsed.data;
  if (Object.keys(updates).length === 0) {
    return res.status(400).json(toError("No fields provided for update"));
  }

  try {
    const id = parseNumericParam(req.params.id, "faq id");
    const updated = await faqService.update(id, updates as any);
    res.json(toSuccess("FAQ updated", updated));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const deleteFaq = async (req: Request, res: Response) => {
  try {
    const id = parseNumericParam(req.params.id, "faq id");
    const removed = await faqService.delete(id);
    res.json(toSuccess("FAQ deleted", removed));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};
