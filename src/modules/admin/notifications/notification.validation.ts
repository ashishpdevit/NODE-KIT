import { z } from "zod";

const stringOrStringArray = z.union([z.string().min(1), z.array(z.string().min(1))]);

const emailTemplateSchema = z.object({
  id: z.string().min(1).default("master").optional(),
  locale: z.string().min(2).max(10).optional(),
  context: z.record(z.any()).optional(),
});

const emailPayloadSchema = z.object({
  to: stringOrStringArray.optional(),
  cc: stringOrStringArray.optional(),
  bcc: stringOrStringArray.optional(),
  subject: z.string().optional(),
  text: z.string().optional(),
  html: z.string().optional(),
  replyTo: z.string().optional(),
  template: emailTemplateSchema.optional(),
});

const pushPayloadSchema = z.object({
  tokens: stringOrStringArray.optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  data: z.record(z.any()).optional(),
  imageUrl: z.string().optional(),
});

const localizedEntrySchema = z.object({
  title: z.string().min(1).optional(),
  message: z.string().min(1).optional(),
  email: emailPayloadSchema.optional(),
  push: pushPayloadSchema.optional(),
});

const localizedContentSchema = z.record(z.string().min(2).max(10), localizedEntrySchema);

const metadataSchema = z.record(z.any()).optional();

export const notificationCreateSchema = z.object({
  user_id: z.number().int().positive(),
  user_type: z.string().default("user"),
  title: z.string().min(1),
  message: z.string().min(1),
  default_locale: z.string().min(2).max(10).default("en"),
  email: emailPayloadSchema.optional(),
  push: pushPayloadSchema.optional(),
  localized_content: localizedContentSchema.optional(),
  metadata: metadataSchema,
});

export const notificationUpdateSchema = notificationCreateSchema.partial();

export const notificationForUserSchema = z.object({
  user_id: z.number().int().positive(),
  title: z.string().min(1),
  message: z.string().min(1),
  user_type: z.string().default("user"),
  default_locale: z.string().min(2).max(10).default("en"),
  email: emailPayloadSchema.optional(),
  push: pushPayloadSchema.optional(),
  localized_content: localizedContentSchema.optional(),
  metadata: metadataSchema,
});

export const notificationForAllUsersSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  user_type: z.string().default("user"),
  default_locale: z.string().min(2).max(10).default("en"),
  email: emailPayloadSchema.optional(),
  push: pushPayloadSchema.optional(),
  localized_content: localizedContentSchema.optional(),
  metadata: metadataSchema,
});
