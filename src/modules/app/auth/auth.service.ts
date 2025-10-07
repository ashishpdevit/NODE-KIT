import { prisma } from "@/core/lib/prisma";
import { authConfig } from "@/core/config";
import { createResetTokenPair, hashPassword } from "@/core/utils/security";
import type { Prisma } from "@prisma/client";

const baseSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  status: true,
  apiTokenVersion: true,
  lastLoginAt: true,
  locale: true,
  deviceToken: true,
  notificationsEnabled: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AppUserSelect;

const withSecretSelect = {
  ...baseSelect,
  passwordHash: true,
} satisfies Prisma.AppUserSelect;

export type AppUserSafe = Prisma.AppUserGetPayload<{ select: typeof baseSelect }>;
export type AppUserWithSecret = Prisma.AppUserGetPayload<{ select: typeof withSecretSelect }>;

type CreateUserInput = {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  locale?: string;
  deviceToken?: string;
  notificationsEnabled?: boolean;
};

type LoginUpdateInput = {
  locale?: string;
  deviceToken?: string | null;
  notificationsEnabled?: boolean;
};

type ProfileUpdateInput = {
  name?: string;
  phone?: string;
  locale?: string;
  deviceToken?: string;
  notificationsEnabled?: boolean;
};

const computeResetExpiry = () =>
  new Date(Date.now() + authConfig.resetTokenTtlMinutes * 60_000);

const applyLoginUpdate = (data: LoginUpdateInput) => {
  const update: Prisma.AppUserUpdateInput = {};
  if (data.locale !== undefined) {
    update.locale = data.locale;
  }
  if (data.deviceToken !== undefined) {
    update.deviceToken = data.deviceToken;
  }
  if (data.notificationsEnabled !== undefined) {
    update.notificationsEnabled = data.notificationsEnabled;
  }
  return update;
};

const applyProfileUpdate = (data: ProfileUpdateInput) => {
  const update: Prisma.AppUserUpdateInput = {};
  if (data.name !== undefined) {
    update.name = data.name;
  }
  if (data.phone !== undefined) {
    update.phone = data.phone;
  }
  if (data.locale !== undefined) {
    update.locale = data.locale;
  }
  if (data.deviceToken !== undefined) {
    update.deviceToken = data.deviceToken;
  }
  if (data.notificationsEnabled !== undefined) {
    update.notificationsEnabled = data.notificationsEnabled;
  }
  return update;
};

export const appAuthService = {
  findByEmailWithSecret: (email: string) =>
    prisma.appUser.findUnique({ where: { email }, select: withSecretSelect }),
  findByEmail: (email: string) =>
    prisma.appUser.findUnique({ where: { email }, select: baseSelect }),
  findById: (id: number) =>
    prisma.appUser.findUnique({ where: { id }, select: baseSelect }),
  createUser: async (input: CreateUserInput) => {
    const passwordHash = await hashPassword(input.password);
    return prisma.appUser.create({
      data: {
        email: input.email,
        name: input.name,
        phone: input.phone,
        passwordHash,
        locale: input.locale ?? "en",
        ...(input.deviceToken ? { deviceToken: input.deviceToken } : {}),
        ...(input.notificationsEnabled !== undefined
          ? { notificationsEnabled: input.notificationsEnabled }
          : {}),
      },
      select: baseSelect,
    });
  },
  recordLogin: (id: number, data: LoginUpdateInput = {}) =>
    prisma.appUser.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
        ...applyLoginUpdate(data),
      },
      select: baseSelect,
    }),
  updateProfile: (id: number, data: ProfileUpdateInput) =>
    prisma.appUser.update({ where: { id }, data: applyProfileUpdate(data), select: baseSelect }),
  clearDeviceRegistration: (id: number) =>
    prisma.appUser.update({
      where: { id },
      data: { 
        deviceToken: null, 
        notificationsEnabled: false,
        apiTokenVersion: { increment: 1 },
      },
      select: baseSelect,
    }),
  issuePasswordResetToken: async (userId: number) => {
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId,
        usedAt: null,
      },
    });

    const { token, tokenHash } = createResetTokenPair();
    const expiresAt = computeResetExpiry();

    await prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return { token, expiresAt } as const;
  },
  findValidResetToken: (tokenHash: string) =>
    prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: withSecretSelect,
        },
      },
    }),
  resetPasswordWithToken: async (tokenId: number, userId: number, password: string) => {
    const passwordHash = await hashPassword(password);

    return prisma.$transaction(async (tx) => {
      const updatedUser = await tx.appUser.update({
        where: { id: userId },
        data: {
          passwordHash,
          apiTokenVersion: { increment: 1 },
        },
        select: baseSelect,
      });

      await tx.passwordResetToken.update({
        where: { id: tokenId },
        data: { usedAt: new Date() },
      });

      await tx.passwordResetToken.deleteMany({
        where: {
          userId,
          usedAt: null,
        },
      });

      return updatedUser;
    });
  },
};
