import { prisma } from "@/core/lib/prisma";
import type { Prisma } from "@prisma/client";

const baseSelect = {
  id: true,
  label: true,
  version: true,
  forceUpdates: true,
  maintenance: true,
  updatedAt: true,
} satisfies Prisma.AppSettingSelect;

export type AppSettingSafe = Prisma.AppSettingGetPayload<{ select: typeof baseSelect }>;

export const initService = {
  findSettingByLabel: (label: string) =>
    prisma.appSetting.findFirst({
      where: { label },
      select: baseSelect,
    }),
};

