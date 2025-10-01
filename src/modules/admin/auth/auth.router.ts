import { Router } from "express";

import { adminAuth } from "@/core/middlewares/adminAuth";

import { getAdminProfile, loginAdmin, updateAdminPassword } from "./auth.controller";

export const adminAuthRouter = Router();

adminAuthRouter.post("/login", loginAdmin);
adminAuthRouter.get("/profile", adminAuth, getAdminProfile);
adminAuthRouter.patch("/password", adminAuth, updateAdminPassword);
