import { Router } from "express";

import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
} from "./customer.controller";
import { uploadSingle } from "@/core/middlewares/upload";

export const adminCustomerRouter = Router();

adminCustomerRouter.get("/", listCustomers);
adminCustomerRouter.post("/", uploadSingle("profilePicture"), createCustomer); // Accept single profile picture
adminCustomerRouter.get("/:id", getCustomer);
adminCustomerRouter.put("/:id", uploadSingle("profilePicture"), updateCustomer); // Also for updates
adminCustomerRouter.delete("/:id", deleteCustomer);