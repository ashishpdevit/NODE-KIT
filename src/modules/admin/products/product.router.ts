import { Router } from "express";

import { createProduct, deleteProduct, getProduct, listProducts, updateProduct } from "./product.controller";
import { uploadMultiple } from "@/core/middlewares/upload";

export const adminProductRouter = Router();

adminProductRouter.get("/", listProducts);
adminProductRouter.post("/", uploadMultiple("images", 10), createProduct); // Accept multiple image files
adminProductRouter.get("/:id", getProduct);
adminProductRouter.put("/:id", uploadMultiple("images", 10), updateProduct); // Also for updates
adminProductRouter.delete("/:id", deleteProduct);
