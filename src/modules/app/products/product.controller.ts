import type { Request, Response } from "express";

import { toError, toSuccess } from "@/core/utils/httpResponse";
import { handlePrismaError } from "@/core/utils/prismaError";
import { parseNumericParam } from "@/core/utils/requestHelpers";

import { productService } from "./product.service";

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
