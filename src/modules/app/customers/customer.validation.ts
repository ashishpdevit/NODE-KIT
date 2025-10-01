import { z } from "zod";

export const customerCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: z.string().min(1).optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
});

export const customerUpdateSchema = customerCreateSchema.partial();