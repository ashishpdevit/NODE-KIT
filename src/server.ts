import compression from "compression";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { createServer, type Server } from "http";
import path from "path";

import { appConfig, env } from "@/core/config";
import { errorHandler } from "@/core/middlewares/errorHandler";
import { notFoundHandler } from "@/core/middlewares/notFoundHandler";
import { requestLogger } from "@/core/middlewares/requestLogger";
import { queueWorker } from "@/core/services/queueWorker";
import { apiRouter } from "./routes";
import { toSuccess } from "@/core/utils/httpResponse";
import { logger } from "@/core/utils/logger";
import { apiKeyAuth } from "./core/middlewares/apiKeyAuth";

export const createApp = (): Express => {
  const app = express();

  app.disable("x-powered-by");

  app.use(cors());
  app.use(helmet());
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Serve static files for local storage (only if using local provider)
  // This must be BEFORE apiKeyAuth to allow public access to images
  if (env.STORAGE_PROVIDER === "local") {
    const uploadsPath = path.resolve(env.STORAGE_LOCAL_PATH);
    
    // Serve files from /uploads path (backward compatibility)
    app.use("/uploads", express.static(uploadsPath));
    
    // Serve files from collection paths (e.g., /images/, /gallery/, etc.)
    // This allows URLs like /images/file.jpg to work directly
    // Files are stored as: uploads/images/file.jpg
    // URL: /images/file.jpg -> serves uploads/images/file.jpg
    app.use(express.static(uploadsPath, {
      // Don't serve directory listings
      index: false,
    }));
    
    logger.info(`Serving static files from: ${uploadsPath} (accessible at /{collectionName}/{fileName})`);
  }

  app.get("/", (_req, res) => {
    res.json(toSuccess("Welcome to the Node Starter Kit"));
  });

  // API key auth - only applies to /api routes (not static files)
  app.use("/api", apiKeyAuth);
  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const startServer = async (): Promise<Server> => {
  const app = createApp();
  const httpServer = createServer(app);
  const port = appConfig.port;

  // Initialize queue workers
  try {
    await queueWorker.initialize();
  } catch (error) {
    logger.error("Failed to initialize queue workers", error);
    // Don't throw here to allow server to start even if queues fail
  }

  await new Promise<void>((resolve) => {
    httpServer.listen(port, () => {
      logger.info(`Server running on http://localhost:${port}`);
      resolve();
    });
  });

  return httpServer;
};