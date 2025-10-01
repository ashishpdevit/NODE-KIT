import { Router } from "express";

import {
  createAppSetting,
  deleteAppSetting,
  getAppSetting,
  listAppSettings,
  updateAppSetting,
} from "./appSetting.controller";

export const appSettingRouter = Router();

appSettingRouter.get("/", listAppSettings);
appSettingRouter.post("/", createAppSetting);
appSettingRouter.get("/:id", getAppSetting);
appSettingRouter.put("/:id", updateAppSetting);
appSettingRouter.delete("/:id", deleteAppSetting);