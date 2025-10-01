import type { Prisma } from "@prisma/client";

import { prisma } from "@/core/lib/prisma";

const baseSelect = {
  id: true,
  name: true,
  type: true,
  audience: true,
  link: true,
  updatedAt: true,
} satisfies Prisma.AppMenuLinkSelect;

export const appMenuLinkService = {
  list: async (filters: { audience?: string; type?: string }) => {
    const where: Prisma.AppMenuLinkWhereInput = {};
    if (filters.audience) {
      where.audience = filters.audience;
    }
    if (filters.type) {
      where.type = filters.type;
    }

    return prisma.appMenuLink.findMany({ where, orderBy: { id: "asc" }, select: baseSelect });
  },
  get: (id: number) => prisma.appMenuLink.findUnique({ where: { id }, select: baseSelect }),
  create: (data: Prisma.AppMenuLinkCreateInput) =>
    prisma.appMenuLink.create({ data, select: baseSelect }),
  update: (id: number, data: Prisma.AppMenuLinkUpdateInput) =>
    prisma.appMenuLink.update({ where: { id }, data, select: baseSelect }),
  delete: (id: number) =>
    prisma.appMenuLink.delete({ where: { id }, select: baseSelect }),
};
