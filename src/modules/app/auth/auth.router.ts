import { Router } from "express";

import { apiKeyAuth } from "@/core/middlewares/apiKeyAuth";
import { appAuth } from "@/core/middlewares/appAuth";

import {
  forgotAppUserPassword,
  getAppUserProfile,
  loginAppUser,
  logoutAppUser,
  registerAppUser,
  resetAppUserPassword,
  updateAppUserProfile,
} from "./auth.controller";

export const authRouter = Router();

authRouter.use(apiKeyAuth);

authRouter.post("/register", registerAppUser);
authRouter.post("/login", loginAppUser);
authRouter.post("/forgot-password", forgotAppUserPassword);
authRouter.post("/reset-password", resetAppUserPassword);

authRouter.get("/profile", appAuth, getAppUserProfile);
authRouter.patch("/profile", appAuth, updateAppUserProfile);
authRouter.post("/logout", appAuth, logoutAppUser);
