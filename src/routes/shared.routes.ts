import { Router } from "express";

import { rbacRouter } from "@/modules/shared";
import { exampleRouter } from "./example.routes";
import { healthRouter } from "./health.routes";

export const sharedRoutes = Router();

sharedRoutes.use(healthRouter);
sharedRoutes.use(exampleRouter);
sharedRoutes.use("/rbac", rbacRouter);
