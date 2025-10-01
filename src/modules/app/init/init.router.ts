import { Router } from "express";

import { apiKeyAuth } from "@/core/middlewares/apiKeyAuth";
import { initializeApp } from "./init.controller";

export const initRouter = Router();

initRouter.use(apiKeyAuth);

initRouter.get("/", initializeApp);

