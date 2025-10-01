import { z } from "zod";

export const languageCreateSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
});

export const languageUpdateSchema = z.object({
  label: z.string().min(1).optional(),
});