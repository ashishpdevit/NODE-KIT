import { z } from "zod";

const notificationsFlag = z.coerce.boolean();

export const adminCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.string().min(1),
  status: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  notifications_enabled: notificationsFlag.optional(),
});

export const adminUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
  password: z.string().min(8, "Password must be at least 8 characters long").optional(),
  notifications_enabled: notificationsFlag.optional(),
});
