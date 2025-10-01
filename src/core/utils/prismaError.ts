import type { Response } from "express";
import { Prisma } from "@prisma/client";

import { toError } from "./httpResponse";

export const handlePrismaError = (res: Response, error: unknown) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return res.status(404).json(toError("Resource not found"));
    }
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? error.meta?.target.join(", ")
        : String(error.meta?.target ?? "unique constraint");
      return res.status(409).json(toError(`Duplicate value for ${target}`));
    }
  }

  const message = error instanceof Error ? error.message : "Unexpected error";
  return res.status(500).json(toError(message));
};