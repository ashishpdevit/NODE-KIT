import type { Prisma } from "@prisma/client";

import { prisma } from "@/core/lib/prisma";

const baseSelect = {
  id: true,
  label: true,
  version: true,
  forceUpdates: true,
  maintenance: true,
  updatedAt: true,
} satisfies Prisma.AppSettingSelect;

export const appSettingService = {
  list: () => prisma.appSetting.findMany({ orderBy: { id: "asc" }, select: baseSelect }),
  get: (id: number) => prisma.appSetting.findUnique({ where: { id }, select: baseSelect }),
  create: (data: Prisma.AppSettingCreateInput) =>
    prisma.appSetting.create({ data, select: baseSelect }),
  update: (id: number, data: Prisma.AppSettingUpdateInput) =>
    prisma.appSetting.update({ where: { id }, data, select: baseSelect }),
  delete: (id: number) =>
    prisma.appSetting.delete({ where: { id }, select: baseSelect }),
};