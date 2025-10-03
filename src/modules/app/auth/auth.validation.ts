import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must be at most 128 characters long");

const deviceTokenSchema = z
  .string()
  .trim()
  .min(10, "Device token looks too short")
  .max(512, "Device token looks too long");

const optionalDeviceToken = deviceTokenSchema.optional();
const optionalNotificationsFlag = z.coerce.boolean().optional();
const optionalLocale = z.string().trim().min(2).max(10).optional();

const registerBaseSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: passwordSchema,
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .max(120, "Name must be at most 120 characters long")
    .optional(),
  phone: z
    .string()
    .trim()
    .min(8, "Phone number must be at least 8 characters long")
    .max(20, "Phone number must be at most 20 characters long")
    .optional(),
  locale: optionalLocale,
  device_token: optionalDeviceToken,
  notifications_enabled: optionalNotificationsFlag,
});

export const registerSchema = registerBaseSchema.transform(
  ({ device_token, notifications_enabled, locale, ...rest }) => ({
    ...rest,
    locale,
    deviceToken: device_token,
    notificationsEnabled: notifications_enabled,
  }),
);

const loginBaseSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: passwordSchema,
  locale: optionalLocale,
  device_token: optionalDeviceToken,
  notifications_enabled: optionalNotificationsFlag,
});

export const loginSchema = loginBaseSchema.transform(
  ({ device_token, notifications_enabled, locale, ...rest }) => ({
    ...rest,
    locale,
    deviceToken: device_token,
    notificationsEnabled: notifications_enabled,
  }),
);

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16, "Reset token is invalid"),
  password: passwordSchema,
});

const profileUpdateBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .max(120, "Name must be at most 120 characters long")
    .optional(),
  phone: z
    .string()
    .trim()
    .min(8, "Phone number must be at least 8 characters long")
    .max(20, "Phone number must be at most 20 characters long")
    .optional(),
  locale: optionalLocale,
  device_token: optionalDeviceToken,
  notifications_enabled: optionalNotificationsFlag,
});

export const profileUpdateSchema = profileUpdateBaseSchema.transform(
  ({ device_token, notifications_enabled, locale, ...rest }) => ({
    ...rest,
    locale,
    deviceToken: device_token,
    notificationsEnabled: notifications_enabled,
  }),
);

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
