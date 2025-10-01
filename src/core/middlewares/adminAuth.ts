import type { NextFunction, Request, Response } from "express";

import { toError } from "@/core/utils/httpResponse";
import { verifyAdminJwt } from "@/core/utils/jwt";

import { adminAuthService, type AdminSafe } from "@/modules/admin/auth/auth.service";

export const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header("authorization");

  if (!authHeader) {
    return res.status(401).json(toError("Authorization header is missing"));
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return res.status(401).json(toError("Authorization header is invalid"));
  }

  try {
    const payload = verifyAdminJwt(token);
    const adminId = Number(payload.sub);

    if (!Number.isInteger(adminId)) {
      return res.status(401).json(toError("Invalid token subject"));
    }

    const admin = await adminAuthService.findById(adminId);

    if (!admin || payload.version !== admin.apiTokenVersion) {
      return res.status(401).json(toError("Invalid or expired token"));
    }

    if ((admin.status ?? "").toLowerCase() !== "active") {
      return res.status(403).json(toError("Admin account is not active"));
    }

    res.locals.admin = admin as AdminSafe;
    return next();
  } catch (error) {
    return res.status(401).json(toError("Invalid or expired token"));
  }
};
