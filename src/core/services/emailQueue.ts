import { Job } from "bull";
import { mailer, type MailPayload } from "@/core/lib/mailer";
import { renderEmailTemplate } from "@/core/templates/email";
import { logger } from "@/core/utils/logger";
import { getEmailQueue } from "@/core/lib/queue";

export type EmailJobData = {
  payload: MailPayload;
  template?: {
    id?: string;
    locale?: string;
    context?: Record<string, unknown>;
  };
  metadata?: {
    userId?: number;
    notificationId?: string;
    source?: string;
  };
};

export type EmailJobResult = {
  success: boolean;
  messageId?: string;
  error?: string;
  meta?: {
    accepted?: string[];
    rejected?: string[];
    response?: string;
  };
};

const processEmailJob = async (job: Job<EmailJobData>): Promise<EmailJobResult> => {
  const { payload, template, metadata } = job.data;
  
  // Validate payload FIRST before accessing any properties
  if (!payload || !payload.to) {
    const error = "Email payload is missing or invalid - 'to' field is required";
    logger.error("Invalid email job payload", {
      jobId: job.id,
      payload,
      error,
    });
    return {
      success: false,
      error,
    };
  }
  
  
  logger.debug("Processing email job", {
    jobId: job.id,
    to: payload.to,
    subject: payload.subject,
    template: template?.id,
    userId: metadata?.userId,
  });

  try {
    let finalPayload = { ...payload };

    // Render template if provided
    if (template?.id) {
      const rendered = renderEmailTemplate({
        templateId: template.id,
        locale: template.locale,
        context: template.context,
        fallback: {
          title: payload.subject || "",
          message: typeof payload.text === "string" ? payload.text : "",
        },
        overrides: {
          subject: payload.subject,
        },
      });

      finalPayload = {
        ...finalPayload,
        subject: rendered.subject ?? finalPayload.subject,
        html: rendered.html ?? finalPayload.html,
        text: rendered.text ?? finalPayload.text,
      };
    }

    // Send email
    const info = await mailer.send(finalPayload);
    
    const accepted = Array.isArray((info as unknown as { accepted?: unknown[] }).accepted)
      ? ((info as unknown as { accepted: string[] }).accepted)
      : undefined;
    const rejected = Array.isArray((info as unknown as { rejected?: unknown[] }).rejected)
      ? ((info as unknown as { rejected: string[] }).rejected)
      : undefined;
    const response = (info as unknown as { response?: string }).response;

    const result: EmailJobResult = {
      success: true,
      messageId: (info as unknown as { messageId?: string }).messageId,
      meta: {
        accepted,
        rejected,
        response,
      },
    };

    logger.info("Email sent successfully", {
      jobId: job.id,
      messageId: result.messageId,
      to: payload.to,
      userId: metadata?.userId,
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error("Email job failed", {
      jobId: job.id,
      to: payload.to,
      error: errorMessage,
      userId: metadata?.userId,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
};

export const emailQueueService = {
  /**
   * Add an email job to the queue
   */
  async addEmailJob(data: EmailJobData, options: { delay?: number; priority?: number } = {}) {
    const queue = getEmailQueue();
    
    
    const job = await queue.add("send-email", data, {
      delay: options.delay,
      priority: options.priority,
      removeOnComplete: 100,
      removeOnFail: 50,
    });

    logger.debug("Email job added to queue", {
      jobId: job.id,
      to: data.payload.to,
      subject: data.payload.subject,
      userId: data.metadata?.userId,
    });

    return job;
  },

  /**
   * Process email jobs (called by queue worker)
   */
  async processJobs() {
    const queue = getEmailQueue();
    
    // Type assertion for queue.process to handle both Bull Queue and InMemoryQueue
    (queue as any).process("send-email", 5, async (job: Job<EmailJobData>) => {
      return processEmailJob(job);
    });

    queue.on("completed", (job: Job<EmailJobData>, result: EmailJobResult) => {
      logger.debug("Email job completed", {
        jobId: job.id,
        success: result.success,
        messageId: result.messageId,
        to: job.data.payload.to,
        userId: job.data.metadata?.userId,
      });
    });

    queue.on("failed", (job: Job<EmailJobData> | undefined, error: Error) => {
      logger.error("Email job failed", {
        jobId: job?.id,
        error: error.message,
        to: job?.data.payload.to,
        userId: job?.data.metadata?.userId,
      });
    });

    queue.on("stalled", (jobId: string) => {
      logger.warn("Email job stalled", { jobId });
    });

    logger.info("Email queue processor initialized");
  },

  /**
   * Get queue statistics
   */
  async getStats() {
    const queue = getEmailQueue();
    
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
    const queue = getEmailQueue();
    
    if ("clean" in queue) {
      await queue.clean(0, "completed");
      await queue.clean(0, "failed");
      logger.info("Email queue cleared");
    }
  },
};
