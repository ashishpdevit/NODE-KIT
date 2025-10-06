import type { Prisma } from "@prisma/client";

import { prisma } from "@/core/lib/prisma";

const baseSelect = {
  id: true,
  customerName: true,
  total: true,
  status: true,
  date: true,
  customerId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.OrderSelect;

const generateOrderId = async (): Promise<string> => {
  const lastOrder = await prisma.order.findFirst({
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  const lastNumeric = lastOrder ? Number(/(\d+)$/.exec(lastOrder.id)?.[1] ?? 0) : 0;
  const nextNumeric = Number.isFinite(lastNumeric) ? lastNumeric + 1 : 1;
  return `ORD-${nextNumeric.toString().padStart(3, "0")}`;
};

type OrderCreatePayload = Prisma.OrderUncheckedCreateInput & { id?: string };

type OrderUpdatePayload = Prisma.OrderUncheckedUpdateInput;

export const orderService = {
  list: (status?: string) =>
    prisma.order.findMany({
      where: status ? { status } : undefined,
      orderBy: { date: "desc" },
      select: baseSelect,
    }),
  get: (id: string) => prisma.order.findUnique({ where: { id }, select: baseSelect }),
  create: async (data: OrderCreatePayload) => {
    const id = data.id ?? (await generateOrderId());
    const payload: Prisma.OrderUncheckedCreateInput = {
      ...data,
      id,
    };
    return prisma.order.create({
      data: payload,
      select: baseSelect,
    });
  },
  update: (id: string, data: OrderUpdatePayload) =>
    prisma.order.update({ where: { id }, data, select: baseSelect }),
  delete: (id: string) => prisma.order.delete({ where: { id }, select: baseSelect }),
};
