import { z } from "zod";

export const appMenuLinkCreateSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  audience: z.string().min(1),
  link: z.string().min(1),
});

export const appMenuLinkUpdateSchema = appMenuLinkCreateSchema.partial();