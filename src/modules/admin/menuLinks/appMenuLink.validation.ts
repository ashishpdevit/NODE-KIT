import { z } from "zod";

export const appMenuLinkCreateSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  audience: z.string().min(1),
  link: z.string().optional(),
  content: z.string().optional(),
});

export const appMenuLinkUpdateSchema = appMenuLinkCreateSchema.partial();

export type AppMenuLinkCreateInput = z.infer<typeof appMenuLinkCreateSchema>;