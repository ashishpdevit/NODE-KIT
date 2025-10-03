import type { Request, Response } from "express";

import { toError, toSuccess } from "@/core/utils/httpResponse";
import { handlePrismaError } from "@/core/utils/prismaError";
import { verifyPassword, hashToken } from "@/core/utils/security";
import { signAppJwt } from "@/core/utils/jwt";
import { logger } from "@/core/utils/logger";
import { appConfig } from "@/core/config";
import { mailer } from "@/core/lib/mailer";
import { notificationCenter } from "@/core/services/notificationCenter";

import { appAuthService, type AppUserSafe } from "./auth.service";
import {
  forgotPasswordSchema,
  loginSchema,
  profileUpdateSchema,
  registerSchema,
  resetPasswordSchema,
} from "./auth.validation";

const buildAuthPayload = (user: AppUserSafe) => ({
  token: signAppJwt({
    sub: String(user.id),
    email: user.email,
    version: user.apiTokenVersion,
  }),
  user,
});

export const registerAppUser = async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  const { deviceToken, notificationsEnabled, ...rest } = parsed.data;

  const existing = await appAuthService.findByEmail(parsed.data.email);
  if (existing) {
    return res.status(409).json(toError("Email is already registered"));
  }

  try {
    const user = await appAuthService.createUser({
      ...rest,
      deviceToken,
      notificationsEnabled,
    });
    return res.status(201).json(toSuccess("Registration successful", buildAuthPayload(user)));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const loginAppUser = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  const user = await appAuthService.findByEmailWithSecret(parsed.data.email);
  if (!user) {
    return res.status(401).json(toError("Invalid email or password"));
  }

  const passwordValid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!passwordValid) {
    return res.status(401).json(toError("Invalid email or password"));
  }

  if (user.status && user.status.toLowerCase() !== "active") {
    return res.status(403).json(toError("Account is not active"));
  }

  try {
    const updated = await appAuthService.recordLogin(user.id, {
      locale: parsed.data.locale,
      deviceToken: parsed.data.deviceToken,
      notificationsEnabled: parsed.data.notificationsEnabled,
    });
    return res.json(toSuccess("Login successful", buildAuthPayload(updated)));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const forgotAppUserPassword = async (req: Request, res: Response) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  const user = await appAuthService.findByEmail(parsed.data.email);

  if (!user) {
    return res.json(
      toSuccess("If an account exists for this email, a reset link has been generated", {
        resetToken: null,
      })
    );
  }

  try {
    const { token, expiresAt } = await appAuthService.issuePasswordResetToken(user.id);

    if (mailer.isEnabled) {
      try {
        await mailer.send({
          to: user.email,
          subject: `${appConfig.name} password reset`,
          text: `Use the following code to reset your password: ${token}`,
          html: `<p>Use the following code to reset your password:</p><p><strong>${token}</strong></p><p>This code expires at ${expiresAt.toISOString()}.</p>`,
        });
      } catch (error) {
        logger.error("Failed to send password reset email", error);
      }
    }

    return res.json(
      toSuccess("Password reset token generated", {
        resetToken: token,
        expiresAt,
      })
    );
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const resetAppUserPassword = async (req: Request, res: Response) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  const tokenHash = hashToken(parsed.data.token);
  const record = await appAuthService.findValidResetToken(tokenHash);

  if (!record) {
    return res.status(400).json(toError("Reset token is invalid or has expired"));
  }

  try {
    const updated = await appAuthService.resetPasswordWithToken(
      record.id,
      record.userId,
      parsed.data.password
    );

    return res.json(toSuccess("Password has been reset", buildAuthPayload(updated)));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const getAppUserProfile = (_req: Request, res: Response) => {
  const user = res.locals.appUser as AppUserSafe | undefined;
  if (!user) {
    return res.status(401).json(toError("Unauthorized"));
  }

  return res.json(toSuccess("Profile fetched", user));
};

export const updateAppUserProfile = async (req: Request, res: Response) => {
  const user = res.locals.appUser as AppUserSafe | undefined;
  if (!user) {
    return res.status(401).json(toError("Unauthorized"));
  }

  const parsed = profileUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(toError("Invalid payload", parsed.error.flatten()));
  }

  const { name, phone, deviceToken, notificationsEnabled, locale } = parsed.data;
  const updateData: {
    name?: string;
    phone?: string;
    locale?: string;
    deviceToken?: string;
    notificationsEnabled?: boolean;
  } = {};

  if (name !== undefined) {
    updateData.name = name;
  }
  if (phone !== undefined) {
    updateData.phone = phone;
  }
  if (locale !== undefined) {
    updateData.locale = locale;
  }
  if (deviceToken !== undefined) {
    updateData.deviceToken = deviceToken;
  }
  if (notificationsEnabled !== undefined) {
    updateData.notificationsEnabled = notificationsEnabled;
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json(toError("No fields provided for update"));
  }

  try {
    const updated = await appAuthService.updateProfile(user.id, updateData);
    res.locals.appUser = updated;
    return res.json(toSuccess("Profile updated", buildAuthPayload(updated)));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

export const logoutAppUser = async (_req: Request, res: Response) => {
  const user = res.locals.appUser as AppUserSafe | undefined;
  if (!user) {
    return res.status(401).json(toError("Unauthorized"));
  }

  try {
    if (user.deviceToken && user.notificationsEnabled) {
      try {
        await notificationCenter.dispatch({
          title: "Logged out",
          message: "You have successfully logged out of your account.",
          persist: false,
          defaultLocale: user.locale ?? "en",
          targetLocale: user.locale ?? "en",
          push: {
            tokens: user.deviceToken,
            data: {
              type: "logout",
              timestamp: new Date().toISOString(),
            },
          },
        });
      } catch (error) {
        logger.error("Failed to send logout push notification", error);
      }
    }

    const updated = await appAuthService.clearDeviceRegistration(user.id);
    res.locals.appUser = updated;
    return res.json(toSuccess("Logout successful", { notificationsEnabled: updated.notificationsEnabled }));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};
