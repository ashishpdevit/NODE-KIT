import type { NextFunction, Request, Response } from "express";

import { authConfig } from "@/core/config";
import { toError } from "@/core/utils/httpResponse";

const normalizeApiKey = (req: Request) => {
  const headerKey = req.header("x-api-key") ?? req.header("x-api-key".toUpperCase());
  if (headerKey) {
    return headerKey.trim();
  }

  if (typeof req.query.api_key === "string") {
    return req.query.api_key.trim();
  }

  return undefined;
};

export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!authConfig.apiKey) {
    return res.status(500).json(toError("API key is not configured"));
  }

  const providedKey = normalizeApiKey(req);

  if(!providedKey) {
    return res.status(401).json(toError("API key is required"));
  }

  if (providedKey !== authConfig.apiKey) {
    return res.status(401).json(toError("Invalid API key"));
  }

  return next();
};
