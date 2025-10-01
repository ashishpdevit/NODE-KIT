import { Router } from "express";

import { createProduct, deleteProduct, getProduct, listProducts, updateProduct } from "./product.controller";

export const adminProductRouter = Router();

adminProductRouter.get("/", listProducts);
adminProductRouter.post("/", createProduct);
adminProductRouter.get("/:id", getProduct);
adminProductRouter.put("/:id", updateProduct);
adminProductRouter.delete("/:id", deleteProduct);
