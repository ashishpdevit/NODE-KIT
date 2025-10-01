import { z } from "zod";

const localizedSchema = z.record(z.string());

export const faqCreateSchema = z.object({
  question: localizedSchema,
  answer: localizedSchema,
  type: z.string().min(1),
  status: z.string().min(1),
});

export const faqUpdateSchema = faqCreateSchema.partial();