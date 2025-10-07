import { Job } from "bull";
import { smsClient, type SmsPayload } from "@/core/lib/smsClient";
import { logger } from "@/core/utils/logger";
import { getSmsQueue } from "@/core/lib/queue";

export type SmsJobData = {
  payload: SmsPayload;
  metadata?: {
    userId?: number;
    notificationId?: string;
    source?: string;
    userType?: string;
  };
};

export type SmsJobResult = {
  success: boolean;
  successCount?: number;
  failureCount?: number;
  messageIds?: string[];
  error?: string;
};

const processSmsJob = async (job: Job<SmsJobData>): Promise<SmsJobResult> => {
  const { payload, metadata } = job.data;
  
  // Validate payload
  if (!payload || !payload.to || !payload.message) {
    const error = "SMS payload is missing or invalid - 'to' and 'message' fields are required";
    logger.error("Invalid SMS job payload", {
      jobId: job.id,
      payload,
      error,
    });
    return {
      success: false,
      error,
    };
  }
  
  logger.debug("Processing SMS job", {
    jobId: job.id,
    to: payload.to,
    messageLength: payload.message.length,
    userId: metadata?.userId,
    userType: metadata?.userType,
  });

  try {
    const result = await smsClient.send(payload);
    
    if (result.ok) {
      logger.info("SMS sent successfully", {
        jobId: job.id,
        successCount: result.successCount,
        failureCount: result.failureCount,
        messageIds: result.messageIds,
        userId: metadata?.userId,
        userType: metadata?.userType,
      });
    } else {
      logger.warn("SMS sending failed or was skipped", {
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
      messageIds: result.messageIds,
      error: result.error,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error("SMS job failed", {
      jobId: job.id,
      to: payload.to,
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

export const smsQueueService = {
  /**
   * Add an SMS job to the queue
   */
  async addSmsJob(data: SmsJobData, options: { delay?: number; priority?: number } = {}) {
    const queue = getSmsQueue();
    
    const job = await queue.add("send-sms", data, {
      delay: options.delay,
      priority: options.priority,
      removeOnComplete: 100,
      removeOnFail: 50,
    });

    logger.debug("SMS job added to queue", {
      jobId: job.id,
      to: data.payload.to,
      messageLength: data.payload.message.length,
      userId: data.metadata?.userId,
    });

    return job;
  },

  /**
   * Process SMS jobs (called by queue worker)
   */
  async processJobs() {
    const queue = getSmsQueue();
    
    // Type assertion for queue.process to handle both Bull Queue and InMemoryQueue
    (queue as any).process("send-sms", 5, async (job: Job<SmsJobData>) => {
      return processSmsJob(job);
    });

    queue.on("completed", (job: Job<SmsJobData>, result: SmsJobResult) => {
      logger.debug("SMS job completed", {
        jobId: job.id,
        success: result.success,
        successCount: result.successCount,
        messageIds: result.messageIds,
        to: job.data.payload.to,
        userId: job.data.metadata?.userId,
      });
    });

    queue.on("failed", (job: Job<SmsJobData> | undefined, error: Error) => {
      logger.error("SMS job failed", {
        jobId: job?.id,
        error: error.message,
        to: job?.data.payload.to,
        userId: job?.data.metadata?.userId,
      });
    });

    queue.on("stalled", (jobId: string) => {
      logger.warn("SMS job stalled", { jobId });
    });

    logger.info("SMS queue processor initialized");
  },

  /**
   * Get queue statistics
   */
  async getStats() {
    const queue = getSmsQueue();
    
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
    const queue = getSmsQueue();
    
    if ("clean" in queue) {
      await queue.clean(0, "completed");
      await queue.clean(0, "failed");
      logger.info("SMS queue cleared");
    }
  },
};

