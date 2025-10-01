import { Router } from "express";

import { adminRoutes } from "./admin.routes";
import { appRoutes } from "./app.routes";
import { sharedRoutes } from "./shared.routes";

export const apiRouter = Router();

apiRouter.use(sharedRoutes);
apiRouter.use("/admin", adminRoutes);
apiRouter.use("/app", appRoutes);
