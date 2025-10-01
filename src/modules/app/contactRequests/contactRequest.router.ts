import { Router } from "express";

import {
  createContactRequest,
  getContactRequest,
  listContactRequests,
} from "./contactRequest.controller";

export const contactRequestRouter = Router();

contactRequestRouter.get("/", listContactRequests);
contactRequestRouter.post("/", createContactRequest);
contactRequestRouter.get("/:id", getContactRequest);
