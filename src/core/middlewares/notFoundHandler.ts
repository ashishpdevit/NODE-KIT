import { Request, Response } from "express";
import { toError } from "@/core/utils/httpResponse";

export const notFoundHandler = (req: Request, res: Response) => {
  res
    .status(404)
    .json(toError(`Route ${req.method} ${req.originalUrl} not found`));
};