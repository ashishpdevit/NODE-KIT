import { z } from "zod";

export const initRequestSchema = z.object({
  appVersion: z.string().min(1, "App version is required"),
  type: z.string().min(1, "App type is required"),
});

