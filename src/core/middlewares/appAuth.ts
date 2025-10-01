import type { NextFunction, Request, Response } from "express";

import { toError } from "@/core/utils/httpResponse";
import { verifyAppJwt } from "@/core/utils/jwt";

import { appAuthService, type AppUserSafe } from "@/modules/app/auth/auth.service";

export const appAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header("authorization");

  if (!authHeader) {
    return res.status(401).json(toError("Authorization header is missing"));
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return res.status(401).json(toError("Authorization header is invalid"));
  }

  try {
    const payload = verifyAppJwt(token);
    const userId = Number(payload.sub);

    if (!Number.isInteger(userId)) {
      return res.status(401).json(toError("Invalid token subject"));
    }

    const user = await appAuthService.findById(userId);

    if (!user || payload.version !== user.apiTokenVersion) {
      return res.status(401).json(toError("Invalid or expired token"));
    }

    if (user.status && user.status.toLowerCase() !== "active") {
      return res.status(403).json(toError("Account is not active"));
    }

    res.locals.appUser = user as AppUserSafe;
    return next();
  } catch (error) {
    return res.status(401).json(toError("Invalid or expired token"));
  }
};
