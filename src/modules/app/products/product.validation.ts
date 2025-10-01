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

export const productCreateSchema = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative(),
  inventory: z.number().int().nonnegative(),
  status: z.string().min(1),
  category: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().optional(),
  brand: z.string().optional(),
  barcode: z.string().optional(),
  featured: z.boolean().optional(),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  variants: z.array(variantSchema).optional(),
  dimensions: dimensionsSchema.optional(),
  shipping: shippingSchema.optional(),
  seo: seoSchema.optional(),
});

export const productUpdateSchema = productCreateSchema.partial();