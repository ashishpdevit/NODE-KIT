import { Router } from "express";

import {
  createAdmin,
  deleteAdmin,
  getAdmin,
  listAdmins,
  updateAdmin,
  toggleAdminStatus,
} from "./admin.controller";

export const adminRouter = Router();

adminRouter.get("/", listAdmins);
adminRouter.post("/", createAdmin);
adminRouter.get("/:id", getAdmin);
adminRouter.put("/:id", updateAdmin);
adminRouter.patch("/:id/toggle-status", toggleAdminStatus);
adminRouter.delete("/:id", deleteAdmin);