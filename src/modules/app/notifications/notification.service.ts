import type { Prisma } from "@prisma/client";

import { prisma } from "@/core/lib/prisma";

const baseSelect = {
  id: true,
  user_id: true,
  user_type: true,
  title: true,
  message: true,
  read: true,
  created_at: true,
} satisfies Prisma.NotificationSelect;

export const notificationService = {
  list: async (userId: number) => {
    const notifications = await prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      select: baseSelect,
    });
    return notifications;
  },

  get: async (id: number, userId: number) => {
    const notification = await prisma.notification.findFirst({
      where: { id, user_id: userId },
      select: baseSelect,
    });
    return notification;
  },

  updateStatus: async (id: number, userId: number, read: boolean) => {
    const notification = await prisma.notification.updateMany({
      where: { id, user_id: userId },
      data: { read },
    });
    return notification;
  },

  clearAll: async (userId: number) => {
    const result = await prisma.notification.deleteMany({
      where: { user_id: userId },
    });
    return result;
  },

  create: async (data: Prisma.NotificationCreateInput) => {
    const created = await prisma.notification.create({
      data,
      select: baseSelect,
    });
    return created;
  },

  markAllAsRead: async (userId: number) => {
    const result = await prisma.notification.updateMany({
      where: { user_id: userId, read: false },
      data: { read: true },
    });
    return result;
  },
};
