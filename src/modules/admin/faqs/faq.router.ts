import { Router } from "express";

import { createFaq, deleteFaq, getFaq, listFaqs, updateFaq } from "./faq.controller";

export const adminFaqRouter = Router();

adminFaqRouter.get("/", listFaqs);
adminFaqRouter.post("/", createFaq);
adminFaqRouter.get("/:id", getFaq);
adminFaqRouter.put("/:id", updateFaq);
adminFaqRouter.delete("/:id", deleteFaq);
