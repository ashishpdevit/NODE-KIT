import { z } from "zod";

export const orderCreateSchema = z.object({
  id: z.string().min(1).optional(),
  customerName: z.string().min(1),
  customerId: z.number().int().positive().optional(),
  total: z.number().nonnegative(),
  status: z.string().min(1),
  date: z.string().datetime().optional(),
});

export const orderUpdateSchema = orderCreateSchema.partial();