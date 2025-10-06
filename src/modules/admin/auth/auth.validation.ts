import { z } from "zod";

const deviceTokenSchema = z
  .string()
  .trim()
  .min(10, "Device token looks too short")
  .max(512, "Device token looks too long");

const adminLoginBaseSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  device_token: deviceTokenSchema.optional(),
  notifications_enabled: z.coerce.boolean().optional(),
});

export const adminLoginSchema = adminLoginBaseSchema.transform(
  ({ device_token, notifications_enabled, ...rest }) => ({
    ...rest,
    deviceToken: device_token,
    notificationsEnabled: notifications_enabled,
  }),
);

export const adminForgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const adminResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type AdminForgotPasswordInput = z.infer<typeof adminForgotPasswordSchema>;
export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;
