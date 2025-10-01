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
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AdminSelect;

const withSecretSelect = {
  ...baseSelect,
  passwordHash: true,
} satisfies Prisma.AdminSelect;

export type AdminSafe = Prisma.AdminGetPayload<{ select: typeof baseSelect }>;
export type AdminWithSecret = Prisma.AdminGetPayload<{ select: typeof withSecretSelect }>;

export const adminAuthService = {
  findByEmailWithSecret: (email: string) =>
    prisma.admin.findUnique({ where: { email }, select: withSecretSelect }),
  findById: (id: number) => prisma.admin.findUnique({ where: { id }, select: baseSelect }),
  recordLogin: (id: number) =>
    prisma.admin.update({
      where: { id },
      data: { lastLoginAt: new Date() },
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
