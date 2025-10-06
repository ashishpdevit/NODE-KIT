import { Router } from "express";

import { adminAuth } from "@/core/middlewares/adminAuth";
import {
  adminAuthRouter,
  adminRouter,
  adminContactRequestRouter,
  adminFaqRouter,
  adminNotificationRouter,
  adminOrderRouter,
  adminProductRouter,
  appMenuLinkRouter,
  appSettingRouter,
  dashboardRouter,
  languageRouter,
} from "@/modules/admin";

export const adminRoutes = Router();

adminRoutes.use("/auth", adminAuthRouter);

adminRoutes.use(adminAuth);

adminRoutes.use("/dashboard", dashboardRouter);
adminRoutes.use("/users", adminRouter);
adminRoutes.use("/menu-links", appMenuLinkRouter);
adminRoutes.use("/settings/app", appSettingRouter);
adminRoutes.use("/settings/languages", languageRouter);
adminRoutes.use("/faqs", adminFaqRouter);
adminRoutes.use("/contact-requests", adminContactRequestRouter);
adminRoutes.use("/notifications", adminNotificationRouter);
adminRoutes.use("/products", adminProductRouter);
adminRoutes.use("/orders", adminOrderRouter);
