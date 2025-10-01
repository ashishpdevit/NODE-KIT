import { z } from "zod";

export const contactRequestCreateSchema = z.object({
  message: z.string().min(1),
  contact: z.string().min(1),
  createdAt: z.string().datetime().optional(),
});

export const contactRequestUpdateSchema = contactRequestCreateSchema.partial();