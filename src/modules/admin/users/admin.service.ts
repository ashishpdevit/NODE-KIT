import type { Prisma } from "@prisma/client";
import { createOrderByClause, createSearchWhereClause, createPaginatedResponse, type PaginationOptions, type SortOptions, type SearchOptions } from "@/core/utils/pagination";

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
  listPaginated: async (params: {
    pagination: PaginationOptions;
    sort: SortOptions | null;
    search: SearchOptions | null;
    filters?: { status?: string };
  }) => {
    const { pagination, sort, search, filters } = params;
    
    const where: Prisma.AdminWhereInput = {
      ...createSearchWhereClause(search, "Admin"),
    };
    if (filters?.status && filters.status !== 'all') where.status = filters.status;

    const [total, data] = await Promise.all([
      prisma.admin.count({ where }),
      prisma.admin.findMany({
        where,
        orderBy: createOrderByClause(sort) || { id: "desc" },
        skip: pagination.offset,
        take: pagination.limit,
        select: baseSelect,
      }),
    ]);

    return createPaginatedResponse(data, total, pagination, "/api/admin/users", { status: filters?.status || "" });
  },
  get: (id: number) => prisma.admin.findUnique({ where: { id }, select: baseSelect }),
  create: (data: Prisma.AdminCreateInput) => prisma.admin.create({ data, select: baseSelect }),
  update: (id: number, data: Prisma.AdminUpdateInput) =>
    prisma.admin.update({ where: { id }, data, select: baseSelect }),
  delete: (id: number) => prisma.admin.delete({ where: { id }, select: baseSelect }),
  toggleStatus: async (id: number) => {
    const admin = await prisma.admin.findUnique({ where: { id } });
    if (!admin) throw new Error("Invalid: Admin not found");
    const newStatus = admin.status === "Active" ? "Inactive" : "Active";
    return prisma.admin.update({
      where: { id },
      data: { status: newStatus },
      select: baseSelect,
    });
  },
};
