import { Router } from "express";

import {
  createLanguage,
  deleteLanguage,
  getLanguage,
  listLanguages,
  updateLanguage,
} from "./language.controller";

export const languageRouter = Router();

languageRouter.get("/", listLanguages);
languageRouter.post("/", createLanguage);
languageRouter.get("/:code", getLanguage);
languageRouter.put("/:code", updateLanguage);
languageRouter.delete("/:code", deleteLanguage);