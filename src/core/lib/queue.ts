import Queue from "bull";
import { queueConfig } from "@/core/config";
import { logger } from "@/core/utils/logger";

// In-memory queue fallback for development/testing
class InMemoryQueue {
  private jobs: Array<{ id: string; name: string; data: any; opts: any }> = [];
  private processing = false;
  private processors: Array<(job: any) => Promise<any>> = [];

  async add(nameOrData: any, dataOrOpts?: any, opts: any = {}) {
    const id = Math.random().toString(36).substr(2, 9);
    
    // Handle both Bull Queue interface (name, data, opts) and simple interface (data, opts)
    let jobName: string;
    let jobData: any;
    let jobOpts: any;
    
    if (typeof nameOrData === "string" && dataOrOpts !== undefined) {
      // Bull Queue interface: add(name, data, opts)
      jobName = nameOrData;
      jobData = dataOrOpts;
      jobOpts = opts;
    } else {
      // Simple interface: add(data, opts)
      jobName = "default";
      jobData = nameOrData;
      jobOpts = dataOrOpts || {};
    }
    
    const job = { id, name: jobName, data: jobData, opts: jobOpts };
    this.jobs.push(job);
    
    logger.debug("Job added to in-memory queue", {
      jobId: id,
      jobName,
      dataKeys: Object.keys(jobData || {}),
      hasData: !!jobData,
    });
    
    // Process immediately if not already processing
    if (!this.processing) {
      this.processJobs();
    }
    
    return { id };
  }

  process(name: string, concurrency: number = 1, processor: (job: any) => Promise<any>) {
    this.processors.push(processor);
  }

  private async processJobs() {
    if (this.processing || this.jobs.length === 0) return;
    
    this.processing = true;
    
    while (this.jobs.length > 0 && this.processors.length > 0) {
      const job = this.jobs.shift()!;
      const processor = this.processors[0]; // Use first processor
      
      logger.debug("Processing job in in-memory queue", {
        jobId: job.id,
        dataKeys: Object.keys(job.data || {}),
        hasData: !!job.data,
      });
      
      try {
        await processor({ id: job.id, name: job.name, data: job.data, opts: job.opts });
      } catch (error) {
        logger.error("In-memory queue job failed", { jobId: job.id, error });
      }
    }
    
    this.processing = false;
  }

  on(event: string, callback: Function) {
    // Mock event handling for in-memory queue
    return this;
  }

  close() {
    this.jobs = [];
    this.processors = [];
    return Promise.resolve();
  }

  get waiting() {
    return this.jobs.length;
  }

  get active() {
    return this.processing ? 1 : 0;
  }

  get completed() {
    return 0; // Not tracking for simplicity
  }

  get failed() {
    return 0; // Not tracking for simplicity
  }
}

type QueueInstance = Queue.Queue | InMemoryQueue;

let emailQueue: QueueInstance | null = null;
let pushQueue: QueueInstance | null = null;
let smsQueue: QueueInstance | null = null;

const createQueue = (name: string, options: any = {}): QueueInstance => {
  if (queueConfig.useRedis) {
    return new Queue(name, {
      redis: queueConfig.redis,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        ...options,
      },
    });
  } else {
    logger.info(`Using in-memory queue for ${name} (Redis not configured)`);
    return new InMemoryQueue();
  }
};

export const getEmailQueue = (): QueueInstance => {
  if (!emailQueue) {
    emailQueue = createQueue(queueConfig.queues.email.name, {
      removeOnComplete: queueConfig.queues.email.removeOnComplete,
      removeOnFail: queueConfig.queues.email.removeOnFail,
      attempts: queueConfig.queues.email.attempts,
      backoff: queueConfig.queues.email.backoff,
    });
  }
  return emailQueue;
};

export const getPushQueue = (): QueueInstance => {
  if (!pushQueue) {
    pushQueue = createQueue(queueConfig.queues.push.name, {
      removeOnComplete: queueConfig.queues.push.removeOnComplete,
      removeOnFail: queueConfig.queues.push.removeOnFail,
      attempts: queueConfig.queues.push.attempts,
      backoff: queueConfig.queues.push.backoff,
    });
  }
  return pushQueue;
};

export const getSmsQueue = (): QueueInstance => {
  if (!smsQueue) {
    smsQueue = createQueue(queueConfig.queues.sms.name, {
      removeOnComplete: queueConfig.queues.sms.removeOnComplete,
      removeOnFail: queueConfig.queues.sms.removeOnFail,
      attempts: queueConfig.queues.sms.attempts,
      backoff: queueConfig.queues.sms.backoff,
    });
  }
  return smsQueue;
};

export const closeQueues = async (): Promise<void> => {
  const promises: Promise<void>[] = [];
  
  if (emailQueue) {
    promises.push(emailQueue.close());
    emailQueue = null;
  }
  
  if (pushQueue) {
    promises.push(pushQueue.close());
    pushQueue = null;
  }
  
  if (smsQueue) {
    promises.push(smsQueue.close());
    smsQueue = null;
  }
  
  await Promise.all(promises);
  logger.info("All queues closed");
};

export const getQueueStats = async () => {
  const stats = {
    email: {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
    },
    push: {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
    },
    sms: {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
    },
  };

  try {
    const emailQ = getEmailQueue();
    const pushQ = getPushQueue();
    const smsQ = getSmsQueue();

    if (queueConfig.useRedis && emailQ instanceof Queue && pushQ instanceof Queue && smsQ instanceof Queue) {
      const [emailWaiting, emailActive, emailCompleted, emailFailed] = await Promise.all([
        emailQ.getWaiting(),
        emailQ.getActive(),
        emailQ.getCompleted(),
        emailQ.getFailed(),
      ]);

      const [pushWaiting, pushActive, pushCompleted, pushFailed] = await Promise.all([
        pushQ.getWaiting(),
        pushQ.getActive(),
        pushQ.getCompleted(),
        pushQ.getFailed(),
      ]);

      const [smsWaiting, smsActive, smsCompleted, smsFailed] = await Promise.all([
        smsQ.getWaiting(),
        smsQ.getActive(),
        smsQ.getCompleted(),
        smsQ.getFailed(),
      ]);

      stats.email = {
        waiting: emailWaiting.length,
        active: emailActive.length,
        completed: emailCompleted.length,
        failed: emailFailed.length,
      };

      stats.push = {
        waiting: pushWaiting.length,
        active: pushActive.length,
        completed: pushCompleted.length,
        failed: pushFailed.length,
      };

      stats.sms = {
        waiting: smsWaiting.length,
        active: smsActive.length,
        completed: smsCompleted.length,
        failed: smsFailed.length,
      };
    } else {
      // In-memory queue stats
      stats.email.waiting = (emailQ as InMemoryQueue).waiting;
      stats.email.active = (emailQ as InMemoryQueue).active;
      stats.push.waiting = (pushQ as InMemoryQueue).waiting;
      stats.push.active = (pushQ as InMemoryQueue).active;
      stats.sms.waiting = (smsQ as InMemoryQueue).waiting;
      stats.sms.active = (smsQ as InMemoryQueue).active;
    }
  } catch (error) {
    logger.error("Failed to get queue stats", error);
  }

  return stats;
};
