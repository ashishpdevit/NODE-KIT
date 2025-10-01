import { z } from "zod";

export const appSettingCreateSchema = z.object({
  label: z.string().min(1),
  version: z.string().min(1),
  forceUpdates: z.number().int().nonnegative().optional(),
  maintenance: z.number().int().nonnegative().optional(),
});

export const appSettingUpdateSchema = appSettingCreateSchema.partial();