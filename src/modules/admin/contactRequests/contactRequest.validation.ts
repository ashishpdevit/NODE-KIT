import { z } from "zod";

export const contactRequestAdminUpdateSchema = z.object({
  status: z.string().min(1).optional(),
  adminReply: z.string().min(1).optional(),
});
