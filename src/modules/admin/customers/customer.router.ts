import { Router } from "express";

import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
} from "./customer.controller";

export const adminCustomerRouter = Router();

adminCustomerRouter.get("/", listCustomers);
adminCustomerRouter.post("/", createCustomer);
adminCustomerRouter.get("/:id", getCustomer);
adminCustomerRouter.put("/:id", updateCustomer);
adminCustomerRouter.delete("/:id", deleteCustomer);