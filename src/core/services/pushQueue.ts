import { Job } from "bull";
import { pushClient, type PushPayload } from "@/core/lib/pushClient";
import { logger } from "@/core/utils/logger";
import { getPushQueue } from "@/core/lib/queue";

export type PushJobData = {
  payload: PushPayload;
  metadata?: {
    userId?: number;
    notificationId?: string;
    source?: string;
    userType?: string;
  };
};

export type PushJobResult = {
  success: boolean;
  successCount?: number;
  failureCount?: number;
  error?: string;
  responses?: Array<{
    messageId?: string | null;
    error?: string;
  }>;
};

const processPushJob = async (job: Job<PushJobData>): Promise<PushJobResult> => {
  const { payload, metadata } = job.data;
  
  logger.debug("Processing push notification job", {
    jobId: job.id,
    tokens: Array.isArray(payload.tokens) ? payload.tokens.length : 1,
    title: payload.title,
    userId: metadata?.userId,
    userType: metadata?.userType,
  });

  try {
    const result = await pushClient.send(payload);
    
    if (result.ok) {
      logger.info("Push notification sent successfully", {
        jobId: job.id,
        successCount: result.successCount,
        failureCount: result.failureCount,
        userId: metadata?.userId,
        userType: metadata?.userType,
      });
    } else {
      logger.warn("Push notification failed or was skipped", {
        jobId: job.id,
        skipped: result.skipped,
        error: result.error,
        userId: metadata?.userId,
        userType: metadata?.userType,
      });
    }

    return {
      success: result.ok,
      successCount: result.successCount,
      failureCount: result.failureCount,
      error: result.error ? String(result.error) : undefined,
      responses: result.responses,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error("Push notification job failed", {
      jobId: job.id,
      tokens: Array.isArray(payload.tokens) ? payload.tokens.length : 1,
      error: errorMessage,
      userId: metadata?.userId,
      userType: metadata?.userType,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
};

export const pushQueueService = {
  /**
   * Add a push notification job to the queue
   */
  async addPushJob(data: PushJobData, options: { delay?: number; priority?: number } = {}) {
    const queue = getPushQueue();
    
    const job = await queue.add("send-push", data, {
      delay: options.delay,
      priority: options.priority,
      removeOnComplete: 100,
      removeOnFail: 50,
    });

    logger.debug("Push notification job added to queue", {
      jobId: job.id,
      tokens: Array.isArray(data.payload.tokens) ? data.payload.tokens.length : 1,
      title: data.payload.title,
      userId: data.metadata?.userId,
    });

    return job;
  },

  /**
   * Process push notification jobs (called by queue worker)
   */
  async processJobs() {
    const queue = getPushQueue();
    
    // Type assertion for queue.process to handle both Bull Queue and InMemoryQueue
    (queue as any).process("send-push", 10, async (job: Job<PushJobData>) => {
      return processPushJob(job);
    });

    queue.on("completed", (job: Job<PushJobData>, result: PushJobResult) => {
      logger.debug("Push notification job completed", {
        jobId: job.id,
        success: result.success,
        successCount: result.successCount,
        failureCount: result.failureCount,
        userId: job.data.metadata?.userId,
      });
    });

    queue.on("failed", (job: Job<PushJobData> | undefined, error: Error) => {
      logger.error("Push notification job failed", {
        jobId: job?.id,
        error: error.message,
        userId: job?.data.metadata?.userId,
      });
    });

    queue.on("stalled", (jobId: string) => {
      logger.warn("Push notification job stalled", { jobId });
    });

    logger.info("Push notification queue processor initialized");
  },

  /**
   * Get queue statistics
   */
  async getStats() {
    const queue = getPushQueue();
    
    if ("getWaiting" in queue && "getActive" in queue && "getCompleted" in queue && "getFailed" in queue) {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
      };
    }

    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
    };
  },

  /**
   * Clear all jobs from the queue
   */
  async clear() {
    const queue = getPushQueue();
    
    if ("clean" in queue) {
      await queue.clean(0, "completed");
      await queue.clean(0, "failed");
      logger.info("Push notification queue cleared");
    }
  },
};
