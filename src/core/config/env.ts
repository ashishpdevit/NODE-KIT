import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().min(0).default(3000),
  APP_NAME: z.string().default("Node Starter Kit"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  APP_API_KEY: z
    .string()
    .min(16, "APP_API_KEY must be at least 16 characters")
    .default("local-dev-app-api-key"),
  APP_JWT_SECRET: z
    .string()
    .min(32, "APP_JWT_SECRET must be at least 32 characters")
    .default("change-me-app-jwt-secret-change-me"),
  APP_JWT_EXPIRES_IN: z.string().default("15m"),
  ADMIN_JWT_SECRET: z
    .string()
    .min(32, "ADMIN_JWT_SECRET must be at least 32 characters")
    .default("change-me-admin-jwt-secret-change-me"),
  ADMIN_JWT_EXPIRES_IN: z.string().default("30m"),
  APP_PASSWORD_RESET_TOKEN_TTL_MINUTES: z
    .coerce.number()
    .int()
    .positive()
    .default(30),
});

export const env = envSchema.parse(process.env);

export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
export const isDevelopment = env.NODE_ENV === "development";
