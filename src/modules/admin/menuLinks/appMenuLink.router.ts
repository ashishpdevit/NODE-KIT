import { Router } from "express";

import {
  createAppMenuLink,
  deleteAppMenuLink,
  getAppMenuLink,
  listAppMenuLinks,
  updateAppMenuLink,
} from "./appMenuLink.controller";

export const appMenuLinkRouter = Router();

appMenuLinkRouter.get("/", listAppMenuLinks);
appMenuLinkRouter.post("/", createAppMenuLink);
appMenuLinkRouter.get("/:id", getAppMenuLink);
appMenuLinkRouter.put("/:id", updateAppMenuLink);
appMenuLinkRouter.delete("/:id", deleteAppMenuLink);