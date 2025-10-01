import { Router } from "express";

import {
  createContactRequest,
  deleteContactRequest,
  getContactRequest,
  listContactRequests,
  updateContactRequest,
} from "./contactRequest.controller";

export const adminContactRequestRouter = Router();

adminContactRequestRouter.get("/", listContactRequests);
adminContactRequestRouter.post("/", createContactRequest);
adminContactRequestRouter.get("/:id", getContactRequest);
adminContactRequestRouter.put("/:id", updateContactRequest);
adminContactRequestRouter.delete("/:id", deleteContactRequest);
