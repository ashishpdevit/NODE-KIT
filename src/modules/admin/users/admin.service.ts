import type { Prisma } from "@prisma/client";

import { prisma } from "@/core/lib/prisma";

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

export const adminService = {
  list: async (status?: string) => {
    const where = status ? { status } : undefined;

    return prisma.admin.findMany({ where, orderBy: { id: "asc" }, select: baseSelect });
  },
  get: (id: number) => prisma.admin.findUnique({ where: { id }, select: baseSelect }),
  create: (data: Prisma.AdminCreateInput) => prisma.admin.create({ data, select: baseSelect }),
  update: (id: number, data: Prisma.AdminUpdateInput) =>
    prisma.admin.update({ where: { id }, data, select: baseSelect }),
  delete: (id: number) => prisma.admin.delete({ where: { id }, select: baseSelect }),
};
