import { appConfig } from "./index";

export const queueConfig = {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || "0", 10),
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  },
  
  queues: {
    email: {
      name: "email-queue",
      concurrency: parseInt(process.env.EMAIL_QUEUE_CONCURRENCY || "5", 10),
      removeOnComplete: parseInt(process.env.EMAIL_QUEUE_REMOVE_ON_COMPLETE || "100", 10),
      removeOnFail: parseInt(process.env.EMAIL_QUEUE_REMOVE_ON_FAIL || "50", 10),
      attempts: parseInt(process.env.EMAIL_QUEUE_ATTEMPTS || "3", 10),
      backoff: {
        type: "exponential" as const,
        delay: 2000,
      },
    },
    
    push: {
      name: "push-queue", 
      concurrency: parseInt(process.env.PUSH_QUEUE_CONCURRENCY || "10", 10),
      removeOnComplete: parseInt(process.env.PUSH_QUEUE_REMOVE_ON_COMPLETE || "100", 10),
      removeOnFail: parseInt(process.env.PUSH_QUEUE_REMOVE_ON_FAIL || "50", 10),
      attempts: parseInt(process.env.PUSH_QUEUE_ATTEMPTS || "3", 10),
      backoff: {
        type: "exponential" as const,
        delay: 2000,
      },
    },
  },
  
  // In test environment, use in-memory queue
  useRedis: appConfig.nodeEnv !== "test" && process.env.REDIS_URL !== undefined,
};
