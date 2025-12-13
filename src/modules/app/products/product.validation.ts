import { z } from "zod";

const variantSchema = z.object({
  size: z.string().optional(),
  color: z.string().optional(),
  price: z.number().optional(),
  available: z.boolean().optional(),
  onHand: z.number().int().optional(),
});

const dimensionsSchema = z.object({
  weight: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  depth: z.number().optional(),
});

const shippingSchema = z.object({
  method: z.string().optional(),
  price: z.number().optional(),
  freeAbove: z.number().optional(),
  estimated: z.string().optional(),
});

const seoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

// Helper to parse JSON strings from form-data
const parseJsonField = <T>(value: unknown, fallback: T): T => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return (value as T) ?? fallback;
};

export const productCreateSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().nonnegative(), // Coerce string to number for form-data
  inventory: z.coerce.number().int().nonnegative(), // Coerce string to number for form-data
  status: z.string().min(1),
  category: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().optional(),
  brand: z.string().optional(),
  barcode: z.string().optional(),
  featured: z.union([z.boolean(), z.string()]).optional().transform((val) => {
    if (val === undefined || val === null) return undefined;
    if (typeof val === "boolean") return val;
    return val === "true" || val === "1";
  }), // Handle form-data boolean (can be string "true"/"false" or boolean)
  images: z.union([z.array(z.string()), z.string()]).optional().transform((val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return parseJsonField<string[]>(val, []);
  }),
  tags: z.union([z.array(z.string()), z.string()]).optional().transform((val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return parseJsonField<string[]>(val, []);
  }),
  variants: z.union([z.array(variantSchema), z.string()]).optional().transform((val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return parseJsonField<any[]>(val, []);
  }),
  dimensions: z.union([dimensionsSchema, z.string()]).optional().transform((val) => {
    if (!val) return null;
    if (typeof val === "object") return val;
    return parseJsonField<Record<string, unknown> | null>(val, null);
  }),
  shipping: z.union([shippingSchema, z.string()]).optional().transform((val) => {
    if (!val) return null;
    if (typeof val === "object") return val;
    return parseJsonField<Record<string, unknown> | null>(val, null);
  }),
  seo: z.union([seoSchema, z.string()]).optional().transform((val) => {
    if (!val) return null;
    if (typeof val === "object") return val;
    return parseJsonField<Record<string, unknown> | null>(val, null);
  }),
});

export const productUpdateSchema = productCreateSchema.partial();