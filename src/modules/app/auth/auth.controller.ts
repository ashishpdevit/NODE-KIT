import type { Request, Response } from "express";

import { toError, toSuccess } from "@/core/utils/httpResponse";
import { handlePrismaError } from "@/core/utils/prismaError";
import { verifyPassword, hashToken } from "@/core/utils/security";
import { signAppJwt } from "@/core/utils/jwt";
import { logger } from "@/core/utils/logger";
import { appConfig } from "@/core/config";
import { queuedMailer } from "@/core/lib/queuedMailer";
import { sendNotification, authNotifications, shipmentNotifications } from "@/core/notifications";

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

    // if (queuedMailer.isEnabled) {
    //   try {
    //     await queuedMailer.sendWelcomeEmail(user.email, user.name ?? 'User', user.id);
    //   } catch (error) {
    //     logger.error("Failed to queue welcome email", error);
    //   }
    // }
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

    if (queuedMailer.isEnabled) {
      try {
        await queuedMailer.sendPasswordResetEmail(user.email, token, expiresAt, user.id);
      } catch (error) {
        logger.error("Failed to queue password reset email", error);
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
        // Using the new notification system with i18n keys
        // await sendNotification({
        //   userId: user.id,
        //   data: {
        //     type: "auth_logout",
        //     title: "messages.push_notification.auth.logout.title",
        //     message: "messages.push_notification.auth.logout.message",
        //     variables: {
        //       userName: user.name || "User",
        //       timestamp: new Date().toISOString(),
        //     },
        //     metadata: {
        //       action: "logout",
        //     },
        //   },
        //   locale: user.locale || "en",
        //   sendPush: true,
        //   sendEmail: false,
        //   markAsRead: false,
        // });
        await sendNotification({
          userId: user.id,
          data: authNotifications.logout.build({ userName: user.name || "User", timestamp: new Date().toISOString() }),
          sendPush: true,   // Sends in user's locale
          sendEmail: true,  // Sends in user's locale
          useQueue: true,   // Async delivery,
          // Optional: Pass additional context for the email template
          emailContext: {
            greeting: `Hi ${user.name}!`,
            intro: ["You have been logged out from your account."],
            outro: ["We hope to see you again soon!"],
            ctas: [
              {
                label: "Log Back In",
                url: `/login`
              }
            ]
          }
        });

        logger.info("Logout notification sent successfully", { userId: user.id });
      } catch (error) {
        logger.error("Failed to send logout notification", error);
      }
    }

    const updated = await appAuthService.clearDeviceRegistration(user.id);
    res.locals.appUser = updated;
    return res.json(toSuccess("Logout successful", { notificationsEnabled: updated.notificationsEnabled }));
  } catch (error) {
    return handlePrismaError(res, error);
  }
};
