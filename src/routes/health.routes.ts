import { Router } from "express";
import { toSuccess } from "@/core/utils/httpResponse";
import { queueWorker } from "@/core/services/queueWorker";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json(
    toSuccess("OK", {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    })
  );
});

healthRouter.get("/health/queues", async (_req, res) => {
  try {
    const queueStats = await queueWorker.getStats();
    res.json(
      toSuccess("Queue status retrieved", {
        queues: queueStats,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get queue status",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});