import type { Request, Response } from "express";

import { toError, toSuccess } from "@/core/utils/httpResponse";
import { handlePrismaError } from "@/core/utils/prismaError";
import { parseNumericParam } from "@/core/utils/requestHelpers";
import { parseListQueryParams } from "@/core/utils/pagination";

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
  try {
    const { pagination, sort, search } = parseListQueryParams(
      req,
      ["createdAt", "updatedAt", "name", "price", "inventory", "category", "status"],
      ["name", "sku", "category", "brand"]
    );

    // Additional filters
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const tag = typeof req.query.tag === "string" ? req.query.tag : undefined;

    const result = await productService.listPaginated({
      pagination,
      sort,
      search,
      filters: { status, category, tag },
    });

    res.json({
      status: true,
      message: "Products fetched successfully",
      ...result,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json(toError("Failed to fetch products"));
  }
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
  // Remove 'images' from body if present (files come through req.files, not req.body)
  const bodyWithoutFiles = { ...req.body };
  delete bodyWithoutFiles.images;

  const parsed = productCreateSchema.safeParse(bodyWithoutFiles);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  const payload = buildCreatePayload(parsed.data);
  
  // Get uploaded files (if any)
  const files = req.files as Express.Multer.File[] | undefined;

  try {
    const created = await productService.create(payload as any, files);
    res.status(201).json(toSuccess("Product created", created));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  // Remove 'images' from body if present (files come through req.files, not req.body)
  const bodyWithoutFiles = { ...req.body };
  delete bodyWithoutFiles.images;

  const parsed = productUpdateSchema.safeParse(bodyWithoutFiles);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  const updates = parsed.data;
  if (Object.keys(updates).length === 0 && !req.files) {
    return res.status(400).json(toError("No fields provided for update"));
  }

  // Get uploaded files (if any)
  const files = req.files as Express.Multer.File[] | undefined;

  try {
    const id = parseNumericParam(req.params.id, "product id");
    const updated = await productService.update(id, buildUpdatePayload(updates) as any, files);
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

