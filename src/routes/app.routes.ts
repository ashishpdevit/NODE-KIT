import { Router } from "express";

import {
  authRouter,
  contactRequestRouter,
  customerRouter,
  faqRouter,
  initRouter,
  notificationRouter,
  orderRouter,
  productRouter,
} from "@/modules/app";

export const appRoutes = Router();

appRoutes.use("/init", initRouter);
appRoutes.use("/auth", authRouter);
appRoutes.use("/customers", customerRouter);
appRoutes.use("/orders", orderRouter);
appRoutes.use("/products", productRouter);
appRoutes.use("/faqs", faqRouter);
appRoutes.use("/notifications", notificationRouter);
appRoutes.use("/contact-requests", contactRequestRouter);
