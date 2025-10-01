import { env } from "@/core/config/env";
import { prisma } from "@/core/lib/prisma";
import { startServer } from "./server";
import { logger } from "@/core/utils/logger";

async function bootstrap() {
  const server = await startServer();

  const shutdown = () => {
    logger.info("Shutting down server");
    server.close(async () => {
      logger.info("Server closed");
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled rejection", reason);
  });

  process.on("uncaughtException", (err) => {
    logger.error("Uncaught exception", err);
  });

  logger.info(`Environment: ${env.NODE_ENV}`);
}

bootstrap().catch(async (error) => {
  logger.error("Fatal error during bootstrap", error);
  await prisma.$disconnect();
  process.exit(1);
});