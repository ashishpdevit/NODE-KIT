import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
