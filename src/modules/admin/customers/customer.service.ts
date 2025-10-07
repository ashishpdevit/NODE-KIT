import type { Prisma } from "@prisma/client";

import { prisma } from "@/core/lib/prisma";

const baseSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  company: true,
  status: true,
  country: true,
  timezone: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CustomerSelect;

export const customerService = {
  list: async (filters: { status?: string; country?: string }) => {
    const where: Prisma.CustomerWhereInput = {};
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.country) {
      where.country = filters.country;
    }

    return prisma.customer.findMany({ where, orderBy: { id: "asc" }, select: baseSelect });
  },
  get: (id: number) => prisma.customer.findUnique({ where: { id }, select: baseSelect }),
  create: (data: Prisma.CustomerCreateInput) =>
    prisma.customer.create({ data, select: baseSelect }),
  update: (id: number, data: Prisma.CustomerUpdateInput) =>
    prisma.customer.update({ where: { id }, data, select: baseSelect }),
  delete: (id: number) =>
    prisma.customer.delete({ where: { id }, select: baseSelect }),
};
