import type { Prisma } from "@prisma/client";

import { prisma } from "@/core/lib/prisma";

const baseSelect = {
  id: true,
  message: true,
  contact: true,
  status: true,
  adminReply: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ContactRequestSelect;

export const contactRequestService = {
  list: async (since?: Date, status?: string) => {
    const where: Prisma.ContactRequestWhereInput = {};
    if (since) {
      where.createdAt = { gte: since };
    }
    if (status) {
      where.status = status;
    }

    return prisma.contactRequest.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: "desc" },
      select: baseSelect,
    });
  },
  get: (id: number) => prisma.contactRequest.findUnique({ where: { id }, select: baseSelect }),
  create: (data: Prisma.ContactRequestCreateInput) =>
    prisma.contactRequest.create({ data, select: baseSelect }),
  update: (id: number, data: Prisma.ContactRequestUpdateInput) =>
    prisma.contactRequest.update({ where: { id }, data, select: baseSelect }),
  delete: (id: number) =>
    prisma.contactRequest.delete({ where: { id }, select: baseSelect }),
};
