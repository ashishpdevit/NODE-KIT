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
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.NotificationSelect;

export const adminNotificationService = {
  list: async (filters?: { user_type?: string; read?: boolean }) => {
    const where: Prisma.NotificationWhereInput = {};
    
    if (filters?.user_type) {
      where.user_type = filters.user_type;
    }
    
    if (filters?.read !== undefined) {
      where.read = filters.read;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { created_at: "desc" },
      select: baseSelect,
    });
    return notifications;
  },

  get: async (id: number) => {
    const notification = await prisma.notification.findUnique({
      where: { id },
      select: baseSelect,
    });
    return notification;
  },

  create: async (data: { user_id: number; user_type?: string; title: string; message: string; read?: boolean }) => {
    const created = await prisma.notification.create({
      data: {
        user_id: data.user_id,
        user_type: data.user_type || "user",
        title: data.title,
        message: data.message,
        read: data.read || false,
      },
      select: baseSelect,
    });
    return created;
  },

  createForUser: async (userId: number, title: string, message: string, userType: string = "user") => {
    const notification = await prisma.notification.create({
      data: {
        user_id: userId,
        user_type: userType,
        title,
        message,
        read: false,
      },
      select: baseSelect,
    });
    return notification;
  },

  createForAllUsers: async (title: string, message: string, userType: string = "user") => {
    // Get all users of the specified type
    const users = await prisma.appUser.findMany({
      where: { status: "active" },
      select: { id: true },
    });

    if (users.length === 0) {
      return [];
    }

    // Create notifications for all users
    const notifications = await Promise.all(
      users.map((user) =>
        prisma.notification.create({
          data: {
            user_id: user.id,
            user_type: userType,
            title,
            message,
            read: false,
          },
          select: baseSelect,
        })
      )
    );

    return notifications;
  },

  update: async (id: number, data: Prisma.NotificationUpdateInput) => {
    const updated = await prisma.notification.update({
      where: { id },
      data,
      select: baseSelect,
    });
    return updated;
  },

  delete: async (id: number) => {
    const removed = await prisma.notification.delete({
      where: { id },
      select: baseSelect,
    });
    return removed;
  },
};
