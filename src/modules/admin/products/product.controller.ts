import type { Request, Response } from "express";

import { toError, toSuccess } from "@/core/utils/httpResponse";
import { handlePrismaError } from "@/core/utils/prismaError";
import { parseNumericParam } from "@/core/utils/requestHelpers";

import { productService } from "@/modules/app/products/product.service";
import { productCreateSchema, productUpdateSchema } from "@/modules/app/products/product.validation";

const buildCreatePayload = (data: Record<string, unknown>) => ({
  ...data,
  images: data.images ?? [],
  tags: data.tags ?? [],
  variants: data.variants ?? [],
});

const buildUpdatePayload = (data: Record<string, unknown>) => {
  const payload: Record<string, unknown> = { ...data };
  ["images", "tags", "variants", "dimensions", "shipping", "seo"].forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });
  return payload;
};

export const listProducts = async (req: Request, res: Response) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  const tag = typeof req.query.tag === "string" ? req.query.tag : undefined;

  const products = await productService.list({ status, category, tag });
  res.json(toSuccess("Products fetched", products));
};

export const getProduct = async (req: Request, res: Response) => {
  try {
    const id = parseNumericParam(req.params.id, "product id");
    const product = await productService.get(id);
    if (!product) {
      return res.status(404).json(toError("Product not found"));
    }
    res.json(toSuccess("Product fetched", product));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid")) {
      return res.status(400).json(toError(error.message));
    }
    return handlePrismaError(res, error);
  }
};

export const createProduct = async (req: Request, res: Response) => {
  const parsed = productCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  const payload = buildCreatePayload(parsed.data);

  try {
    const created = await productService.create(payload as any);
    res.status(201).json(toSuccess("Product created", created));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  const parsed = productUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  const updates = parsed.data;
  if (Object.keys(updates).length === 0) {
    return res.status(400).json(toError("No fields provided for update"));
  }

  try {
    const id = parseNumericParam(req.params.id, "product id");
    const updated = await productService.update(id, buildUpdatePayload(updates) as any);
    res.json(toSuccess("Product updated", updated));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = parseNumericParam(req.params.id, "product id");
    const removed = await productService.delete(id);
    res.json(toSuccess("Product deleted", removed));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

