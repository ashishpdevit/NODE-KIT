import type { Request, Response } from "express";

import { toError, toSuccess } from "@/core/utils/httpResponse";
import { handlePrismaError } from "@/core/utils/prismaError";
import { parseNumericParam } from "@/core/utils/requestHelpers";

import { faqService } from "./faq.service";

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
