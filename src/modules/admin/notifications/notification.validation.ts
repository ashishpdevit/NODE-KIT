import { z } from "zod";

export const notificationCreateSchema = z.object({
  user_id: z.number().int().positive(),
  user_type: z.string().default("user"),
  title: z.string().min(1),
  message: z.string().min(1),
  read: z.boolean().default(false),
});

export const notificationUpdateSchema = notificationCreateSchema.partial();

export const notificationForUserSchema = z.object({
  user_id: z.number().int().positive(),
  title: z.string().min(1),
  message: z.string().min(1),
  user_type: z.string().default("user"),
});

export const notificationForAllUsersSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  user_type: z.string().default("user"),
});
