import { Router } from "express";
import { toSuccess } from "@/core/utils/httpResponse";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json(
    toSuccess("OK", {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    })
  );
});