import { Request, Response, NextFunction } from "express";
import { logger } from "@/core/utils/logger";

const toMilliseconds = (start: bigint) => {
  const diff = process.hrtime.bigint() - start;
  return Number(diff) / 1_000_000;
};

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const duration = toMilliseconds(start);
    logger.info(
      `${req.method} ${req.originalUrl}`,
      `${res.statusCode} ${duration.toFixed(1)}ms`
    );
  });

  next();
};