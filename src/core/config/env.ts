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
  ADMIN_PASSWORD_RESET_TOKEN_TTL_MINUTES: z
    .coerce.number()
    .int()
    .positive()
    .default(30),
  ADMIN_PANEL_URL: z.string().url().optional(),
  APP_PASSWORD_RESET_TOKEN_TTL_MINUTES: z
    .coerce.number()
    .int()
    .positive()
    .default(30),
  MAIL_TRANSPORT: z.enum(["smtp", "json", "stub"]).default("json"),
  MAIL_FROM: z.string().email().default("no-reply@node-kit.local"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().min(1).optional().or(z.literal("")),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional().or(z.literal("")),
  FIREBASE_PRIVATE_KEY: z.string().optional().or(z.literal("")),
  // Queue Configuration
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().int().positive().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().int().min(0).optional(),
  REDIS_URL: z.string().url().optional(),
  EMAIL_QUEUE_CONCURRENCY: z.coerce.number().int().positive().optional(),
  PUSH_QUEUE_CONCURRENCY: z.coerce.number().int().positive().optional(),
  EMAIL_QUEUE_REMOVE_ON_COMPLETE: z.coerce.number().int().positive().optional(),
  EMAIL_QUEUE_REMOVE_ON_FAIL: z.coerce.number().int().positive().optional(),
  PUSH_QUEUE_REMOVE_ON_COMPLETE: z.coerce.number().int().positive().optional(),
  PUSH_QUEUE_REMOVE_ON_FAIL: z.coerce.number().int().positive().optional(),
  EMAIL_QUEUE_ATTEMPTS: z.coerce.number().int().positive().optional(),
  PUSH_QUEUE_ATTEMPTS: z.coerce.number().int().positive().optional(),
  // SMS Configuration
  SMS_PROVIDER: z.enum(["twilio", "vonage", "stub"]).default("stub"),
  SMS_FROM: z.string().optional(),
  // Twilio Configuration
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  // Vonage (Nexmo) Configuration
  VONAGE_API_KEY: z.string().optional(),
  VONAGE_API_SECRET: z.string().optional(),
  VONAGE_FROM: z.string().optional(),
  // SMS Queue Configuration
  SMS_QUEUE_CONCURRENCY: z.coerce.number().int().positive().optional(),
  SMS_QUEUE_REMOVE_ON_COMPLETE: z.coerce.number().int().positive().optional(),
  SMS_QUEUE_REMOVE_ON_FAIL: z.coerce.number().int().positive().optional(),
  SMS_QUEUE_ATTEMPTS: z.coerce.number().int().positive().optional(),
});

export const env = envSchema.parse(process.env);

export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
export const isDevelopment = env.NODE_ENV === "development";
