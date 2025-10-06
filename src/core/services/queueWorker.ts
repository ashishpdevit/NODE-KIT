import { logger } from "@/core/utils/logger";
import { emailQueueService } from "./emailQueue";
import { pushQueueService } from "./pushQueue";

export const queueWorker = {
  async initialize() {
    try {
      logger.info("Initializing queue workers...");

      // Initialize email queue processor
      await emailQueueService.processJobs();

      // Initialize push notification queue processor
      await pushQueueService.processJobs();

      logger.info("Queue workers initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize queue workers", error);
      throw error;
    }
  },

  async getStats() {
    try {
      const [emailStats, pushStats] = await Promise.all([
        emailQueueService.getStats(),
        pushQueueService.getStats(),
      ]);

      return {
        email: emailStats,
        push: pushStats,
      };
    } catch (error) {
      logger.error("Failed to get queue stats", error);
      return {
        email: { waiting: 0, active: 0, completed: 0, failed: 0 },
        push: { waiting: 0, active: 0, completed: 0, failed: 0 },
      };
    }
  },

  async clearQueues() {
    try {
      await Promise.all([
        emailQueueService.clear(),
        pushQueueService.clear(),
      ]);
      logger.info("All queues cleared");
    } catch (error) {
      logger.error("Failed to clear queues", error);
      throw error;
    }
  },
};
