import { Router } from "express";

import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
} from "./customer.controller";

export const customerRouter = Router();

customerRouter.get("/", listCustomers);
customerRouter.post("/", createCustomer);
customerRouter.get("/:id", getCustomer);
customerRouter.put("/:id", updateCustomer);
customerRouter.delete("/:id", deleteCustomer);