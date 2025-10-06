import { Router } from "express";

import {
  createOrder,
  deleteOrder,
  getOrder,
  listOrders,
  updateOrder,
} from "./order.controller";

export const adminOrderRouter = Router();

adminOrderRouter.get("/", listOrders);
adminOrderRouter.post("/", createOrder);
adminOrderRouter.get("/:id", getOrder);
adminOrderRouter.put("/:id", updateOrder);
adminOrderRouter.delete("/:id", deleteOrder);