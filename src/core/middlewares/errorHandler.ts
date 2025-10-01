import { Request, Response, NextFunction } from "express";
import { toError } from "@/core/utils/httpResponse";
import { logger } from "@/core/utils/logger";

const resolveStatusCode = (error: unknown): number => {
  if (typeof error === "object" && error !== null) {
    const maybeStatus = (error as { status?: unknown; statusCode?: unknown }).status;
    const maybeStatusCode = (error as { status?: unknown; statusCode?: unknown }).statusCode;

    if (typeof maybeStatus === "number") {
      return maybeStatus;
    }
    if (typeof maybeStatusCode === "number") {
      return maybeStatusCode;
    }
  }
  return 500;
};

const resolveMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Unexpected error";
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error("Unhandled error", err);
  res.status(resolveStatusCode(err)).json(toError(resolveMessage(err)));
};