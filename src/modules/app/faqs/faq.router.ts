import { Router } from "express";

import { getFaq, listFaqs } from "./faq.controller";

export const faqRouter = Router();

faqRouter.get("/", listFaqs);
faqRouter.get("/:id", getFaq);
