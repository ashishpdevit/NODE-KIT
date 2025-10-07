import type { Prisma } from "@prisma/client";
import crypto from "crypto";

import { prisma } from "@/core/lib/prisma";
import { hashPassword, hashToken } from "@/core/utils/security";
import { adminAuthConfig } from "@/core/config";

const baseSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  apiTokenVersion: true,
  lastLoginAt: true,
  deviceToken: true,
  notificationsEnabled: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AdminSelect;

const withSecretSelect = {
  ...baseSelect,
  passwordHash: true,
} satisfies Prisma.AdminSelect;

export type AdminSafe = Prisma.AdminGetPayload<{ select: typeof baseSelect }>;
export type AdminWithSecret = Prisma.AdminGetPayload<{ select: typeof withSecretSelect }>;

type LoginUpdateInput = {
  deviceToken?: string | null;
  notificationsEnabled?: boolean;
};

const applyLoginUpdate = (data: LoginUpdateInput) => {
  const update: Prisma.AdminUpdateInput = {};
  if (data.deviceToken !== undefined) {
    update.deviceToken = data.deviceToken;
  }
  if (data.notificationsEnabled !== undefined) {
    update.notificationsEnabled = data.notificationsEnabled;
  }
  return update;
};

export const adminAuthService = {
  findByEmailWithSecret: (email: string) =>
    prisma.admin.findUnique({ where: { email }, select: withSecretSelect }),
  findById: (id: number) => prisma.admin.findUnique({ where: { id }, select: baseSelect }),
  recordLogin: (id: number, data: LoginUpdateInput = {}) =>
    prisma.admin.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
        ...applyLoginUpdate(data),
      },
      select: baseSelect,
    }),
  clearDeviceRegistration: (id: number) =>
    prisma.admin.update({
      where: { id },
      data: { 
        deviceToken: null, 
        notificationsEnabled: false,
        apiTokenVersion: { increment: 1 },
      },
      select: baseSelect,
    }),
  updatePassword: async (id: number, password: string) => {
    const passwordHash = await hashPassword(password);
    return prisma.admin.update({
      where: { id },
      data: {
        passwordHash,
        apiTokenVersion: { increment: 1 },
      },
      select: baseSelect,
    });
  },
  findByEmail: (email: string) =>
    prisma.admin.findUnique({ where: { email }, select: baseSelect }),
  issuePasswordResetToken: async (adminId: number) => {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = await hashToken(token);
    const expiresAt = new Date(Date.now() + adminAuthConfig.resetTokenTtlMinutes * 60 * 1000);

    // Delete any existing unused tokens for this admin
    await prisma.adminPasswordResetToken.deleteMany({
      where: {
        adminId,
        usedAt: null,
      },
    });

    // Create new token
    const resetToken = await prisma.adminPasswordResetToken.create({
      data: {
        adminId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      id: resetToken.id,
      token,
      expiresAt,
    };
  },
  verifyPasswordResetToken: async (token: string) => {
    const tokenHash = await hashToken(token);
    
    const resetToken = await prisma.adminPasswordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        admin: {
          select: baseSelect,
        },
      },
    });

    return resetToken;
  },
  markPasswordResetTokenAsUsed: async (tokenId: number) => {
    return prisma.adminPasswordResetToken.update({
      where: { id: tokenId },
      data: { usedAt: new Date() },
    });
  },
  resetPasswordWithToken: async (adminId: number, newPassword: string, tokenId: number) => {
    const passwordHash = await hashPassword(newPassword);
    
    // Update password and invalidate all tokens in a transaction
    return prisma.$transaction(async (tx) => {
      // Update admin password and increment token version
      const updatedAdmin = await tx.admin.update({
        where: { id: adminId },
        data: {
          passwordHash,
          apiTokenVersion: { increment: 1 },
        },
        select: baseSelect,
      });

      // Mark the reset token as used
      await tx.adminPasswordResetToken.update({
        where: { id: tokenId },
        data: { usedAt: new Date() },
      });

      // Delete all other unused reset tokens for this admin
      await tx.adminPasswordResetToken.deleteMany({
        where: {
          adminId,
          usedAt: null,
        },
      });

      return updatedAdmin;
    });
  },
};
