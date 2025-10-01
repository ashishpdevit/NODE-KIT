import { Router } from "express";

import {
  createOrder,
  deleteOrder,
  getOrder,
  listOrders,
  updateOrder,
} from "./order.controller";

export const orderRouter = Router();

orderRouter.get("/", listOrders);
orderRouter.post("/", createOrder);
orderRouter.get("/:id", getOrder);
orderRouter.put("/:id", updateOrder);
orderRouter.delete("/:id", deleteOrder);