import type { Request, Response } from "express";

import { toError, toSuccess } from "@/core/utils/httpResponse";
import { handlePrismaError } from "@/core/utils/prismaError";
import { verifyPassword } from "@/core/utils/security";
import { signAdminJwt } from "@/core/utils/jwt";

import { adminAuthService, type AdminSafe } from "./auth.service";
import { adminLoginSchema } from "./auth.validation";

const buildAuthPayload = (admin: AdminSafe) => ({
  token: signAdminJwt({
    sub: String(admin.id),
    email: admin.email,
    role: admin.role,
    version: admin.apiTokenVersion,
  }),
  admin,
});

export const loginAdmin = async (req: Request, res: Response) => {
  const parsed = adminLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  const admin = await adminAuthService.findByEmailWithSecret(parsed.data.email);
  if (!admin) {
    return res.status(401).json(toError("Invalid email or password"));
  }

  if ((admin.status ?? "").toLowerCase() !== "active") {
    return res.status(403).json(toError("Admin account is not active"));
  }

  const passwordValid = await verifyPassword(parsed.data.password, admin.passwordHash);
  if (!passwordValid) {
    return res.status(401).json(toError("Invalid email or password"));
  }

  try {
    const updated = await adminAuthService.recordLogin(admin.id, {
      deviceToken: parsed.data.deviceToken,
      notificationsEnabled: parsed.data.notificationsEnabled,
    });
    return res.json(toSuccess("Login successful", buildAuthPayload(updated)));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const getAdminProfile = (_req: Request, res: Response) => {
  const admin = res.locals.admin as AdminSafe | undefined;
  if (!admin) {
    return res.status(401).json(toError("Unauthorized"));
  }

  return res.json(toSuccess("Profile fetched", admin));
};

export const updateAdminPassword = async (req: Request, res: Response) => {
  const admin = res.locals.admin as AdminSafe | undefined;
  if (!admin) {
    return res.status(401).json(toError("Unauthorized"));
  }

  const password = typeof req.body?.password === "string" ? req.body.password : undefined;
  if (!password || password.length < 8) {
    return res.status(400).json(toError("Password must be at least 8 characters long"));
  }

  try {
    const updated = await adminAuthService.updatePassword(admin.id, password);
    res.locals.admin = updated;
    return res.json(toSuccess("Password updated", buildAuthPayload(updated)));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const logoutAdmin = async (_req: Request, res: Response) => {
  const admin = res.locals.admin as AdminSafe | undefined;
  if (!admin) {
    return res.status(401).json(toError("Unauthorized"));
  }

  try {
    const updated = await adminAuthService.clearDeviceRegistration(admin.id);
    res.locals.admin = updated;
    return res.json(toSuccess("Logout successful", { notificationsEnabled: updated.notificationsEnabled }));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};
