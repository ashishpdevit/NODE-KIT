import { z } from "zod";

export const notificationStatusSchema = z.object({
  read: z.boolean(),
});

export const notificationCreateSchema = z.object({
  user_id: z.number().int().positive(),
  user_type: z.string().default("user"),
  title: z.string().min(1),
  message: z.string().min(1),
  read: z.boolean().default(false),
});

export const notificationUpdateSchema = notificationCreateSchema.partial();
