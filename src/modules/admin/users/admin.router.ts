import { Router } from "express";

import {
  createAdmin,
  deleteAdmin,
  getAdmin,
  listAdmins,
  updateAdmin,
} from "./admin.controller";

export const adminRouter = Router();

adminRouter.get("/", listAdmins);
adminRouter.post("/", createAdmin);
adminRouter.get("/:id", getAdmin);
adminRouter.put("/:id", updateAdmin);
adminRouter.delete("/:id", deleteAdmin);