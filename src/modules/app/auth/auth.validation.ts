import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must be at most 128 characters long");

export const registerSchema = z.object({
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
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16, "Reset token is invalid"),
  password: passwordSchema,
});

export const profileUpdateSchema = z.object({
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
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
