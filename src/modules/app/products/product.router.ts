import { Router } from "express";

import { getProduct, listProducts } from "./product.controller";

export const productRouter = Router();

productRouter.get("/", listProducts);
productRouter.get("/:id", getProduct);
