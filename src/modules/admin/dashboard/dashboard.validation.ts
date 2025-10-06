import { z } from "zod";

// Validation schemas for dashboard query parameters
export const dashboardQuerySchema = z.object({
  limit: z.string().optional().transform((val) => {
    if (!val) return undefined;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) || parsed < 1 || parsed > 100 ? undefined : parsed;
  }),
  threshold: z.string().optional().transform((val) => {
    if (!val) return undefined;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) || parsed < 0 ? undefined : parsed;
  }),
});

export type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>;

// Validation for date range queries (for future use)
export const dateRangeSchema = z.object({
  startDate: z.string().optional().transform((val) => {
    if (!val) return undefined;
    const date = new Date(val);
    return isNaN(date.getTime()) ? undefined : date;
  }),
  endDate: z.string().optional().transform((val) => {
    if (!val) return undefined;
    const date = new Date(val);
    return isNaN(date.getTime()) ? undefined : date;
  }),
});

export type DateRangeInput = z.infer<typeof dateRangeSchema>;

// Validation for dashboard filter options
export const dashboardFilterSchema = z.object({
  period: z.enum(["7d", "30d", "90d", "1y", "all"]).optional().default("30d"),
  status: z.string().optional(),
  category: z.string().optional(),
});

export type DashboardFilterInput = z.infer<typeof dashboardFilterSchema>;
