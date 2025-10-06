import { Router } from "express";

import { adminAuth } from "@/core/middlewares/adminAuth";

import { getAdminProfile, loginAdmin, logoutAdmin, updateAdminPassword, forgotAdminPassword, resetAdminPassword } from "./auth.controller";

export const adminAuthRouter = Router();

adminAuthRouter.post("/login", loginAdmin);
adminAuthRouter.post("/logout", adminAuth, logoutAdmin);
adminAuthRouter.get("/profile", adminAuth, getAdminProfile);
adminAuthRouter.patch("/password", adminAuth, updateAdminPassword);
adminAuthRouter.post("/forgot-password", forgotAdminPassword);
adminAuthRouter.post("/reset-password", resetAdminPassword);
