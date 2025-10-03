import type { Prisma } from "@prisma/client";

import { prisma } from "@/core/lib/prisma";
import { hashPassword } from "@/core/utils/security";

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
      data: { deviceToken: null, notificationsEnabled: false },
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
};
